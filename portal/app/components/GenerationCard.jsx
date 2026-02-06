'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable UI Card for "NotebookLM Style" Generation Actions
 * @param {string} title - Main title (e.g. "Create Audio Overview")
 * @param {string} subtitle - Secondary text
 * @param {string} buttonLabel - Button text (e.g. "Generate Audio Overview")
 * @param {boolean} loading - Is it currently generating?
 * @param {function} onClick - Click handler
 * @param {string} [loadingLabel] - Optional text to show while loading
 */
export default function GenerationCard({
    title,
    subtitle,
    buttonLabel,
    loading,
    onClick,
    loadingLabel
}) {
    return (
        <section
            style={{
                padding: 32,
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300
            }}
            aria-label="Generation Card"
        >
            {loading ? (
                <div style={{ marginBottom: 24, width: '100%', maxWidth: 300 }}>
                    <div style={{ fontSize: '48px', marginBottom: 16 }} className="animate-bounce">✨</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                        {loadingLabel || 'Generating...'}
                    </h3>
                    <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>NotebookLM is analyzing the lesson context.</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: '48px', marginBottom: 16 }}>✨</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{title}</h3>
                        <p style={{ margin: 0, color: '#64748b' }}>{subtitle || 'Use NotebookLM to generate this asset from the lesson context.'}</p>
                    </div>

                    <button
                        onClick={onClick}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            cursor: loading ? 'wait' : 'pointer',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: '15px',
                            fontWeight: 600,
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {buttonLabel}
                    </button>
                </>
            )}
        </section>
    );
}
