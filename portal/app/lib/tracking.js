import fs from 'fs';
import path from 'path';

const EVENTS_PATH = path.join(process.cwd(), 'data', 'student-events.json');

/**
 * Event types for tracking student behavior and understanding.
 */
export const EVENT_TYPES = {
  lesson_view: 'lesson_view',
  quiz_submit: 'quiz_submit',
  flashcard_rate: 'flashcard_rate',
  artifact_download: 'artifact_download',
  artifact_view: 'artifact_view',
};

function readEvents() {
  try {
    const raw = fs.readFileSync(EVENTS_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.events) ? data.events : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function writeEvents(events) {
  const dir = path.dirname(EVENTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(EVENTS_PATH, JSON.stringify({ events, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
}

/**
 * Record a single event. Event shape: { eventType, lessonId, schoolKey?, sessionId?, payload }
 */
export function recordEvent(event) {
  const events = readEvents();
  const entry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    eventType: event.eventType,
    lessonId: event.lessonId ?? null,
    schoolKey: event.schoolKey ?? null,
    sessionId: event.sessionId ?? null,
    userId: event.userId ?? null,
    payload: event.payload ?? {},
  };
  events.push(entry);
  writeEvents(events);
  return entry;
}

/**
 * Get all events for a lesson (for gap analysis).
 */
export function getEventsForLesson(lessonId) {
  const events = readEvents();
  return events.filter((e) => e.lessonId === lessonId);
}

/**
 * Get events for a session (e.g. current user session for "my gaps").
 */
export function getEventsForSession(sessionId) {
  const events = readEvents();
  return events.filter((e) => e.sessionId === sessionId);
}

/**
 * Get recent quiz_submit events for a lesson (for understanding gaps).
 */
export function getQuizSubmitsForLesson(lessonId) {
  const events = readEvents();
  return events.filter((e) => e.eventType === EVENT_TYPES.quiz_submit && e.lessonId === lessonId);
}
