'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Layers } from 'lucide-react';
import GenerationCard from './GenerationCard';

export default function MarkdownContent({ content }) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Split content logic
  const sections = useMemo(() => {
    if (!content) return [];
    if (content.length < 1000) return [content];

    const parts = content.split(/\n(?=#{1,2} )/g).filter(p => p.trim().length > 0);
    const merged = [];
    parts.forEach((part, i) => {
      if (i === 0) { merged.push(part); return; }
      const prevIndex = merged.length - 1;
      if (merged[prevIndex].length < 300) {
        merged[prevIndex] += '\n\n' + part;
      } else {
        merged.push(part);
      }
    });
    return merged.length > 0 ? merged : [content];
  }, [content]);

  const handleUnlock = () => {
    setGenerating(true);
    // Fake 2-minute delay simulation (shortened to 2.5s for UX but feels "real")
    setTimeout(() => {
      setGenerating(false);
      setUnlocked(true);
    }, 2500);
  };

  if (!content) return null;

  // LOCKED STATE: Use generic GenerationCard for NotebookLM style
  if (!unlocked) {
    return (
      <GenerationCard
        title="Create Lesson Guide"
        subtitle="Use NotebookLM to generate this asset from the lesson context."
        buttonLabel="Generate Lesson"
        loading={generating}
        onClick={handleUnlock}
        loadingLabel="Generating Lesson Guide..."
      />
    );
  }

  // UNLOCKED STATE (Reader UI)
  const isOnePage = sections.length <= 1;

  // Render Logic
  return (
    <div style={{ width: '100%', maxWidth: '896px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Story Progress Bar */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', padding: '0 4px' }}>
        {sections.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '6px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
            <motion.div
              initial={false}
              animate={{
                width: i <= page ? '100%' : '0%',
                background: i <= page ? 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0'
              }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            />
          </div>
        ))}
      </div>

      {/* Reader Card Container */}
      <div style={{
        position: 'relative',
        height: '800px', // Increased height to minimize scrolling
        width: '100%',
        background: 'white',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #f1f5f9'
      }}>

        {/* Header - Gradient Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          borderBottom: '1px solid #f1f5f9',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: 700 }}>
            <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '8px', color: '#4338ca' }}>
              <BookOpen size={18} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366f1' }}>
              Lesson Guide
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '4px 12px', borderRadius: '99px' }}>
            Page {page + 1} of {sections.length}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#ffffff' }}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={page}
              custom={direction}
              variants={{
                enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
                center: { zIndex: 1, x: 0, opacity: 1 },
                exit: (d) => ({ zIndex: 0, x: d < 0 ? 300 : -300, opacity: 0 })
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: '48px 80px', // Extra padding for side arrows
                // Customize Scrollbar hiding for clean UI
                scrollbarWidth: 'thin'
              }}
            >
              <div className="prose prose-lg max-w-none pb-24">
                {/* We use class approach for inner markdown for better stability with react-markdown,
                    but inject a style tag for specific overrides */}
                <style jsx global>{`
                    .prose h1, .prose h2, .prose h3 { color: #1e293b; font-weight: 800; }
                    .prose h1 { font-size: 2.25rem; margin-bottom: 1.5rem; line-height: 1.1; letter-spacing: -0.025em; background: -webkit-linear-gradient(45deg, #333, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    .prose h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #334155; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
                    .prose p { color: #475569; line-height: 1.75; font-size: 1.125rem; margin-bottom: 1.25rem; }
                    .prose ul { list-style-type: none; padding-left: 0; }
                    .prose ul li { position: relative; padding-left: 1.5rem; margin-bottom: 0.5rem; color: #475569; }
                    .prose ul li::before { content: "•"; position: absolute; left: 0; color: #6366f1; font-weight: bold; font-size: 1.2em; }
                    .prose strong { color: #0f172a; font-weight: 700; color: #4f46e5; }
                    .prose blockquote { border-left: 4px solid #818cf8; background: #f5f3ff; padding: 1rem; border-radius: 0 8px 8px 0; font-style: italic; color: #5b21b6; }
                `}</style>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sections[page]}
                </ReactMarkdown>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side Navigation Controls */}
        <>
          {/* Left Button */}
          <button
            onClick={() => {
              const newPage = page - 1;
              if (newPage >= 0) { setDirection(-1); setPage(newPage); }
            }}
            disabled={page === 0}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              background: page === 0 ? 'rgba(255,255,255,0.5)' : 'white',
              color: page === 0 ? '#cbd5e1' : '#475569',
              border: '1px solid #e2e8f0',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Right Button */}
          <button
            onClick={() => {
              const newPage = page + 1;
              if (newPage < sections.length) { setDirection(1); setPage(newPage); }
            }}
            disabled={page === sections.length - 1}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              cursor: page === sections.length - 1 ? 'not-allowed' : 'pointer',
              opacity: page === sections.length - 1 ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      </div>
    </div>
  );
}
