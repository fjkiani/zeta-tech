'use client';

import { useState, useEffect } from 'react';
import { getSessionId } from '../lib/sessionId';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Check, X, RotateCcw, Brain, ChevronLeft, ChevronRight } from 'lucide-react';

function trackFlashcardRate(lessonId, schoolKey, cardIndex, rating) {
  if (!lessonId) return;
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'flashcard_rate',
      lessonId,
      schoolKey: schoolKey ?? undefined,
      sessionId: getSessionId(),
      payload: { cardIndex, rating },
    }),
  }).catch(() => { });
}

export default function FlashcardSection({ flashcardsUrl, lessonId, schoolKey }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!flashcardsUrl) return;
    fetch(flashcardsUrl)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.flashcards ?? data?.cards ?? [];
        const normalized = list.map((c) => ({
          front: c.front ?? c.question ?? c.term ?? c.f ?? c[0],
          back: c.back ?? c.answer ?? c.definition ?? c.b ?? c[1],
        })).filter((c) => c.front != null || c.back != null);
        setCards(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [flashcardsUrl]);

  if (loading) return null;
  if (!cards.length) return <div style={{ padding: '24px', color: '#94a3b8' }}>No flashcards generated.</div>;

  const card = cards[index];

  const handleRate = (rating) => {
    trackFlashcardRate(lessonId, schoolKey, index, rating);
    const nextIndex = Math.min(cards.length - 1, index + 1);
    if (nextIndex !== index) {
      setDirection(1);
      setIndex(nextIndex);
      setFlipped(false);
    }
  };

  const flip = () => setFlipped((f) => !f);

  const paginate = (newIndex) => {
    // Bounds check
    if (newIndex < 0 || newIndex >= cards.length) return;

    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
    setFlipped(false);
  };

  return (
    <section style={{ marginTop: '32px', position: 'relative', perspective: '1000px' }} aria-labelledby="flashcards-heading">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Repeat size={16} />
          </div>
          <h3 id="flashcards-heading" style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Flashcards</h3>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '99px' }}>
          {index + 1} / {cards.length}
        </div>
      </div>

      <div style={{ position: 'relative', height: '400px', width: '100%' }}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction < 0 ? 100 : -100 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
          >
            {/* 3D Flip Container */}
            <motion.div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                cursor: 'pointer'
              }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              onClick={flip}
            >
              {/* FRONT */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'white',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{
                  position: 'absolute', top: '24px', left: '24px',
                  fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
                  color: '#94a3b8', textTransform: 'uppercase'
                }}>
                  Question
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}>
                  {card.front}
                </div>
                <div style={{
                  position: 'absolute', bottom: '24px',
                  fontSize: '12px', color: '#cbd5e1', fontWeight: 500
                }}>
                  Click to flip
                </div>
              </div>

              {/* BACK */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '24px',
                boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                textAlign: 'center',
                transform: 'rotateY(180deg)',
                color: 'white'
              }}>
                <div style={{
                  position: 'absolute', top: '24px', left: '24px',
                  fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase'
                }}>
                  Answer
                </div>
                <div style={{ fontSize: '20px', fontWeight: 500, lineHeight: 1.6 }}>
                  {card.back}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={() => paginate(index - 1)}
          disabled={index === 0}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: index === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={24} />
        </button>

        {flipped ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleRate('still_learning')}
              style={{
                padding: '12px 24px', borderRadius: '99px', background: '#fef2f2', color: '#ef4444',
                fontWeight: 700, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <RotateCcw size={16} /> Still Learning
            </button>
            <button
              onClick={() => handleRate('know')}
              style={{
                padding: '12px 24px', borderRadius: '99px', background: '#f0fdf4', color: '#16a34a',
                fontWeight: 700, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Check size={16} /> Got It
            </button>
          </div>
        ) : (
          <div style={{ height: '48px', width: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
            Flip card to rate
          </div>
        )}

        <button
          onClick={() => paginate(index + 1)}
          disabled={index === cards.length - 1}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: index === cards.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
