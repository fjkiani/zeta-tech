'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['Creating notebook', 'Adding source', 'Generating', 'Downloading'];
const FETCH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function GenerationActions({ lessonId, artifacts, schoolKey, target, videoUrl }) {
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [lastFailedType, setLastFailedType] = useState(null);
  const [done, setDone] = useState({ ...artifacts });
  const abortRef = useRef(null);

  const refetchArtifacts = useCallback(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        const a = data?.artifacts || {};
        setDone((d) => ({ ...d, quiz: a.quiz || d.quiz, flashcards: a.flashcards || d.flashcards, slideDeck: a.slideDeck || d.slideDeck }));
        router.refresh();
      })
      .catch(() => { });
  }, [lessonId, router]);

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(tick);
  }, [loading]);

  async function generate(type) {
    setLoading(type);
    setError(null);
    setStep(0);
    setElapsed(0);
    abortRef.current = new AbortController();
    const stepsInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 12000);
    try {
      const timeoutId = setTimeout(() => abortRef.current?.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(`/api/lessons/${lessonId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactType: type, schoolKey: schoolKey ?? undefined, videoUrl }),
        signal: abortRef.current.signal,
      });
      clearTimeout(timeoutId);
      clearInterval(stepsInterval);
      setStep(STEPS.length - 1);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDone((d) => ({ ...d, [type]: data.artifactUrl }));
      refetchArtifacts();
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Generation is taking longer than expected (5 min). The server may still be working—try refreshing the page to see if it completed, or retry.'
        : e.message;
      setError(msg);
      setLastFailedType(type);
    } finally {
      clearInterval(stepsInterval);
      setLoading(null);
      setStep(0);
      setElapsed(0);
    }
  }

  const loadingLabel = loading
    ? `${STEPS[step]}… (${step + 1}/${STEPS.length}) · ${elapsed}s elapsed`
    : null;

  // Render specific button if target is active
  const renderButton = (key, label) => {
    // If we are targeting a specific key, we might want to auto-trigger? 
    // For now, just render the big button if it's the target.
    // Or if no target, render all.

    if (target && target !== key) return null;

    if (done[key] && !target) {
      // In list mode, show "Ready" badge
      return <span key={key} style={{ padding: '8px 12px', background: '#e8f5e9', borderRadius: 6 }}>{label} Ready</span>
    }

    // If inline (target exists), and it's done, we don't render the button because the view handles the content.
    // UNLESS we want to allow re-generation? Let's hide it if done to avoid confusion, or show "Regenerate".
    if (done[key] && target) return null;

    return (
      <button
        key={key}
        onClick={() => generate(key)}
        disabled={!!loading}
        aria-busy={loading === key}
        style={{
          padding: target ? '12px 24px' : '8px 12px',
          cursor: loading ? 'wait' : 'pointer',
          background: target ? '#2563eb' : '#f1f5f9',
          color: target ? 'white' : '#0f172a',
          border: 'none',
          borderRadius: 8,
          fontSize: target ? '15px' : '13px',
          fontWeight: target ? 600 : 400
        }}
      >
        {loading === key ? 'Generating...' : `Generate ${label}`}
      </button>
    );
  }

  return (
    <section style={target ? { padding: 32, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' } : { marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }} aria-label="Study materials">

      {!target && <h3 style={{ margin: '0 0 12px' }}>Study materials</h3>}

      {target && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>✨</div>
          <h3 style={{ margin: '0 0 8px' }}>Create {target}</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Use NotebookLM to generate this asset from the lesson context.</p>
        </div>
      )}

      {error && (
        <p style={{ color: 'crimson', marginBottom: 8 }}>
          {error}
          {lastFailedType && (
            <button type="button" onClick={() => { setError(null); generate(lastFailedType); }} style={{ marginLeft: 8 }}>Retry</button>
          )}
        </p>
      )}
      {loadingLabel && (
        <div style={{ marginBottom: 8, fontSize: 14, color: '#666' }}>
          <p style={{ margin: '0 0 4px' }}>{loadingLabel}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
            NotebookLM can take 2–5 minutes. Please don&apos;t close this page.
          </p>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: target ? 'center' : 'flex-start' }}>
        {renderButton('quiz', 'Quiz')}
        {renderButton('flashcards', 'Flashcards')}
        {renderButton('slideDeck', 'Slides')}
        {renderButton('audio', 'Audio Overview')}
        {renderButton('mindMap', 'Mind Map')}
        {renderButton('dataTable', 'Data Table')}
      </div>
    </section>
  );
}
