import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  getLangGraphConfig,
  healthCheck,
  uploadPost,
} from "./lib/langgraph.js";
import {
  getHygraphConfig,
  fetchHygraphLessons,
  isHygraphConfigured,
} from "./lib/hygraph.js";
import { buildSuggestion } from "./lib/gtm-prompts.js";
import {
  getClerkConfig,
  verifyClerkToken,
  bearerFromRequest,
} from "./lib/clerk-auth.js";
import { getLlmConfig, chatComplete, parseJsonContent } from "./lib/llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Minimal .env loader (no dotenv dep). Does not override existing process.env. */
function loadDotEnv(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadDotEnv(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 4317);
const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const AUDIT_LOG = path.join(DATA_DIR, "audit.log");
const APPROVALS_FILE = path.join(DATA_DIR, "approvals.json");
const SCHEDULED_FILE = path.join(DATA_DIR, "scheduled.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

// ---------------------------------------------------------------------------
// Structured logs + append-only audit trail (handoff §3 checklist)
// ---------------------------------------------------------------------------

function newRid() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function log(obj) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...obj }));
}

function audit(evt, fields = {}) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(
      AUDIT_LOG,
      JSON.stringify({ ts: new Date().toISOString(), evt, ...fields }) + "\n",
    );
  } catch (err) {
    log({ evt: "audit_write_failed", error: String(err.message || err) });
  }
}

function auditRows() {
  try {
    return fs.readFileSync(AUDIT_LOG, "utf8").split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Auth gate: BRIDGE_API_KEY and/or Clerk session JWT (OPEN-1).
// Mutating POSTs require at least one configured gate to pass.
// GETs + dry-runs stay open (no side effects).
// ---------------------------------------------------------------------------

function authModeLabel() {
  const clerk = getClerkConfig().enabled;
  const key = Boolean(process.env.BRIDGE_API_KEY);
  if (clerk && key) return "clerk+api_key";
  if (clerk) return "clerk";
  if (key) return "api_key";
  return "open";
}

async function authorized(req, url, body = {}) {
  const clerkCfg = getClerkConfig();
  const expectedKey = process.env.BRIDGE_API_KEY;
  const gates = [];
  if (clerkCfg.enabled) gates.push("clerk");
  if (expectedKey) gates.push("api_key");

  // No gates configured → open (Phase-0 / local). Prefer setting Clerk or key.
  if (gates.length === 0) return { ok: true, mode: "open" };

  if (expectedKey) {
    const provided =
      req.headers["x-bridge-key"] ||
      url.searchParams.get("key") ||
      body.bridgeApiKey;
    if (provided === expectedKey) return { ok: true, mode: "api_key" };
  }

  if (clerkCfg.enabled) {
    const token = bearerFromRequest(req) || body.clerkToken || null;
    if (token) {
      try {
        const verified = await verifyClerkToken(token);
        if (verified.ok) {
          return {
            ok: true,
            mode: "clerk",
            userId: verified.userId,
            sessionId: verified.sessionId,
          };
        }
      } catch (err) {
        log({ evt: "clerk_verify_failed", error: String(err.message || err) });
      }
    }
  }

  return {
    ok: false,
    mode: authModeLabel(),
    hint: clerkCfg.enabled
      ? "Sign in with Clerk (Authorization: Bearer <session>) or pass x-bridge-key"
      : "Pass BRIDGE_API_KEY as x-bridge-key header or ?key=",
  };
}

// ---------------------------------------------------------------------------
// Fail-closed media check (handoff §3): reject non-video/image URLs early.
// ---------------------------------------------------------------------------

export async function checkMediaUrl(url) {
  const assertMedia = (contentType) => {
    const ct = (contentType || "").toLowerCase();
    if (!ct.startsWith("video/") && !ct.startsWith("image/")) {
      const err = new Error(
        `Media URL is not video/image (content-type: ${ct || "unknown"}). ` +
          `If this is intentional, pass skipMediaHeadCheck: true.`,
      );
      err.code = "MEDIA_REJECTED";
      err.contentType = ct || null;
      throw err;
    }
  };

  let res;
  try {
    res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
  } catch (err) {
    const e = new Error(`Media URL unreachable: ${err.message || err}`);
    e.code = "MEDIA_UNREACHABLE";
    throw e;
  }

  // Some CDNs answer HEAD poorly; fall back to a 1-byte ranged GET.
  if (!res.ok || !res.headers.get("content-type")) {
    try {
      res = await fetch(url, {
        headers: { range: "bytes=0-1" },
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      const e = new Error(`Media URL unreachable: ${err.message || err}`);
      e.code = "MEDIA_UNREACHABLE";
      throw e;
    }
  }

  assertMedia(res.headers.get("content-type"));
  return { contentType: res.headers.get("content-type"), status: res.status };
}

// ---------------------------------------------------------------------------
// Lessons: static file or live Hygraph (handoff P1 drift fix)
// ---------------------------------------------------------------------------

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), "utf8"));
}

function stripBulk(lessons) {
  return lessons.map(({ transcript, context, ...rest }) => rest);
}

async function loadLessons(source = "auto") {
  if (source === "static") return { lessons: readJson("lessons.json"), source: "static" };
  if (source === "hygraph") {
    if (!isHygraphConfigured()) {
      const err = new Error("HYGRAPH_URL not configured");
      err.code = "HYGRAPH_UNAVAILABLE";
      throw err;
    }
    return { lessons: await fetchHygraphLessons(), source: "hygraph" };
  }
  // auto: prefer live Hygraph, fall back to static on any failure
  if (isHygraphConfigured()) {
    try {
      return { lessons: await fetchHygraphLessons(), source: "hygraph" };
    } catch (err) {
      log({ evt: "hygraph_fallback", error: String(err.message || err) });
    }
  }
  return { lessons: readJson("lessons.json"), source: "static" };
}

async function loadLesson(id, source = "auto") {
  const { lessons } = await loadLessons(source);
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return null;
  const full = { ...lesson };
  if (lesson.transcriptFile) {
    const p = path.join(DATA_DIR, lesson.transcriptFile);
    if (fs.existsSync(p)) full.transcript = fs.readFileSync(p, "utf8");
  }
  if (lesson.contextFile) {
    const p = path.join(DATA_DIR, lesson.contextFile);
    if (fs.existsSync(p)) full.context = fs.readFileSync(p, "utf8");
  }
  return full;
}

function draftFromLesson(lesson, { platform = "linkedin" } = {}) {
  const title = lesson.title || lesson.id;
  const body = (lesson.excerpt || lesson.transcript || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const opener =
    platform === "tiktok"
      ? `Zeta Tech classroom drop — ${title}`
      : `From today's Zeta Tech session: ${title}`;
  const closer =
    platform === "tiktok"
      ? "\n\n#ZetaTech #AI #NotebookLM"
      : "\n\nBuilt with NotebookLM artifacts → social agent bridge.";
  return `${opener}\n\n${body}${body.endsWith(".") ? "" : "…"}${closer}\n\n(${stamp})`;
}

// ---------------------------------------------------------------------------
// HITL approval queue (handoff brittleness row). File-backed, zero-dep.
// The approve path is DRY-RUN ONLY — it never posts live.
// ---------------------------------------------------------------------------

function readApprovals() {
  try {
    return JSON.parse(fs.readFileSync(APPROVALS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeApprovals(list) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(list, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Scheduled posts (console product completeness). File-backed. The scheduler
// NEVER posts by itself: due items flip to status:"due" and are released
// through the approvals flow (approve = dry-run unless LIVE=1 + publishOnApprove).
// ---------------------------------------------------------------------------

function readScheduled() {
  try {
    return JSON.parse(fs.readFileSync(SCHEDULED_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeScheduled(list) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SCHEDULED_FILE, JSON.stringify(list, null, 2) + "\n");
}

function markDueScheduled() {
  const items = readScheduled();
  const now = Date.now();
  let changed = false;
  for (const item of items) {
    if (item.status === "scheduled" && Date.parse(item.scheduledFor) <= now) {
      item.status = "due";
      item.dueAt = new Date().toISOString();
      changed = true;
      audit("schedule_due", { rid: "scheduler", scheduleId: item.id });
    }
  }
  if (changed) writeScheduled(items);
}

// ---------------------------------------------------------------------------
// GTM Strategist v0 (handoff §5): deterministic 2-week ranked calendar. No LLM.
// ---------------------------------------------------------------------------

function buildCalendar(lessons, { horizonDays = 14, perWeek = 3 } = {}) {
  const now = Date.now();
  const scored = lessons.map((l) => {
    const artifacts = Array.isArray(l.artifacts) ? l.artifacts.length : 0;
    const hasVideo = Boolean(l.videoUrl || l.videoFileUrl);
    const created = Date.parse(l.createdAt || l.publishedAt || "") || NaN;
    const ageDays = Number.isFinite(created)
      ? Math.max(0, (now - created) / 86400000)
      : 30;
    const freshness = Math.max(0, 3 - ageDays / 7); // 3pts now → 0 at 3wks
    const score =
      (hasVideo ? 2 : 0) + Math.min(3, artifacts) * 0.5 + freshness;
    return { lesson: l, score, hasVideo, artifacts };
  });
  scored.sort((a, b) => b.score - a.score);

  const platforms = ["linkedin", "twitter"];
  const items = [];
  const total = Math.min(scored.length, Math.round((horizonDays / 7) * perWeek));
  for (let n = 0; n < total; n++) {
    const s = scored[n];
    const when = new Date(now + (n + 1) * 2 * 86400000); // every 2 days
    items.push({
      date: when.toISOString().slice(0, 10),
      lessonId: s.lesson.id,
      title: s.lesson.title,
      platform: platforms[n % platforms.length],
      score: Number(s.score.toFixed(2)),
      reasons: {
        video: s.hasVideo,
        artifacts: s.artifacts,
        ageDays: Number.isFinite(s.lesson.createdAt)
          ? Math.round((now - Date.parse(s.lesson.createdAt)) / 86400000)
          : null,
      },
    });
  }
  return { horizonDays, items };
}

// ---------------------------------------------------------------------------
// Static files + helpers
// ---------------------------------------------------------------------------

function send(res, status, body, headers = {}) {
  const payload =
    typeof body === "string" || Buffer.isBuffer(body)
      ? body
      : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type":
      typeof body === "string" && !headers["content-type"]
        ? "text/plain; charset=utf-8"
        : headers["content-type"] || "application/json; charset=utf-8",
    ...headers,
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function serveStatic(reqPath, res) {
  const safe = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(
    PUBLIC_DIR,
    safe === "/" || safe === "" ? "index.html" : safe,
  );
  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath)) {
    send(res, 404, { error: "not_found", path: reqPath });
    return;
  }
  const ext = path.extname(filePath);
  send(res, 200, fs.readFileSync(filePath), {
    "content-type": MIME[ext] || "application/octet-stream",
  });
}

const ALLOWED_PLATFORMS = new Set(["linkedin", "twitter", "tiktok"]);

function normalizePlatforms(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null; // unset = agent default
  const clean = raw.map((p) => String(p).toLowerCase()).filter((p) => ALLOWED_PLATFORMS.has(p));
  return clean.length ? clean : null;
}

const server = http.createServer(async (req, res) => {
  const rid = newRid();
  const started = Date.now();
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const { pathname } = url;

  const finish = (status, body, headers) => {
    log({ evt: "request", rid, method: req.method, path: pathname, status, ms: Date.now() - started });
    send(res, status, body, headers);
  };

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      const lg = await healthCheck();
      return finish(200, {
        ok: true,
        service: "notebooklm-social-agent-bridge",
        zeta: "zeta-tech",
        time: new Date().toISOString(),
        langgraph: lg,
        config: getLangGraphConfig(),
        auth: authModeLabel(),
        clerk: {
          enabled: getClerkConfig().enabled,
          // publishable key is public by design — FE needs it to boot Clerk JS
          publishableKey: getClerkConfig().publishableKey,
          frontendApi: getClerkConfig().frontendApi,
        },
        llm: (() => {
          const l = getLlmConfig();
          return {
            provider: l.provider,
            configured: l.configured,
            model: l.model,
            baseUrl: l.baseUrl,
          };
        })(),
        hygraph: { configured: isHygraphConfigured(), url: getHygraphConfig().url },
        auditRows: auditRows(),
      });
    }

    // Public auth bootstrap for the console (publishable key only — never secret).
    if (req.method === "GET" && pathname === "/api/auth/config") {
      const c = getClerkConfig();
      return finish(200, {
        auth: authModeLabel(),
        clerk: {
          enabled: c.enabled,
          publishableKey: c.publishableKey,
          frontendApi: c.frontendApi,
        },
      });
    }

    if (req.method === "GET" && pathname === "/api/lessons") {
      const source = url.searchParams.get("source") || "auto";
      try {
        const { lessons, source: used } = await loadLessons(source);
        return finish(200, { count: lessons.length, source: used, lessons: stripBulk(lessons) });
      } catch (err) {
        const status = err.code === "HYGRAPH_UNAVAILABLE" ? 503 : 502;
        return finish(status, { error: err.code || "lessons_failed", message: err.message });
      }
    }

    const lessonMatch = pathname.match(/^\/api\/lessons\/([^/]+)$/);
    if (req.method === "GET" && lessonMatch) {
      const source = url.searchParams.get("source") || "auto";
      const lesson = await loadLesson(decodeURIComponent(lessonMatch[1]), source);
      if (!lesson) return finish(404, { error: "lesson_not_found" });
      return finish(200, lesson);
    }

    if (req.method === "GET" && pathname === "/api/approvals") {
      return finish(200, { count: readApprovals().length, approvals: readApprovals() });
    }

    if (req.method === "GET" && pathname === "/api/audit") {
      // Read-only tail for the console's audit viewer (last 50 events).
      const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
      try {
        const lines = fs.readFileSync(AUDIT_LOG, "utf8").split("\n").filter(Boolean);
        const events = lines.slice(-limit).map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return { evt: "unparsable", raw: l };
          }
        });
        return finish(200, { count: events.length, total: lines.length, events });
      } catch {
        return finish(200, { count: 0, total: 0, events: [] });
      }
    }

    if (req.method === "GET" && pathname === "/api/schedule") {
      markDueScheduled();
      const items = readScheduled();
      return finish(200, {
        count: items.length,
        scheduler: {
          autoPost: false,
          note: "Due items are NEVER auto-posted; they flip to status:'due' and release via the approvals flow.",
        },
        items,
      });
    }

    if (req.method === "POST" && pathname === "/api/schedule") {
      const body = await readBody(req);
      const authz = await authorized(req, url, body);
      if (!authz.ok) return finish(401, { error: "unauthorized", hint: authz.hint });

      const when = Date.parse(body.scheduledFor || "");
      if (!Number.isFinite(when)) {
        return finish(400, { error: "invalid_scheduledFor", hint: "ISO datetime, e.g. 2026-11-27T14:00:00Z" });
      }
      if (when <= Date.now()) {
        return finish(400, { error: "scheduledFor_must_be_future" });
      }
      const post = (body.post || "").trim();
      let lesson = null;
      if (!post && body.lessonId) {
        lesson = await loadLesson(body.lessonId);
        if (!lesson) return finish(404, { error: "lesson_not_found" });
      } else if (body.lessonId) {
        lesson = await loadLesson(body.lessonId);
      }
      if (!post && !lesson) {
        return finish(400, { error: "missing_post", hint: "Provide post text or lessonId" });
      }

      const platforms = normalizePlatforms(body.platforms);
      const items = readScheduled();
      const id = crypto.randomUUID().slice(0, 8);
      items.push({
        id,
        ts: new Date().toISOString(),
        status: "scheduled",
        scheduledFor: new Date(when).toISOString(),
        post: post || draftFromLesson(lesson, { platform: body.platform }),
        lessonId: body.lessonId || null,
        platforms: platforms || ["linkedin", "twitter"],
        publishOnApprove: body.publishOnApprove === true, // default false
        media: {
          videoUrl: body.videoUrl || lesson?.videoFileUrl || lesson?.videoUrl || null,
          imageUrl: body.imageUrl || null,
        },
      });
      writeScheduled(items);
      audit("schedule_created", { rid, scheduleId: id, scheduledFor: items[items.length - 1].scheduledFor });
      return finish(202, {
        queued: true,
        scheduleId: id,
        status: "scheduled",
        scheduledFor: items[items.length - 1].scheduledFor,
        publishOnApprove: body.publishOnApprove === true,
        rid,
        note: "Parked. At due time the item flips to 'due' and releases via approvals — the scheduler never posts by itself.",
      });
    }

    const cancelMatch = pathname.match(/^\/api\/schedule\/([^/]+)\/cancel$/);
    if (req.method === "POST" && cancelMatch) {
      const body = await readBody(req);
      const authz = await authorized(req, url, body);
      if (!authz.ok) return finish(401, { error: "unauthorized", hint: authz.hint });
      const items = readScheduled();
      const item = items.find((s) => s.id === cancelMatch[1]);
      if (!item) return finish(404, { error: "schedule_not_found" });
      if (item.status !== "scheduled" && item.status !== "due") {
        return finish(409, { error: "already_resolved", status: item.status });
      }
      item.status = "cancelled";
      item.resolvedAt = new Date().toISOString();
      writeScheduled(items);
      audit("schedule_cancelled", { rid, scheduleId: item.id });
      return finish(200, { scheduleId: item.id, status: "cancelled", rid });
    }

    if (req.method === "GET" && pathname === "/api/media-check") {
      const mediaUrl = url.searchParams.get("url");
      if (!mediaUrl) return finish(400, { error: "missing_url" });
      try {
        const info = await checkMediaUrl(mediaUrl);
        return finish(200, { ok: true, url: mediaUrl, ...info });
      } catch (err) {
        return finish(400, {
          ok: false,
          url: mediaUrl,
          error: err.code || "media_rejected",
          message: err.message,
        });
      }
    }

    if (req.method === "GET" && pathname === "/api/calendar") {
      const { lessons, source } = await loadLessons(url.searchParams.get("source") || "auto");
      return finish(200, {
        generatedAt: new Date().toISOString(),
        lessonsSource: source,
        deterministic: true,
        ...buildCalendar(lessons),
      });
    }

    // GTM suggest: stub by default; optional live LLM via ?runLlm=1 (OpenRouter / openai-compatible).
    // Stub path always available — keeps prior deterministic behavior.
    if (req.method === "GET" && pathname === "/api/calendar/suggest") {
      const { lessons, source } = await loadLessons(url.searchParams.get("source") || "auto");
      const calendar = buildCalendar(lessons);
      const base = {
        generatedAt: new Date().toISOString(),
        lessonsSource: source,
        deterministic: true,
        ...calendar,
        suggestion: { llm: "not called", ...buildSuggestion(calendar) },
      };
      const runLlm =
        url.searchParams.get("runLlm") === "1" ||
        url.searchParams.get("run") === "1";
      if (!runLlm) return finish(200, base);

      const llmCfg = getLlmConfig();
      if (!llmCfg.configured) {
        return finish(200, {
          ...base,
          suggestion: {
            ...base.suggestion,
            llm: "skipped — not configured",
            provider: llmCfg.provider,
            model: llmCfg.model,
          },
        });
      }

      try {
        const prompts = buildSuggestion(calendar);
        const completion = await chatComplete({
          messages: [
            { role: "system", content: prompts.systemPrompt },
            { role: "user", content: prompts.userPrompt },
          ],
        });
        const parsed = parseJsonContent(completion.content);
        audit("gtm_llm_suggest", {
          rid,
          provider: completion.provider,
          model: completion.model,
          parsed: Boolean(parsed),
        });
        return finish(200, {
          ...base,
          suggestion: {
            llm: "called",
            provider: completion.provider,
            model: completion.model,
            usage: completion.usage,
            systemPrompt: prompts.systemPrompt,
            userPrompt: prompts.userPrompt,
            raw: completion.content,
            captions: parsed,
          },
        });
      } catch (err) {
        audit("gtm_llm_failed", { rid, error: err.message, code: err.code || null });
        return finish(502, {
          error: err.code || "llm_failed",
          message: err.message,
          suggestion: base.suggestion,
        });
      }
    }

    if (req.method === "POST" && pathname === "/api/draft") {
      const body = await readBody(req);
      const lesson = await loadLesson(body.lessonId);
      if (!lesson) return finish(404, { error: "lesson_not_found" });
      const post = draftFromLesson(lesson, { platform: body.platform });
      return finish(200, {
        lessonId: lesson.id,
        title: lesson.title,
        platform: body.platform || "linkedin",
        post,
        chars: post.length,
        rid,
      });
    }

    if (req.method === "POST" && pathname === "/api/upload") {
      const body = await readBody(req);
      const isDryRun = body.dryRun === true || body.dry_run === true;
      // Dry-run performs no side effects — stays open like GETs.
      // Anything that can post or queue (live upload, HITL parking) is gated.
      if (!isDryRun) {
        const authz = await authorized(req, url, body);
        if (!authz.ok) {
          audit("upload_rejected_auth", { rid, mode: authz.mode });
          return finish(401, {
            error: "unauthorized",
            hint: authz.hint || "Pass Clerk Bearer token or x-bridge-key",
          });
        }
      }

      let post = (body.post || "").trim();
      let lesson = null;
      if (!post && body.lessonId) {
        lesson = await loadLesson(body.lessonId);
        if (!lesson) return finish(404, { error: "lesson_not_found" });
        post = draftFromLesson(lesson, { platform: body.platform });
      } else if (body.lessonId) {
        lesson = await loadLesson(body.lessonId);
      }
      if (!post) {
        return finish(400, {
          error: "missing_post",
          hint: "Provide post text or lessonId",
        });
      }

      const cfg = getLangGraphConfig();
      const postToOrg =
        body.postToLinkedInOrganization !== undefined
          ? Boolean(body.postToLinkedInOrganization)
          : body.target === "personal"
            ? false
            : cfg.postToLinkedInOrganization;
      const orgId =
        body.linkedInOrganizationId ||
        body.organizationId ||
        cfg.linkedInOrganizationId;
      const platforms = normalizePlatforms(body.platforms);
      // Prefer explicit videoUrl; else lesson.videoFileUrl / videoUrl / artifacts video
      const videoUrl =
        body.videoUrl ||
        body.video_url ||
        lesson?.videoFileUrl ||
        lesson?.videoUrl ||
        lesson?.artifacts?.find?.(
          (a) => typeof a === "string" && /\.(mp4|webm|mov)(\?|$)/i.test(a),
        ) ||
        null;
      const imageUrl = body.imageUrl || body.image_url || null;

      // Fail-closed media check (handoff §3) — only when we would post media live
      const skipMediaCheck = body.skipMediaHeadCheck === true;
      if (!isDryRun && videoUrl && !skipMediaCheck) {
        try {
          const media = await checkMediaUrl(videoUrl);
          log({ evt: "media_check", rid, ok: true, ...media });
        } catch (err) {
          audit("upload_rejected_media", { rid, videoUrl, error: err.message });
          return finish(400, {
            error: err.code || "media_rejected",
            message: err.message,
            videoUrl,
          });
        }
      }

      if (isDryRun) {
        const effectivePlatforms = platforms || ["linkedin", "twitter"];
        return finish(200, {
          dryRun: true,
          rid,
          post,
          chars: post.length,
          platforms: effectivePlatforms,
          // Same shape upload_post returns live (langchain-social-agent Track A):
          // Array<{ platform, attempted, ok, urn?, error? }>. A dry-run attempts
          // nothing and posts nothing — attempted:false, ok:false by design.
          results: effectivePlatforms.map((p) => ({
            platform: p,
            attempted: false,
            ok: false,
            error: "dry-run: no post made",
          })),
          target: {
            organization: postToOrg,
            organizationId: orgId,
            vanity: cfg.linkedInOrgVanity,
            name: cfg.linkedInOrgName,
          },
          media: { videoUrl, imageUrl },
          langgraph: cfg,
        });
      }

      // HITL: park the post for human approval instead of posting (Track B)
      if (body.requireApproval === true) {
        const approvals = readApprovals();
        const approvalId = crypto.randomUUID().slice(0, 8);
        approvals.push({
          id: approvalId,
          ts: new Date().toISOString(),
          rid,
          status: "pending",
          post,
          platforms: platforms || ["linkedin", "twitter"],
          target: { organization: postToOrg, organizationId: orgId },
          media: { videoUrl, imageUrl },
          publishOnApprove: body.publishOnApprove === true, // default false; live only with LIVE=1
        });
        writeApprovals(approvals);
        audit("upload_queued_approval", { rid, approvalId });
        return finish(202, {
          queued: true,
          approvalId,
          status: "pending",
          publishOnApprove: body.publishOnApprove === true,
          liveEnabled: process.env.LIVE === "1",
          rid,
          note: "Post parked. Approve = dry-run receipt by default; live publish only when LIVE=1 AND publishOnApprove.",
        });
      }

      try {
        const result = await uploadPost(post, {
          wait: body.wait !== false,
          postToLinkedInOrganization: postToOrg,
          linkedInOrganizationId: orgId,
          videoUrl,
          imageUrl,
          mimeType: body.mimeType || body.mime_type,
          textOnly: videoUrl || imageUrl ? false : undefined,
          platforms: platforms || undefined,
        });
        audit("upload", { rid, platforms: platforms || ["linkedin", "twitter"], ok: true });
        return finish(200, { ok: true, post, rid, ...result });
      } catch (err) {
        audit("upload_failed", { rid, error: err.message });
        return finish(err.code === "LANGGRAPH_UNREACHABLE" ? 503 : 502, {
          ok: false,
          rid,
          error: err.message,
          code: err.code || null,
          langgraph: getLangGraphConfig(),
        });
      }
    }

    // HITL approve/reject (Track B). Approve = dry-run receipt only. Auth-gated.
    const approveMatch = pathname.match(/^\/api\/approvals\/([^/]+)\/(approve|reject)$/);
    if (req.method === "POST" && approveMatch) {
      const body = await readBody(req);
      const authz = await authorized(req, url, body);
      if (!authz.ok) return finish(401, { error: "unauthorized", hint: authz.hint });

      const [, approvalId, action] = approveMatch;
      const approvals = readApprovals();
      const item = approvals.find((a) => a.id === approvalId);
      if (!item) return finish(404, { error: "approval_not_found" });
      if (item.status !== "pending") {
        return finish(409, { error: "already_resolved", status: item.status });
      }

      if (action === "reject") {
        item.status = "rejected";
        item.resolvedAt = new Date().toISOString();
        writeApprovals(approvals);
        audit("approval_rejected", { rid, approvalId });
        return finish(200, { approvalId, status: "rejected", rid });
      }

      // LIVE publish path: only when BOTH the env gate (LIVE=1) and the per-post
      // flag (publishOnApprove) are set. Default for both is off → dry-run.
      if (process.env.LIVE === "1" && item.publishOnApprove === true) {
        try {
          const result = await uploadPost(item.post, {
            wait: true,
            postToLinkedInOrganization: item.target?.organization,
            linkedInOrganizationId: item.target?.organizationId,
            videoUrl: item.media?.videoUrl || undefined,
            imageUrl: item.media?.imageUrl || undefined,
            platforms: item.platforms,
          });
          item.status = "published";
          item.resolvedAt = new Date().toISOString();
          item.publishReceipt = { mode: "live", results: result.results || null, threadId: result.threadId || null };
          writeApprovals(approvals);
          audit("approval_published_live", { rid, approvalId, results: result.results || null });
          return finish(200, {
            approvalId,
            status: "published",
            mode: "live",
            rid,
            ...result,
          });
        } catch (err) {
          item.status = "publish_failed";
          item.resolvedAt = new Date().toISOString();
          item.publishReceipt = { mode: "live", error: err.message };
          writeApprovals(approvals);
          audit("approval_publish_failed", { rid, approvalId, error: err.message });
          return finish(502, { approvalId, status: "publish_failed", rid, error: err.message });
        }
      }

      // APPROVE = DRY-RUN ONLY (Phase-1 default; LIVE=1 off by design; the
      // bridge never posts live unless LIVE=1 AND the post opted into
      // publishOnApprove).
      const cfg = getLangGraphConfig();
      item.status = "approved";
      item.resolvedAt = new Date().toISOString();
      item.approvalReceipt = {
        mode: "dry_run",
        post: item.post,
        platforms: item.platforms,
        target: {
          organization: item.target?.organization,
          organizationId: item.target?.organizationId,
          vanity: cfg.linkedInOrgVanity,
          name: cfg.linkedInOrgName,
        },
        media: item.media,
        note:
          "Dry-run receipt. To publish, re-POST /api/upload with this approvalId and requireApproval omitted — an upstream decision.",
      };
      writeApprovals(approvals);
      audit("approval_granted_dry_run", { rid, approvalId });
      return finish(200, { approvalId, status: "approved", rid, ...item.approvalReceipt });
    }

    if (req.method === "GET" && (pathname === "/" || pathname.startsWith("/"))) {
      return serveStatic(pathname, res);
    }

    finish(404, { error: "not_found" });
  } catch (err) {
    log({ evt: "error", rid, path: pathname, error: String(err.message || err) });
    send(res, 500, { error: "internal", rid, message: String(err.message || err) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const llm = getLlmConfig();
  log({
    evt: "listening",
    port: PORT,
    langgraph: getLangGraphConfig().apiUrl,
    auth: authModeLabel(),
    clerk: getClerkConfig().enabled,
    llm: { provider: llm.provider, configured: llm.configured, model: llm.model },
    live: process.env.LIVE === "1",
  });
});

// Scheduler tick: flip due items to "due" (never posts — see markDueScheduled).
setInterval(markDueScheduled, 60_000).unref();
