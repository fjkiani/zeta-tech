'use client';

import { useState, useEffect } from 'react';

export default function ContextEditor({ lessonId, initialContext, initialTranscript, videoUrl, compact, alwaysOpen }) {
    const [tab, setTab] = useState('context'); // 'context' or 'transcript'
    const [context, setContext] = useState(initialContext || '');
    const [transcript, setTranscript] = useState(initialTranscript || '');
    const [isOpen, setIsOpen] = useState(alwaysOpen || false);
    const [status, setStatus] = useState('idle'); // idle, saving, saved, error

    useEffect(() => {
        if (alwaysOpen) setIsOpen(true);
    }, [alwaysOpen]);

    async function handleSave() {
        setStatus('saving');
        try {
            const body = tab === 'context' ? { context } : { transcript };
            const res = await fetch(`/api/lessons/${lessonId}/context?type=${tab}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save');
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    }

    async function handleClear() {
        const typeLabel = tab === 'context' ? 'Teacher Context' : 'Transcript';
        if (!confirm(`Are you sure you want to clear the ${typeLabel}?`)) return;

        if (tab === 'context') setContext('');
        if (tab === 'transcript') setTranscript('');

        setStatus('saving');
        try {
            const res = await fetch(`/api/lessons/${lessonId}/context?type=${tab}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to clear');
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    }

    async function handleAutoFetch() {
        if (!videoUrl) return alert('No video URL available.');

        setStatus('saving');
        try {
            const res = await fetch('/api/scavenge/transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fetch failed');

            setTranscript(data.transcript);

            // Auto-Save Immediately
            await fetch(`/api/lessons/${lessonId}/context?type=transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: data.transcript }),
            });

            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            alert('Auto-Fetch Failed: ' + e.message);
            setStatus('error');
        }
    }

    async function handleSummarize() {
        if (!transcript) return alert('No transcript to summarize!');

        setStatus('saving');
        try {
            const res = await fetch('/api/intel/generate-takeaways', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');

            // Append to Context
            const newIntel = `\n\n## Smart Takeaways\n${data.takeaways}`;
            setContext(prev => prev + newIntel);

            // Auto-Save the context immediately
            // We need to call the API directly here since handleSave uses state that might not be updated yet
            await fetch(`/api/lessons/${lessonId}/context?type=context`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: context + newIntel }),
            });

            // Switch tab to show user
            setTab('context');
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);

        } catch (e) {
            console.error(e);
            alert('AI Summary Failed: ' + e.message);
            setStatus('error');
        }
    }

    // COMPACT MODE RENDER
    if (compact) {
        return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!transcript && (
                    <button
                        onClick={handleAutoFetch}
                        disabled={status === 'saving'}
                        style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        ⚡ Auto-Fetch
                    </button>
                )}

                {transcript && (
                    <button
                        onClick={handleSummarize}
                        disabled={status === 'saving'}
                        style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        ✨ Summarize
                    </button>
                )}

                <button
                    onClick={() => setIsOpen(true)}
                    style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 6, padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
                >
                    View / Edit
                </button>

                {status === 'saved' && <span style={{ color: '#10b981', fontSize: '12px' }}>Done!</span>}
                {status === 'saving' && <span style={{ color: '#64748b', fontSize: '12px' }}>Working...</span>}
            </div>
        );
    }

    if (!isOpen && !alwaysOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    padding: '12px',
                    width: '100%',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '14px',
                    marginBottom: '24px',
                    cursor: 'pointer'
                }}
            >
                + Add Context / Transcript
            </button>
        );
    }

    return (
        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => setTab('context')}
                        style={{ background: 'none', border: 'none', borderBottom: tab === 'context' ? '2px solid #2563eb' : 'none', fontWeight: tab === 'context' ? 600 : 400, color: tab === 'context' ? '#1e293b' : '#64748b', cursor: 'pointer', fontSize: '15px' }}
                    >
                        Teacher Context
                    </button>
                    <button
                        onClick={() => setTab('transcript')}
                        style={{ background: 'none', border: 'none', borderBottom: tab === 'transcript' ? '2px solid #2563eb' : 'none', fontWeight: tab === 'transcript' ? 600 : 400, color: tab === 'transcript' ? '#1e293b' : '#64748b', cursor: 'pointer', fontSize: '15px' }}
                    >
                        Video Transcript
                    </button>
                </div>
                {!alwaysOpen && <button onClick={() => setIsOpen(false)} style={{ color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}>✕</button>}
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                {tab === 'context'
                    ? "Paste your specific lesson plan, anecdotes, or examples here. The AI will use THIS for all generations."
                    : "Paste the full video transcript here. This powers the 'Takeaways' and 'Objectives' extraction."}
            </p>

            <textarea
                value={tab === 'context' ? context : transcript}
                onChange={(e) => tab === 'context' ? setContext(e.target.value) : setTranscript(e.target.value)}
                placeholder={tab === 'context' ? "# Python Data Types\n\nTarget Audience: High School Juniors..." : "[00:00:00] Teacher: Today we are talking about..."}
                style={{
                    width: '100%',
                    height: '200px',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    resize: 'vertical',
                    marginBottom: '12px'
                }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleSave}
                        disabled={status === 'saving'}
                        style={{
                            padding: '8px 16px',
                            background: status === 'saved' ? '#10b981' : '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            fontWeight: 500,
                            cursor: status === 'saving' ? 'wait' : 'pointer'
                        }}
                    >
                        {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Save ' + (tab === 'context' ? 'Context' : 'Transcript')}
                    </button>

                    {tab === 'transcript' && videoUrl && (
                        <button
                            onClick={handleAutoFetch}
                            style={{
                                padding: '8px 16px',
                                background: '#f59e0b', // Amber for 'magic'
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>⚡</span> Auto-Fetch
                        </button>
                    )}

                    {tab === 'transcript' && transcript && (
                        <button
                            onClick={handleSummarize}
                            style={{
                                padding: '8px 16px',
                                background: '#7c3aed', // Violet for AI
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>✨</span> Summarize
                        </button>
                    )}

                    <button
                        onClick={handleClear}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            color: '#ef4444',
                            borderRadius: '6px',
                            border: '1px solid #ef4444',
                            cursor: 'pointer'
                        }}
                    >
                        Clear
                    </button>
                </div>

                {status === 'error' && <span style={{ color: '#ef4444', fontSize: '14px' }}>Error saving details.</span>}
            </div>
        </div>
    );
}

