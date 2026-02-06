'use client';

import { useState } from 'react';

export default function ObjectivesTracker({ objectives = [] }) {
    // Default objectives if none provided
    const defaults = [
        "Understand the core concept",
        "Identify key terminology",
        "Apply knowledge to a simple problem",
        "Complete the quiz with >80% score"
    ];

    const list = objectives.length > 0 ? objectives : defaults;
    const [checked, setChecked] = useState({});

    const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));
    const progress = Math.round((Object.values(checked).filter(Boolean).length / list.length) * 100);

    return (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#334155' }}>Learning Objectives</h3>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>{progress}%</span>
            </div>

            <div style={{ padding: '8px 0' }}>
                {list.map((obj, i) => (
                    <label key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}>
                        <input
                            type="checkbox"
                            checked={!!checked[i]}
                            onChange={() => toggle(i)}
                            style={{ marginTop: '4px' }}
                        />
                        <span style={{
                            fontSize: '14px',
                            color: checked[i] ? '#94a3b8' : '#475569',
                            textDecoration: checked[i] ? 'line-through' : 'none'
                        }}>
                            {obj}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
