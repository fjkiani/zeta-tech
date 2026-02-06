'use client';

import { useEffect } from 'react';
import { getSessionId } from '../../lib/sessionId';

export default function LessonViewTracker({ lessonId, schoolKey }) {
  useEffect(() => {
    if (!lessonId) return;
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'lesson_view',
        lessonId,
        schoolKey: schoolKey ?? undefined,
        sessionId: getSessionId(),
        payload: {},
      }),
    }).catch(() => {});
  }, [lessonId, schoolKey]);
  return null;
}
