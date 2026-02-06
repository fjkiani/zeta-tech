'use client';

import { useState, useEffect } from 'react';
import { getSessionId } from '../lib/sessionId';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Award, RefreshCw, Trophy } from 'lucide-react';

export default function QuizSection({ quizUrl, lessonId, schoolKey, onScoreUpdate }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [wrongIndices, setWrongIndices] = useState([]);

  useEffect(() => {
    if (!quizUrl) return;
    fetch(quizUrl)
      .then((r) => r.json())
      .then((data) => {
        setQuiz(Array.isArray(data) ? data : data?.questions ?? data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizUrl]);

  if (loading || !quiz) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading Quiz...</div>
  );

  const questions = Array.isArray(quiz) ? quiz : quiz.questions || [];
  if (!questions.length) return <div style={{ padding: '24px', color: '#94a3b8' }}>No questions available.</div>;

  const handleSubmit = () => {
    const opts = (q) => q.answerOptions ?? q.options ?? q.choices ?? [];
    const correctIndex = (q) => opts(q).findIndex((o) => o.isCorrect || o.correct);
    let scoreCount = 0;
    const questionPayload = questions.map((q, i) => {
      const correctIdx = correctIndex(q);
      const selected = answers[i];
      const correct = correctIdx >= 0 && selected === correctIdx;
      if (correct) scoreCount += 1;
      return { questionIndex: i, selectedIndex: selected, correct };
    });

    if (lessonId) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'quiz_submit',
          lessonId,
          schoolKey: schoolKey ?? undefined,
          sessionId: getSessionId(),
          payload: { score: scoreCount, total: questions.length, questions: questionPayload },
        }),
      }).catch(() => { });
    }

    // Update Local State
    const finalScore = { correct: scoreCount, total: questions.length };
    setScore(finalScore);
    const wrong = questionPayload.filter((q) => !q.correct).map((q) => q.questionIndex);
    setWrongIndices(wrong);
    setSubmitted(true);

    // Notify Parent (Cockpit) for Chat Context
    if (onScoreUpdate) onScoreUpdate(finalScore, wrong);
  };

  // Grade Logic
  const getGrade = () => {
    if (!score) return { letter: '-', color: '#cbd5e1', message: '' };
    const percent = (score.correct / score.total) * 100;
    if (percent >= 90) return { letter: 'A', color: '#10b981', message: 'Outstanding!' };
    if (percent >= 80) return { letter: 'B', color: '#3b82f6', message: 'Great Job!' };
    if (percent >= 70) return { letter: 'C', color: '#f59e0b', message: 'Good Effort' };
    if (percent >= 60) return { letter: 'D', color: '#f97316', message: 'Needs Study' };
    return { letter: 'F', color: '#ef4444', message: 'Review Needed' };
  };
  const grade = getGrade();

  return (
    <section style={{ marginTop: '24px', position: 'relative' }} aria-labelledby="quiz-heading" role="region">
      {/* Quiz List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {questions.map((q, i) => {
          const opts = q.answerOptions ?? q.options ?? q.choices ?? [];
          const correctIndex = opts.findIndex((o) => o.isCorrect || o.correct);
          const selected = answers[i];
          const isWrong = submitted && wrongIndices.includes(i);

          return (
            <div key={i} style={{
              padding: '24px',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', color: '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: '1.5' }}>
                  {q.question ?? q.title ?? q.text}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '40px' }}>
                {opts.map((opt, j) => {
                  const text = opt.text ?? opt.content ?? opt.option ?? opt;
                  const isCorrect = j === correctIndex;
                  const isSelected = selected === j;

                  let bgColor = 'white';
                  let borderColor = '#e2e8f0';
                  let textColor = '#475569';
                  let icon = null;

                  if (submitted) {
                    if (isCorrect) {
                      bgColor = '#ecfdf5'; borderColor = '#34d399'; textColor = '#065f46'; icon = <Check size={16} />;
                    } else if (isSelected && !isCorrect) {
                      bgColor = '#fef2f2'; borderColor = '#f87171'; textColor = '#991b1b'; icon = <X size={16} />;
                    } else {
                      bgColor = '#f8fafc'; borderColor = 'transparent'; textColor = '#94a3b8';
                    }
                  } else if (isSelected) {
                    bgColor = '#eff6ff'; borderColor = '#3b82f6'; textColor = '#1e3a8a';
                  }

                  return (
                    <button
                      key={j}
                      type="button"
                      disabled={submitted}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [i]: j }))}
                      style={{
                        padding: '12px 16px',
                        background: bgColor,
                        border: `2px solid ${borderColor}`,
                        borderRadius: '12px',
                        textAlign: 'left',
                        color: textColor,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: submitted ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        boxShadow: isSelected && !submitted ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : 'none'
                      }}
                    >
                      <span>{text}</span>
                      {icon && <span>{icon}</span>}
                    </button>
                  );
                })}
              </div>

              {isWrong && (
                <div style={{ marginLeft: '40px', marginTop: '12px', fontSize: '13px', color: '#ef4444', fontWeight: 500 }}>
                  Incorrect. Review this topic in the lesson.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            style={{
              padding: '16px 48px',
              borderRadius: '99px',
              fontSize: '16px', fontWeight: 700,
              transition: 'transform 0.2s'
            }}
          >
            Submit Results
          </button>
        </div>
      )}

      {/* Grade Overlay Modal */}
      <AnimatePresence>
        {submitted && score && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              marginTop: '32px',
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #f1f5f9',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
              background: `linear-gradient(90deg, ${grade.color}, white)`
            }} />

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `${grade.color}20`, color: grade.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Trophy size={40} strokeWidth={1.5} />
              </div>
            </div>

            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
              {grade.message}
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 24px' }}>
              You scored <strong style={{ color: '#0f172a' }}>{score.correct}</strong> out of {score.total}
            </p>

            <div style={{
              fontSize: '64px', fontWeight: 900, color: grade.color,
              lineHeight: 1, marginBottom: '24px',
              textShadow: `0 4px 12px ${grade.color}40`
            }}>
              {grade.letter}
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                setScore(null);
                window.scrollTo({ top: document.getElementById('quiz')?.offsetTop - 100, behavior: 'smooth' });
              }}
              style={{
                padding: '12px 24px', borderRadius: '99px', border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', fontWeight: 600, fontSize: '14px',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
