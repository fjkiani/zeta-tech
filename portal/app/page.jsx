import Link from 'next/link';
import { Zap } from 'lucide-react';
import { fetchLessons } from './lib/hygraph';
import LessonsListWithProgress from './components/LessonsListWithProgress';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
  const user = await currentUser();
  const name = user?.firstName || 'Cadet';
  const schoolFilter = searchParams?.school || 'all';

  // Fetch all lessons across all sectors
  const lessons = await fetchLessons('all');

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>

      {/* COMPACT HERO SECTION */}
      <section style={{
        padding: '64px 0 48px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', background: '#0f172a', color: 'white',
          borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 24,
          letterSpacing: '0.05em'
        }}>
          <Zap size={14} fill="currentColor" /> Zeta-Tech
        </div>
        <h1 style={{
          fontSize: '48px', fontWeight: 900, letterSpacing: '-1.5px',
          color: '#0f172a', marginBottom: 16, lineHeight: 1.1
        }}>
          Welcome back, {name}. <br />
          <span style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Your Mission Board.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
          Select a sector and deploy directly into your next assignment.
        </p>
      </section>

      {/* FULL LESSON BOARD */}
      <LessonsListWithProgress lessons={lessons} currentSchool={schoolFilter} />

    </main>
  );
}
