import { getEventsForLesson, getEventsForSession, EVENT_TYPES } from './tracking.js';

/**
 * Compute understanding gaps from events. Scaffolding: uses quiz wrong answers
 * and flashcard "still_learning" to suggest review. Can be extended with
 * concept IDs and lesson-section mapping.
 */
export function computeGapsFromEvents(events) {
  const gaps = [];
  const seen = new Set();

  for (const event of events) {
    if (event.eventType === EVENT_TYPES.quiz_submit && event.payload) {
      const { score, total, questions } = event.payload;
      if (Array.isArray(questions)) {
        for (const q of questions) {
          if (q.correct === false && q.questionIndex != null) {
            const key = `${event.lessonId}-q-${q.questionIndex}`;
            if (!seen.has(key)) {
              seen.add(key);
              gaps.push({
                lessonId: event.lessonId,
                type: 'quiz_question',
                questionIndex: q.questionIndex,
                suggestedAction: 'review_section',
                conceptLabel: null,
              });
            }
          }
        }
      }
      if (total > 0 && score != null && score < total) {
        const key = `${event.lessonId}-score`;
        if (!seen.has(key)) {
          seen.add(key);
          gaps.push({
            lessonId: event.lessonId,
            type: 'quiz_score',
            score,
            total,
            suggestedAction: 'retake_quiz',
            conceptLabel: null,
          });
        }
      }
    }
    if (event.eventType === EVENT_TYPES.flashcard_rate && event.payload?.rating === 'still_learning') {
      const key = `${event.lessonId}-card-${event.payload.cardIndex ?? '?'}`;
      if (!seen.has(key)) {
        seen.add(key);
        gaps.push({
          lessonId: event.lessonId,
          type: 'flashcard',
          cardIndex: event.payload.cardIndex,
          suggestedAction: 'review_flashcards',
          conceptLabel: null,
        });
      }
    }
  }

  return gaps;
}

/**
 * Get gaps for a specific lesson (from stored events for that lesson).
 */
export function getGapsForLesson(lessonId) {
  const events = getEventsForLesson(lessonId);
  return computeGapsFromEvents(events);
}

/**
 * Get gaps for a session (all lessons the user has interacted with).
 */
export function getGapsForSession(sessionId) {
  const events = getEventsForSession(sessionId);
  return computeGapsFromEvents(events);
}
