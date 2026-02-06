import { recordEvent, EVENT_TYPES } from '../../lib/tracking.js';

const ALLOWED_TYPES = new Set(Object.values(EVENT_TYPES));

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { eventType, lessonId, schoolKey, sessionId, userId, payload } = body ?? {};
  if (!eventType || !ALLOWED_TYPES.has(eventType)) {
    return Response.json({ error: 'eventType must be one of: ' + [...ALLOWED_TYPES].join(', ') }, { status: 400 });
  }

  const entry = recordEvent({
    eventType,
    lessonId: lessonId ?? null,
    schoolKey: schoolKey ?? null,
    sessionId: sessionId ?? null,
    userId: userId ?? null,
    payload: payload ?? {},
  });

  return Response.json({ ok: true, id: entry.id });
}
