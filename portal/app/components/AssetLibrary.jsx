'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Lock, Play, FileText, Layout, List, Brain, Table, Mic, Video, Sparkles, ChevronRight } from 'lucide-react';

/**
 * Navigation & Progress Sidebar (The "Quest Log")
 * FORCE-STYLED to ensure vibrant colors and proper layout.
 */
export default function AssetLibrary({ artifacts, activeTab, onTabChange, completedSections = [] }) {

    // Define the sequence with Explicit Hex Colors for maximum "Soul"
    const sections = [
        { id: 'overview', label: 'Briefing', icon: <Video size={20} />, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', status: 'ready' },

        { id: 'audio', label: 'Audio Deep Dive', icon: <Mic size={20} />, color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', status: artifacts?.audio ? 'ready' : 'missing' },

        { id: 'slides', label: 'Visual Slides', icon: <Layout size={20} />, color: '#d97706', bg: '#fffbeb', border: '#fde68a', status: artifacts?.slideDeck ? 'ready' : 'missing' },

        { id: 'onePager', label: '1-Page Summary', icon: <FileText size={20} />, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', status: artifacts?.onePager ? 'ready' : 'missing' },

        { id: 'mindMap', label: 'Mind Map', icon: <Brain size={20} />, color: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe', status: artifacts?.mindMap ? 'ready' : 'missing' },

        { id: 'quiz', label: 'Power Quiz', icon: <List size={20} />, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', status: artifacts?.quiz ? 'ready' : 'missing' },

        { id: 'flashcards', label: 'Flashcards', icon: <Layout size={20} />, color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', status: artifacts?.flashcards ? 'ready' : 'missing' },

        { id: 'dataTable', label: 'Data Grid', icon: <Table size={20} />, color: '#475569', bg: '#f8fafc', border: '#e2e8f0', status: artifacts?.dataTable ? 'ready' : 'missing' },

        { id: 'transcript', label: 'Transcript', icon: <FileText size={20} />, color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', status: 'ready' },
    ];

    // Calculate Progress
    const totalSteps = sections.length;
    const validCompleted = sections.filter(s => completedSections.includes(s.id)).length;
    const progressPercent = Math.min(100, Math.round((validCompleted / totalSteps) * 100));

    // Inline Style Helper
    const cardStyle = (active, color, bg, border) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        padding: '16px',
        marginBottom: '12px',
        borderRadius: '16px',
        textAlign: 'left',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: active ? `2px solid ${color}` : `1px solid ${border}`,
        backgroundColor: active ? '#ffffff' : '#ffffff',
        // Shadow: Active gets a colored glow, inactive gets minimal shadow
        boxShadow: active
            ? `0 10px 15px -3px ${color}33, 0 4px 6px -2px ${color}11`
            : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
    });

    return (
        <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column' }}>

            {/* Quest Progress Header */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '4px' }}>
                            Mission Progress
                        </h3>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                            {progressPercent}% <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Complete</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '24px' }}>🚀</div>
                </div>
                {/* Progress Bar */}
                <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                            backgroundSize: '200% 200%'
                        }}
                        animate={{
                            width: `${progressPercent}%`,
                            backgroundPosition: ['0% 50%', '100% 50%']
                        }}
                        transition={{
                            width: { duration: 1, ease: 'easeOut' },
                            backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' }
                        }}
                    />
                </div>
            </div>

            {/* The Asset List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {sections.map((section) => {
                    const isActive = activeTab === section.id;
                    const isCompleted = completedSections.includes(section.id);
                    const isMissing = section.status === 'missing';

                    return (
                        <button
                            key={section.id}
                            onClick={() => onTabChange(section.id)}
                            style={cardStyle(isActive, section.color, section.bg, section.border)}
                        >
                            {/* Active Indicator Strip */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-strip"
                                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: section.color }}
                                />
                            )}

                            {/* Icon Box */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isActive ? section.bg : section.bg,
                                color: section.color,
                                flexShrink: 0
                            }}>
                                {section.icon}
                            </div>

                            {/* Text Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: isActive ? '#0f172a' : '#334155' }}>
                                    {section.label}
                                </div>
                                {isMissing && !isActive && (
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <Sparkles size={12} /> Create Asset
                                    </div>
                                )}
                                {isCompleted && !isActive && !isMissing && (
                                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                        <Check size={12} /> Completed
                                    </div>
                                )}
                            </div>

                            {/* Status Indicator (Right Side) */}
                            <div>
                                {isActive ? (
                                    <ChevronRight size={20} color={section.color} strokeWidth={3} />
                                ) : (
                                    isMissing ? (
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={14} strokeWidth={3} />
                                        </div>
                                    ) : (
                                        isCompleted ? (
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0' }} />
                                        )
                                    )
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
