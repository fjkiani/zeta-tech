#!/usr/bin/env node
/**
 * Track C (handoff §7 / P1): refresh data/lessons.json from live Hygraph
 * so the static lesson file stops drifting from the CMS.
 *
 * Merge rules:
 *   - Hygraph PUBLISHED VIDEO MediaItems are upserted by id (slug).
 *   - Static-only fields (transcriptFile, contextFile) are preserved for
 *     lessons that exist in both.
 *   - Static lessons with no Hygraph counterpart are kept (marked source:"static").
 *
 * Usage: node scripts/sync-hygraph.js [--dry-run]
 * Env:   HYGRAPH_URL (or NEXT_PUBLIC_HYGRAPH_URL), optional HYGRAPH_TOKEN.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchHygraphLessons, isHygraphConfigured } from "../lib/hygraph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const LESSONS_FILE = path.join(DATA_DIR, "lessons.json");
const dryRun = process.argv.includes("--dry-run");

if (!isHygraphConfigured()) {
  console.error("HYGRAPH_URL not set — nothing to sync from.");
  process.exit(1);
}

const staticLessons = JSON.parse(fs.readFileSync(LESSONS_FILE, "utf8"));
let hygraphLessons;
try {
  hygraphLessons = await fetchHygraphLessons();
} catch (err) {
  console.error(`Hygraph fetch failed: ${err.message}`);
  process.exit(2);
}

const staticById = new Map(staticLessons.map((l) => [l.id, l]));
const added = [];
const updated = [];
const noVideo = [];

for (const h of hygraphLessons) {
  if (!h.videoUrl && !h.videoFileUrl) noVideo.push(h.id);
  const existing = staticById.get(h.id);
  if (existing) {
    const merged = {
      ...existing, // keeps transcriptFile/contextFile and any static extras
      ...h,
      transcriptFile: existing.transcriptFile,
      contextFile: existing.contextFile,
      source: "hygraph",
    };
    staticById.set(h.id, merged);
    updated.push(h.id);
  } else {
    staticById.set(h.id, h);
    added.push(h.id);
  }
}

const merged = [...staticById.values()];
const withMp4 = merged.filter((l) => l.videoUrl || l.videoFileUrl);

console.log(`static lessons: ${staticLessons.length}`);
console.log(`hygraph published VIDEO items: ${hygraphLessons.length}`);
console.log(`added: ${added.length}${added.length ? " → " + added.join(", ") : ""}`);
console.log(`updated: ${updated.length}${updated.length ? " → " + updated.join(", ") : ""}`);
console.log(`hygraph items WITHOUT mp4 (content gap, not code): ${noVideo.length}${noVideo.length ? " → " + noVideo.join(", ") : ""}`);
console.log(`merged lessons total: ${merged.length}; with usable mp4: ${withMp4.length}${withMp4.length ? " → " + withMp4.map((l) => l.id).join(", ") : ""}`);

if (!dryRun) {
  fs.writeFileSync(LESSONS_FILE, JSON.stringify(merged, null, 2) + "\n");
  console.log(`written: ${LESSONS_FILE}`);
} else {
  console.log("dry-run: lessons.json not written");
}
