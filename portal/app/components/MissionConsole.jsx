
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MissionConsole({ school }) {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]);
    const scrollingRef = useRef(null);

    // Initial boot sequence
    useEffect(() => {
        const bootSequence = [
            { type: 'system', text: `INITIALIZING ${school.label.toUpperCase()} PROTOCOL...` },
            { type: 'system', text: `CONNECTING TO ${school.notebookTitlePrefix.toUpperCase()} DATABASE...` },
            { type: 'success', text: 'CONNECTION ESTABLISHED.' },
            { type: 'info', text: `WELCOME, CADET. ${school.description}` }
        ];

        let delay = 0;
        bootSequence.forEach((log) => {
            delay += 600;
            setTimeout(() => {
                setLogs(prev => [...prev, log]);
            }, delay);
        });
    }, [school]);

    // Auto-scroll
    useEffect(() => {
        if (scrollingRef.current) {
            scrollingRef.current.scrollTop = scrollingRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user command
        const command = input;
        setLogs(prev => [...prev, { type: 'user', text: `> ${command}` }]);
        setInput('');

        // AI Processing
        const processCommand = async () => {
            // Add loading state
            setLogs(prev => [...prev, { type: 'system', text: 'PROCESSING...' }]);

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: command, schoolKey: school.key })
                });

                if (!res.ok) throw new Error('Network response was not ok');

                const data = await res.json();

                setLogs(prev => [...prev, {
                    type: 'response',
                    text: data.reply || '[SYSTEM ERROR]: No response received.'
                }]);

            } catch (error) {
                console.error('Chat Error:', error);
                setLogs(prev => [...prev, {
                    type: 'error',
                    text: `[CONNECTION LOST]: ${error.message}`
                }]);
            }
        };

        // Execute after a short delay for UX
        setTimeout(processCommand, 500);
    };

    return (
        <div style={{
            background: '#0f172a',
            borderRadius: 16,
            border: `1px solid ${school.color}40`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '500px',
            boxShadow: `0 10px 40px -10px ${school.color}20`
        }}>
            {/* Console Header */}
            <div style={{
                padding: '12px 20px',
                background: 'rgba(0,0,0,0.3)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: school.color, fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>
                    <Terminal size={14} /> {school.notebookTitlePrefix.toUpperCase()} CONSOLE
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollingRef}
                style={{
                    flex: 1,
                    padding: 24,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}
            >
                {logs.map((log, i) => (
                    <div key={i} style={{
                        color:
                            log.type === 'user' ? 'white' :
                                log.type === 'success' ? '#10b981' :
                                    log.type === 'response' ? school.color :
                                        '#94a3b8',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        lineHeight: 1.5
                    }}>
                        {log.type === 'success' && <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} />}
                        {log.type === 'system' && <span style={{ opacity: 0.5 }}>[SYS]</span>}
                        <span>{log.text}</span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} style={{
                padding: 16,
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                gap: 12
            }}>
                <div style={{ color: school.color, fontWeight: 700, fontFamily: 'monospace', alignSelf: 'center' }}>$</div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Enter command for ${school.label}...`}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontFamily: 'monospace',
                        outline: 'none',
                        fontSize: 14
                    }}
                    autoFocus
                />
                <button type="submit" disabled={!input.trim()} style={{
                    background: input.trim() ? school.color : 'rgba(255,255,255,0.1)',
                    color: input.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                    border: 'none',
                    borderRadius: 8,
                    width: 36,
                    height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                }}>
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
