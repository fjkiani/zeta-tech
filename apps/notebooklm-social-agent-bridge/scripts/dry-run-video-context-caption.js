#!/usr/bin/env node
/**
 * Proof: read-only context pack for a lesson WITH video URL appears in the
 * GTM suggest prompt, and a grounded dry-run caption cites that media.
 *
 * No OpenRouter required. No Hygraph writes. No secrets printed.
 *
 * Usage:
 *   node scripts/dry-run-video-context-caption.js [lessonId]
 *   HYGRAPH_URL=… node scripts/dry-run-video-context-caption.js glassbox-ai
 *
 * Default lessonId: glassbox-ai
 * Exit 0 on pass; 1 on assertion failure.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLessonContextPack,
  formatContextPackForPrompt,
  groundedDryRunCaption,
} from "../lib/lesson-context.js";
import { buildSuggestion } from "../lib/gtm-prompts.js";
import {
  fetchHygraphLessons,
  isHygraphConfigured,
} from "../lib/hygraph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const LESSONS_FILE = path.join(DATA_DIR, "lessons.json");
const lessonId = process.argv[2] || "glassbox-ai";

/** Minimal .env loader (same as server) — does not print values. */
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
loadDotEnv(path.join(__dirname, "..", ".env"));

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`PASS: ${msg}`);
}

async function resolveLesson() {
  const staticLessons = JSON.parse(fs.readFileSync(LESSONS_FILE, "utf8"));
  let lesson = staticLessons.find((l) => l.id === lessonId) || null;
  let source = "static";

  if (isHygraphConfigured()) {
    try {
      const live = await fetchHygraphLessons();
      const h = live.find((l) => l.id === lessonId);
      if (h) {
        // Merge static extras (transcriptFile/contextFile) if present.
        lesson = { ...(lesson || {}), ...h, source: "hygraph" };
        source = "hygraph";
      }
    } catch (err) {
      console.log(`WARN: Hygraph read failed (${err.message}); using static only`);
    }
  }

  if (!lesson) fail(`lesson not found: ${lessonId}`);
  return { lesson, source };
}

const { lesson, source } = await resolveLesson();
const pack = buildLessonContextPack(lesson, { dataDir: DATA_DIR });
const videoUrl = pack.media?.videoUrl || null;

if (!videoUrl) {
  fail(
    `lesson ${lessonId} has no video URL in context pack (need a lesson WITH video)`,
  );
}
pass(`context pack built for ${lessonId} (source=${source})`);
pass(`MEDIA_VIDEO_URL present: ${videoUrl.slice(0, 64)}…`);

const calendar = {
  horizonDays: 14,
  items: [
    {
      date: new Date().toISOString().slice(0, 10),
      lessonId: pack.lessonId,
      title: pack.title,
      platform: "linkedin",
      score: 5,
      excerpt: pack.excerpt || pack.transcriptExcerpt || "",
      videoUrl,
      contextPack: pack,
      reasons: {
        video: true,
        artifacts: (pack.media?.artifactUrls || []).length,
        hasExcerpt: Boolean(pack.excerpt || pack.transcriptExcerpt),
        hasVideoUrl: true,
      },
    },
  ],
};

const suggestion = buildSuggestion(calendar);
const userPrompt = suggestion.userPrompt || "";
const systemPrompt = suggestion.systemPrompt || "";

if (!userPrompt.includes(videoUrl)) {
  fail("userPrompt does NOT contain the video URL — captions would skip media");
}
pass("userPrompt includes full MEDIA_VIDEO_URL (never skipped)");

if (!/MEDIA_VIDEO_URL \(must reference in caption\)/.test(userPrompt)) {
  fail("userPrompt missing explicit MEDIA_VIDEO_URL instruction line");
}
pass("userPrompt labels video as media the caption must reference");

if (!/must explicitly reference that media/i.test(systemPrompt)) {
  fail("systemPrompt missing media-reference rule");
}
pass("systemPrompt requires captions to reference media URLs");

if (!userPrompt.includes(pack.title)) {
  fail("userPrompt missing lesson title");
}
pass(`userPrompt includes title: ${pack.title}`);

const formatted = formatContextPackForPrompt(pack, { platform: "linkedin" });
if (!formatted.includes(videoUrl)) {
  fail("formatContextPackForPrompt omitted video URL");
}
pass("formatContextPackForPrompt cites video URL");

const caption = groundedDryRunCaption(pack, { platform: "linkedin" });
if (!caption.includes(videoUrl)) {
  fail("grounded dry-run caption does not cite video URL");
}
pass("grounded dry-run caption cites video URL");

const out = {
  ok: true,
  lessonId,
  source,
  title: pack.title,
  videoUrl,
  videoFileName: pack.media?.videoFileName || null,
  gaps: pack.gaps,
  provenance: pack.provenance,
  promptChars: { system: systemPrompt.length, user: userPrompt.length },
  dryRunCaption: caption,
  // Truncate prompt sample for console (full URL still present above).
  userPromptSample: userPrompt.slice(0, 1200),
};

console.log("\n--- dry-run result (no secrets) ---");
console.log(JSON.stringify(out, null, 2));
console.log("\nALL ASSERTIONS PASSED");
process.exit(0);
