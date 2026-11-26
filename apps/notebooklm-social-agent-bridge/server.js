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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4317);
const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const AUDIT_LOG = path.join(DATA_DIR, "audit.log");
const APPROVALS_FILE = path.join(DATA_DIR, "approvals.json");

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
// Auth gate (handoff §3): BRIDGE_API_KEY protects mutating POSTs; GETs open.
// ---------------------------------------------------------------------------

function authorized(req, url, body = {}) {
  const expected = process.env.BRIDGE_API_KEY;
  if (!expected) return { ok: true, mode: "open" };
  const provided =
    req.headers["x-bridge-key"] ||
    url.searchParams.get("key") ||
    body.bridgeApiKey;
  return provided === expected
    ? { ok: true, mode: "api_key" }
    : { ok: false, mode: "api_key" };
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
        auth: process.env.BRIDGE_API_KEY ? "api_key" : "open",
        hygraph: { configured: isHygraphConfigured(), url: getHygraphConfig().url },
        auditRows: auditRows(),
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

    if (req.method === "GET" && pathname === "/api/calendar") {
      const { lessons, source } = await loadLessons(url.searchParams.get("source") || "auto");
      return finish(200, {
        generatedAt: new Date().toISOString(),
        lessonsSource: source,
        deterministic: true,
        ...buildCalendar(lessons),
      });
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
        const authz = authorized(req, url, body);
        if (!authz.ok) {
          audit("upload_rejected_auth", { rid });
          return finish(401, { error: "unauthorized", hint: "Pass BRIDGE_API_KEY as x-bridge-key header or ?key=" });
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
        return finish(200, {
          dryRun: true,
          rid,
          post,
          chars: post.length,
          platforms: platforms || ["linkedin", "twitter"],
          // Contract of upload_post results (langchain-social-agent Track A):
          // Array<{ platform, attempted, ok, urn?, error? }>
          resultContract: { platform: "linkedin|twitter|tiktok", attempted: "boolean", ok: "boolean", urn: "string?", error: "string?" },
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
        });
        writeApprovals(approvals);
        audit("upload_queued_approval", { rid, approvalId });
        return finish(202, {
          queued: true,
          approvalId,
          status: "pending",
          rid,
          note: "Post parked. Approve via POST /api/approvals/:id/approve (dry-run receipt) — never posted live by the bridge.",
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
      const authz = authorized(req, url, body);
      if (!authz.ok) return finish(401, { error: "unauthorized" });

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

      // APPROVE = DRY-RUN ONLY (LIVE=1 off by design; the bridge never posts live)
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
  log({
    evt: "listening",
    port: PORT,
    langgraph: getLangGraphConfig().apiUrl,
    auth: process.env.BRIDGE_API_KEY ? "api_key" : "open",
  });
});
