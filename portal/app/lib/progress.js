import { getEventsForSession, EVENT_TYPES } from './tracking.js';

/**
 * Derive per-lesson progress from tracking events for a session.
 * lesson_view → started
 * quiz_submit → quizTaken
 * flashcard_rate → flashcardsUsed
 * artifact_download (or viewing slides) → slidesDownloaded (we don't have artifact_download yet; use lesson_view + slides as proxy later, or add event when they open slides)
 */
export function getProgressForSession(sessionId) {
  if (!sessionId) return { lessons: [] };
  const events = getEventsForSession(sessionId);
  const byLesson = {};

  for (const e of events) {
    const lid = e.lessonId;
    if (!lid) continue;
    if (!byLesson[lid]) {
      byLesson[lid] = { lessonId: lid, started: false, quizTaken: false, flashcardsUsed: false, slidesDownloaded: false };
    }
    const p = byLesson[lid];
    if (e.eventType === EVENT_TYPES.lesson_view) p.started = true;
    if (e.eventType === EVENT_TYPES.quiz_submit) p.quizTaken = true;
    if (e.eventType === EVENT_TYPES.flashcard_rate) p.flashcardsUsed = true;
    if (e.eventType === EVENT_TYPES.artifact_download && e.payload?.type === 'slideDeck') p.slidesDownloaded = true;
    if (e.eventType === EVENT_TYPES.artifact_view && e.payload?.type === 'slideDeck') p.slidesDownloaded = true;
  }

  return { lessons: Object.values(byLesson) };
}
