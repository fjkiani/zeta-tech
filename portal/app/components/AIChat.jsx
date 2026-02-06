'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, Bot } from 'lucide-react';

export default function AIChat({ lessonId, initialContext, transcript, quizScore }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: "I'm connected to the lesson stream. I can see the Plan, Transcript, and your Quiz results. How can I help you optimize your study?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // REACTIVE: If quiz score updates, inject a message
    useEffect(() => {
        if (quizScore) {
            const percent = (quizScore.correct / quizScore.total) * 100;
            let msg = "";
            if (percent < 60) msg = `I see you just finished the quiz with ${quizScore.correct}/${quizScore.total}. Don't worry, we can fix the gaps. Want me to explain the questions you missed?`;
            else if (percent < 90) msg = `Nice job on the quiz (${quizScore.correct}/${quizScore.total})! You're close to mastery. Want a quick challenge to get to 100%?`;
            else msg = `Perfect score (${quizScore.correct}/${quizScore.total})! You've mastered this module. Ready to explore advanced applications?`;

            setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
        }
    }, [quizScore]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        // MOCK RESPONSE LOGIC (Smart Simulation)
        setTimeout(() => {
            let response = "I'm analyzing the lesson data...";
            const lower = userMsg.toLowerCase();

            // 1. Context Knowledge
            if (lower.includes('grade') || lower.includes('score')) {
                if (quizScore) response = `You scored ${quizScore.correct}/${quizScore.total}. The questions you missed were about ${quizScore.wrongIndices?.length ? 'specific technical definitions' : 'minor details'}.`;
                else response = "You haven't taken the quiz yet. Give it a shot and I'll analyze your performance!";
            }
            // 2. Transcript Knowledge (Mocking extraction)
            else if (lower.includes('transcript') || lower.includes('video') || lower.includes('said')) {
                if (transcript) response = "According to the transcript, the instructor emphasized that 'Context is King' when dealing with LLMs. He mentioned specifically that without grounding, hallucinations increase by 40%.";
                else response = "I don't have the full transcript yet, but based on the lesson plan, this video covers core concepts.";
            }
            // 3. General Help
            else if (lower.includes('help') || lower.includes('stuck')) {
                response = "I can create a custom practice problem, explain a concept in simple terms, or review your quiz mistakes. What do you prefer?";
            }
            // 4. Default Fallback
            else {
                response = "That's a great question. Based on the lesson context, " + (initialContext ? "the key takeaway here is to focus on the systematic approach." : "I recommend reviewing the 'Audio Deep Dive' for a different perspective.");
            }

            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
            setLoading(false);
        }, 1200);
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '500px',
            background: 'white', borderRadius: '16px',
            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <Bot size={18} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Nyx Oracle</h3>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                        Online & Context Aware
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex', flexDirection: 'column', gap: '4px'
                    }}>
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            background: m.role === 'user' ? '#4f46e5' : '#f1f5f9',
                            color: m.role === 'user' ? '#fff' : '#334155',
                            borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                            borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '16px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            {m.text}
                        </div>
                        <span style={{ fontSize: '10px', color: '#cbd5e1', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            {m.role === 'user' ? 'You' : 'Nyx'}
                        </span>
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '12px' }}>
                        <div className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}></div>
                        <div className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animationDelay: '0.1s' }}></div>
                        <div className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animationDelay: '0.2s' }}></div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', background: 'white' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about quiz results or concepts..."
                    style={{
                        flex: 1, padding: '12px 16px', borderRadius: '99px', border: '1px solid #e2e8f0',
                        fontSize: '14px', background: '#f8fafc', outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.background = 'white'}
                    onBlur={(e) => e.target.style.background = '#f8fafc'}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                        width: '42px', height: '42px', borderRadius: '50%', background: '#4f46e5',
                        color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: loading ? 0.7 : 1, transition: 'transform 0.1s', transform: 'scale(1)'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <MessageSquare size={18} />
                </button>
            </form>
        </div>
    );
}
