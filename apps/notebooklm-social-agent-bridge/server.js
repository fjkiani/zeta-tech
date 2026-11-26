import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getLangGraphConfig,
  healthCheck,
  uploadPost,
} from "./lib/langgraph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4317);
const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), "utf8"));
}

function loadLessons() {
  return readJson("lessons.json");
}

function loadLesson(id) {
  const lessons = loadLessons();
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      const lg = await healthCheck();
      return send(res, 200, {
        ok: true,
        service: "notebooklm-social-agent-bridge",
        zeta: "zeta-tech",
        time: new Date().toISOString(),
        langgraph: lg,
        config: getLangGraphConfig(),
      });
    }

    if (req.method === "GET" && pathname === "/api/lessons") {
      const lessons = loadLessons().map(
        ({ transcript, context, ...rest }) => rest,
      );
      return send(res, 200, { count: lessons.length, lessons });
    }

    const lessonMatch = pathname.match(/^\/api\/lessons\/([^/]+)$/);
    if (req.method === "GET" && lessonMatch) {
      const lesson = loadLesson(decodeURIComponent(lessonMatch[1]));
      if (!lesson) return send(res, 404, { error: "lesson_not_found" });
      return send(res, 200, lesson);
    }

    if (req.method === "POST" && pathname === "/api/draft") {
      const body = await readBody(req);
      const lesson = loadLesson(body.lessonId);
      if (!lesson) return send(res, 404, { error: "lesson_not_found" });
      const post = draftFromLesson(lesson, { platform: body.platform });
      return send(res, 200, {
        lessonId: lesson.id,
        title: lesson.title,
        platform: body.platform || "linkedin",
        post,
        chars: post.length,
      });
    }

    if (req.method === "POST" && pathname === "/api/upload") {
      const body = await readBody(req);
      let post = (body.post || "").trim();
      if (!post && body.lessonId) {
        const lesson = loadLesson(body.lessonId);
        if (!lesson) return send(res, 404, { error: "lesson_not_found" });
        post = draftFromLesson(lesson, { platform: body.platform });
      }
      if (!post) {
        return send(res, 400, {
          error: "missing_post",
          hint: "Provide post text or lessonId",
        });
      }

      const dryRun = body.dryRun === true || body.dry_run === true;
      if (dryRun) {
        return send(res, 200, {
          dryRun: true,
          post,
          chars: post.length,
          langgraph: getLangGraphConfig(),
        });
      }

      try {
        const result = await uploadPost(post, { wait: body.wait !== false });
        return send(res, 200, {
          ok: true,
          post,
          ...result,
        });
      } catch (err) {
        return send(res, err.code === "LANGGRAPH_UNREACHABLE" ? 503 : 502, {
          ok: false,
          error: err.message,
          code: err.code || null,
          langgraph: getLangGraphConfig(),
        });
      }
    }

    if (req.method === "GET" && (pathname === "/" || pathname.startsWith("/"))) {
      return serveStatic(pathname, res);
    }

    send(res, 404, { error: "not_found" });
  } catch (err) {
    console.error("[bridge]", err);
    send(res, 500, { error: "internal", message: String(err.message || err) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[bridge] notebooklm-social-agent-bridge listening on http://127.0.0.1:${PORT}`,
  );
  console.log(`[bridge] LangGraph → ${getLangGraphConfig().apiUrl}`);
});
