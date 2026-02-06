'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSessionId } from '../lib/sessionId';

export default function ProgressPage() {
  const [progress, setProgress] = useState({ lessons: [] });
  const [gaps, setGaps] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    Promise.all([
      fetch(`/api/session/progress?sessionId=${encodeURIComponent(sid)}`).then((r) => r.json()),
      fetch(`/api/session/gaps?sessionId=${encodeURIComponent(sid)}`).then((r) => r.json()),
      fetch('/api/lessons').then((r) => r.json()).catch(() => []),
    ]).then(([prog, gapsRes, lessonsList]) => {
      setProgress(prog || { lessons: [] });
      setGaps(gapsRes?.gaps || []);
      setLessons(Array.isArray(lessonsList) ? lessonsList : lessonsList?.lessons || []);
    });
  }, []);

  const byLessonId = {};
  for (const l of lessons) byLessonId[l.id] = l;
  const progressByLesson = {};
  for (const p of progress.lessons || []) progressByLesson[p.lessonId] = p;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>My Progress</h1>
      <p style={{ marginBottom: 24 }}>
        <Link href="/lessons">← Back to Lessons</Link>
      </p>

      <section style={{ marginBottom: 32 }} aria-labelledby="progress-heading">
        <h2 id="progress-heading">Lessons</h2>
        {progress.lessons?.length === 0 ? (
          <p style={{ color: '#666' }}>No lesson activity yet. Visit a lesson to get started.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(progress.lessons || []).map((p) => {
              const lesson = byLessonId[p.lessonId];
              const title = lesson?.title || `Lesson ${p.lessonId}`;
              const slug = lesson?.slug;
              const badges = [];
              if (p.started) badges.push('Viewed');
              if (p.quizTaken) badges.push('Quiz');
              if (p.flashcardsUsed) badges.push('Flashcards');
              if (p.slidesDownloaded) badges.push('Slides');
              return (
                <li key={p.lessonId} style={{ marginBottom: 12 }}>
                  {slug ? (
                    <Link href={`/lessons/${slug}`} style={{ color: 'inherit' }}>
                      {title}
                      {badges.length > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>
                          — {badges.join(', ')}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span>{title} — {badges.join(', ')}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading">Topics to review</h2>
        {gaps.length === 0 ? (
          <p style={{ color: '#666' }}>No topics to review yet. Take quizzes or use flashcards to see suggestions here.</p>
        ) : (
          <ul style={{ paddingLeft: 20 }}>
            {gaps.slice(0, 15).map((g, i) => {
              const lesson = byLessonId[g.lessonId];
              const slug = lesson?.slug;
              const label = g.type === 'quiz_question' && g.questionIndex != null
                ? `Question ${g.questionIndex + 1}`
                : g.type === 'quiz_score'
                  ? 'Retake quiz'
                  : g.type === 'flashcard'
                    ? 'Review flashcards'
                    : 'Review';
              return (
                <li key={i} style={{ marginBottom: 8 }}>
                  {slug ? (
                    <Link href={`/lessons/${slug}${g.suggestedAction === 'retake_quiz' ? '#quiz' : ''}`}>
                      {lesson?.title || g.lessonId}: {label}
                    </Link>
                  ) : (
                    <span>{g.lessonId}: {label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
