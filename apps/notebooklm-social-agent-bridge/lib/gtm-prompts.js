/**
 * GTM Strategist prompts — deterministic builder (always available).
 *
 * v0 (`buildCalendar` in server.js) ranks lessons with no LLM.
 * Live runs go through `lib/llm.js` when `/api/calendar/suggest?runLlm=1`
 * and OPENROUTER_API_KEY (or LLM_API_KEY) are set. Stub path stays default.
 *
 * Captions are grounded in full read-only lesson context packs
 * (`lib/lesson-context.js`): title, excerpt/transcript, artifact URLs,
 * provenance, Hygraph fields. Video/image URLs are never skipped when present.
 */

import { formatContextPackForPrompt } from "./lesson-context.js";

export function buildGtmSystemPrompt() {
  return [
    "You are the Zeta Tech GTM Strategist for CrisPRO.ai.",
    "Input: a ranked 2-week content calendar plus a READ-ONLY context pack per lesson",
    "(title, excerpt/transcript when present, artifact URLs, provenance, Hygraph fields).",
    "Task: for each scheduled item, write one platform-native caption (LinkedIn professional, Twitter/X concise),",
    "grounded ONLY in the provided context pack. Do not invent clinical claims, metrics,",
    "product promises, or missing transcript text.",
    "When MEDIA_VIDEO_URL or MEDIA_IMAGE_URLS are present, the caption MUST explicitly reference that media",
    "(e.g. that the post includes this video / name the file) and MUST NOT omit or invent URLs.",
    "Keep CrisPRO's precision-oncology positioning when the pack supports it; otherwise stay descriptive of the lesson title/tags only.",
    "If gaps include no_excerpt_or_transcript and there is still media, write a short media-aware caption from title/tags/provenance only — still cite the media URL.",
    "If there is no usable grounding at all, mark needs_review instead of guessing.",
    "Output strict JSON:",
    '{ "items": [{ "date": "YYYY-MM-DD", "lessonId": "…", "platform": "linkedin|twitter", "caption": "…" }] }',
  ].join(" ");
}

function formatCalendarItem(i) {
  const header = `- ${i.date} [${i.platform}] lesson=${i.lessonId} title="${i.title}" score=${i.score} artifacts=${i.reasons?.artifacts ?? 0} video=${i.reasons?.video}`;
  if (i.contextPack) {
    return [
      header,
      "  --- context pack (read-only) ---",
      ...formatContextPackForPrompt(i.contextPack, { platform: i.platform })
        .split("\n")
        .map((line) => `  ${line}`),
      "  --- end context pack ---",
    ].join("\n");
  }
  // Fallback for callers that only pass a thin excerpt (legacy).
  const excerpt = (i.excerpt || "").toString().replace(/\s+/g, " ").trim();
  const excerptBit = excerpt
    ? ` excerpt="${excerpt.slice(0, 280)}${excerpt.length > 280 ? "…" : ""}"`
    : " excerpt=(none)";
  const videoUrl = i.videoUrl || i.media?.videoUrl || null;
  const videoBit = videoUrl
    ? ` MEDIA_VIDEO_URL (must reference in caption): ${videoUrl}`
    : "";
  return `${header}${excerptBit}${videoBit}`;
}

export function buildGtmUserPrompt(calendar) {
  const blocks = (calendar.items || []).map(formatCalendarItem);
  return [
    "Ranked calendar with full lesson context packs (deterministic scores; read-only facts only):",
    ...blocks,
    "",
    "Write captions per the system rules.",
    "Never skip MEDIA_VIDEO_URL / MEDIA_IMAGE_URLS when listed.",
    "If an item has no excerpt/transcript AND no media URLs, mark it needs_review instead of guessing.",
  ].join("\n");
}

/** Suggest endpoint payload: calendar + ready prompts (no LLM call). */
export function buildSuggestion(calendar) {
  return {
    deterministic: true,
    llm: "not called — prompts are emitted for a future agent run",
    systemPrompt: buildGtmSystemPrompt(),
    userPrompt: buildGtmUserPrompt(calendar),
  };
}
