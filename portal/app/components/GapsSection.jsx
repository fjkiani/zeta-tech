'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, AlertTriangle, RefreshCw, Zap, ArrowRight, Brain } from 'lucide-react';

/**
 * Knowledge Gap Radar ("Focus Areas")
 * Replaces the clinical "Topics to review" list with a gamified mission directive.
 * FORCE-STYLED for maximum impact.
 */
export default function GapsSection({ lessonId }) {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(!!lessonId);

  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/lessons/${lessonId}/gaps`)
      .then((r) => r.json())
      .then((data) => {
        setGaps(Array.isArray(data?.gaps) ? data.gaps : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  if (loading || !gaps.length) return null;

  return (
    <section style={{
      marginTop: '32px',
      padding: '24px',
      background: '#fff7ed', // Orange/Amber tint for "Warning/Focus"
      border: '1px solid #fed7aa',
      borderRadius: '24px',
      boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.05), 0 2px 4px -1px rgba(234, 88, 12, 0.03)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: '#ffedd5', color: '#ea580c',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Target size={20} strokeWidth={3} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#9a3412' }}>Focus Areas Detected</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#c2410c', fontWeight: 500 }}>
            {gaps.length} concept{gaps.length !== 1 ? 's' : ''} need reinforcement based on your activity.
          </p>
        </div>
      </div>

      {/* Gaps Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gaps.slice(0, 5).map((g, i) => (
          <div key={i} style={{
            background: 'white',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #ffedd5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#fff1f2', color: '#e11d48',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                  {g.type === 'quiz_question' && `Quiz Question ${(g.questionIndex ?? 0) + 1}`}
                  {g.type === 'quiz_score' && `Low Quiz Score`}
                  {g.type === 'flashcard' && `Flashcard ${g.cardIndex != null ? g.cardIndex + 1 : ''}`}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {g.type === 'quiz_question' && 'Missed multiple times'}
                  {g.type === 'quiz_score' && 'Mastery level below 80%'}
                  {g.type === 'flashcard' && 'Marked as "Not Sure"'}
                </div>
              </div>
            </div>

            {/* Action Button */}
            {g.suggestedAction === 'retake_quiz' ? (
              <Link href="#quiz" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '8px 16px', background: '#fae8ff', color: '#a21caf',
                  borderRadius: '99px', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s', cursor: 'pointer'
                }}>
                  <RefreshCw size={14} /> Retake
                </div>
              </Link>
            ) : (
              <div style={{
                padding: '8px 16px', background: '#f1f5f9', color: '#64748b',
                borderRadius: '99px', fontSize: '12px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <Brain size={14} /> Review
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#fb923c' }}>
          Clearing these gaps will boost your mastery score.
        </p>
      </div>

    </section>
  );
}
