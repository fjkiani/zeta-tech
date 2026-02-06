'use client';

import { useState, useEffect } from 'react';
import { getSessionId } from '../lib/sessionId';

export default function ProgressChecklist({ lessonId }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    fetch(`/api/session/progress?sessionId=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((data) => {
        const lesson = data?.lessons?.find((l) => l.lessonId === lessonId);
        setProgress(lesson || null);
      })
      .catch(() => setProgress(null));
  }, [lessonId]);

  if (!progress) return null;

  const items = [
    { done: progress.started, label: 'Viewed' },
    { done: progress.quizTaken, label: 'Quiz taken' },
    { done: progress.flashcardsUsed, label: 'Flashcards used' },
    { done: progress.slidesDownloaded, label: 'Slides viewed' },
  ].filter((i) => i.done);

  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 16, fontSize: 14, color: '#555' }} role="status" aria-label="Your progress for this lesson">
      {items.map((i) => (
        <span key={i.label} style={{ marginRight: 12, display: 'inline-block' }}>
          ✓ {i.label}
        </span>
      ))}
    </div>
  );
}
