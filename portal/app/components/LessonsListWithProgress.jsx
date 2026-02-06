'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getSessionId } from '../lib/sessionId';
import SchoolSelector from './SchoolSelector';

const SCHOOL_LIST = [
  { key: 'all', label: 'All programs' },
  { key: 'bronx_medical', label: 'Bronx HS Medical Science' },
  { key: 'aviation', label: 'Aviation HS' },
  { key: 'bushwick', label: 'Bushwick HS' },
  { key: 'brooklyn_law', label: 'Brooklyn Law' },
];

export default function LessonsListWithProgress({ lessons = [], currentSchool = 'bronx_medical' }) {
  const [progress, setProgress] = useState({ lessons: [] });
  // Removed internal schoolFilter state
  const [search, setSearch] = useState('');

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    fetch(`/api/session/progress?sessionId=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then(setProgress)
      .catch(() => setProgress({ lessons: [] }));
  }, []);

  const byLessonId = useMemo(() => {
    const map = {};
    for (const p of progress.lessons || []) map[p.lessonId] = p;
    return map;
  }, [progress.lessons]);

  const filtered = useMemo(() => {
    let list = lessons.map((l) => ({ ...l, schoolKey: l.schoolKey ?? 'bronx_medical' }));

    // Use the passed prop (URL param) for filtering
    if (currentSchool && currentSchool !== 'all') {
      list = list.filter((l) => l.schoolKey === currentSchool);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          (l.title || '').toLowerCase().includes(q) ||
          (l.excerpt || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [lessons, currentSchool, search]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const l of filtered) {
      const k = l.schoolKey || 'bronx_medical';
      if (!groups[k]) groups[k] = [];
      groups[k].push(l);
    }
    const labels = {
      bronx_medical: 'Bronx HS Medical Science',
      aviation: 'Aviation HS',
      bushwick: 'Bushwick HS',
      brooklyn_law: 'Brooklyn Law',
      queens: 'Queens',
    };
    return Object.entries(groups).map(([key, items]) => ({ key, label: labels[key] || key, items }));
  }, [filtered]);

  function badges(lessonId) {
    const p = byLessonId[lessonId];
    if (!p) return null;
    const b = [];
    if (p.started) b.push('Viewed');
    if (p.quizTaken) b.push('Quiz');
    if (p.flashcardsUsed) b.push('Flashcards');
    if (p.slidesDownloaded) b.push('Slides');
    if (!b.length) return null;
    return (
      <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
        {b.join(' · ')}
      </span>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 64 }}>

      {/* FILTER BAR */}
      <div style={{
        background: 'white', padding: '16px 24px', borderRadius: 16,
        border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 40
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Search Frequency</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a mission..."
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
              fontSize: 14, background: '#f8fafc', outline: 'none'
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Sector</label>
          <SchoolSelector currentSchool={currentSchool} />
        </div>
      </div>

      {/* MISSION GRIDS */}
      {grouped.map(({ key, label, items }) => {
        const byClass = {};
        for (const item of items) {
          const classTag = item.tags?.find(t => t.startsWith('class:'))?.split(':')[1] || 'General';
          if (!byClass[classTag]) byClass[classTag] = [];
          byClass[classTag].push(item);
        }
        const classNames = Object.keys(byClass).sort();

        return (
          <div key={key} style={{ marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 8, height: 24, background: '#0f172a', borderRadius: 4 }} />
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {label}
              </h2>
            </div>

            {classNames.map(className => (
              <div key={className} style={{ marginBottom: 40, paddingLeft: 20, borderLeft: '2px solid #f1f5f9' }}>
                <h3 style={{
                  fontSize: 16, margin: '0 0 20px', color: '#64748b',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }} />
                  {className}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                  {byClass[className].map((lesson) => (
                    <Link key={lesson.id} href={`/lessons/${lesson.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <article style={{
                        background: 'white', borderRadius: 16, overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                        transition: 'all 0.2s', cursor: 'pointer', height: '100%',
                        display: 'flex', flexDirection: 'column'
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                      >
                        {/* THUMBNAIL */}
                        {lesson.videoUrl && (
                          <div
                            style={{
                              position: 'relative',
                              paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
                              height: 0,
                              background: '#1e293b', /* Dark background for better contrast */
                            }}
                          >
                            {/* High Res Thumbnail */}
                            <img
                              src={`https://img.youtube.com/vi/${lesson.videoUrl.split('/').pop()}/maxresdefault.jpg`}
                              alt={lesson.title}
                              loading="lazy"
                              style={{
                                position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
                                opacity: 0.9, transition: 'opacity 0.3s'
                              }}
                              onError={(e) => {
                                // Fallback to mqdefault if maxres doesn't exist, or hide if that fails
                                if (e.target.src.includes('maxresdefault')) {
                                  e.target.src = e.target.src.replace('maxresdefault', 'mqdefault');
                                } else {
                                  e.target.style.display = 'none';
                                }
                              }}
                            />

                            {/* Play Button Overlay */}
                            <div style={{
                              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(0,0,0,0.1)'
                            }}>
                              <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                              }}>
                                <div style={{
                                  width: 0, height: 0,
                                  borderTop: '8px solid transparent',
                                  borderBottom: '8px solid transparent',
                                  borderLeft: '14px solid #0f172a',
                                  marginLeft: 4
                                }} />
                              </div>
                            </div>

                            <div style={{
                              position: 'absolute', bottom: 12, right: 12,
                              background: 'rgba(0,0,0,0.7)', color: 'white',
                              fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6
                            }}>
                              BRIEFING
                            </div>
                          </div>
                        )}

                        {/* CONTENT */}
                        <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, lineHeight: 1.3, color: '#0f172a' }}>
                            {lesson.title}
                          </h4>
                          {lesson.excerpt && (
                            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {lesson.excerpt}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                              {new Date(lesson.lessonDate || lesson.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                            {badges(lesson.id) || (
                              <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>Available</span>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {
        filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>No missions found in this sector.</p>
            <p>Try adjusting your filters.</p>
          </div>
        )
      }
    </div >
  );
}
