/**
 * GTM Strategist prompts — deterministic builder (always available).
 *
 * v0 (`buildCalendar` in server.js) ranks lessons with no LLM.
 * Live runs go through `lib/llm.js` when `/api/calendar/suggest?runLlm=1`
 * and OPENROUTER_API_KEY (or LLM_API_KEY) are set. Stub path stays default.
 */

export function buildGtmSystemPrompt() {
  return [
    "You are the Zeta Tech GTM Strategist for CrisPRO.ai.",
    "Input: a ranked 2-week content calendar (deterministic scores: video availability, artifact richness, freshness).",
    "Task: for each scheduled item, write one platform-native caption (LinkedIn professional, Twitter/X concise),",
    "grounded ONLY in the lesson title, excerpt, and artifacts provided. Do not invent clinical claims, metrics,",
    "or product promises. Keep CrisPRO's precision-oncology positioning. Output strict JSON:",
    '{ "items": [{ "date": "YYYY-MM-DD", "lessonId": "…", "platform": "linkedin|twitter", "caption": "…" }] }',
  ].join(" ");
}

export function buildGtmUserPrompt(calendar) {
  const lines = (calendar.items || []).map(
    (i) =>
      `- ${i.date} [${i.platform}] lesson=${i.lessonId} title="${i.title}" score=${i.score} artifacts=${i.reasons?.artifacts ?? 0} video=${i.reasons?.video}`,
  );
  return [
    "Ranked calendar (deterministic):",
    ...lines,
    "",
    "Write captions per the system rules. If an item has no excerpt/transcript, mark it needs_review instead of guessing.",
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
