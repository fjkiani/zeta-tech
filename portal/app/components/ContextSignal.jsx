'use client';

import { Activity, Database, FileText, Layout, ScrollText, Wifi } from 'lucide-react';

/**
 * AI Context Signal
 * Displays the live status of data ingestion for the AI Agent.
 * Not a filler - actually reacts to props.
 */
export default function ContextSignal({ artifacts, hasContext, hasTranscript, lessonData }) {

    // Determine actual status
    const signals = [
        {
            id: 'hygraph',
            label: 'Hygraph Core',
            icon: <Database size={12} />,
            active: !!lessonData?.description || !!lessonData?.lessonPlan,
            detail: 'Lesson & Plan'
        },
        {
            id: 'context',
            label: 'Teacher Context',
            icon: <FileText size={12} />,
            active: hasContext,
            detail: 'Manual Override'
        },
        {
            id: 'slides',
            label: 'Visual Deck',
            icon: <Layout size={12} />,
            active: !!artifacts?.slideDeck,
            detail: 'Vector Embeddings'
        },
        {
            id: 'transcript',
            label: 'Video Transcript',
            icon: <ScrollText size={12} />,
            active: hasTranscript,
            detail: 'Audio Analysis'
        },
    ];

    const activeCount = signals.filter(s => s.active).length;
    const signalStrength = (activeCount / signals.length) * 100;

    // Color logic based on strength
    let statusColor = '#ef4444'; // Red (Weak)
    if (signalStrength >= 50) statusColor = '#f59e0b'; // Orange (Medium)
    if (signalStrength >= 75) statusColor = '#10b981'; // Green (Strong)

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Wifi size={16} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>AI Neural Uplink</h3>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: statusColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={12} />
                            {signalStrength === 100 ? 'Optimal Signal' : (signalStrength > 0 ? 'Active Stream' : 'No Signal')}
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '20px', opacity: 0.5 }}>📡</div>
            </div>

            {/* Signal Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {signals.map((s) => (
                    <div key={s.id} style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: s.active ? '#f0fdf4' : '#f8fafc',
                        border: s.active ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                        display: 'flex', flexDirection: 'column', gap: '2px',
                        opacity: s.active ? 1 : 0.6
                    }}>
                        <div style={{
                            fontSize: '11px', fontWeight: 700,
                            color: s.active ? '#15803d' : '#94a3b8',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            {s.active ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} /> : <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }} />}
                            {s.label}
                        </div>
                        <div style={{ fontSize: '10px', color: s.active ? '#166534' : '#cbd5e1' }}>
                            {s.detail}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
