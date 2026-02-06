import Link from 'next/link';
import { ArrowRight, Trophy, Target, Zap, Clock } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  const name = user?.firstName || 'Cadet';

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>

      {/* HERO SECTION */}
      <section style={{
        padding: '64px 0',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.05) 0%, transparent 70%)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 12px', background: '#fef3c7', color: '#b45309',
          borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 24
        }}>
          <Zap size={14} fill="currentColor" /> SYSTEM ONLINE
        </div>
        <h1 style={{
          fontSize: '48px', fontWeight: 800, letterSpacing: '-1px',
          color: '#0f172a', marginBottom: 16, lineHeight: 1.1
        }}>
          Welcome back, {name}.<br />
          <span style={{ color: '#7c3aed' }}>Ready to resume training?</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: 600, margin: '0 auto 32px' }}>
          Your AI-powered learning cockpit is active. Track your progress, conquer missions, and master the curriculum.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/lessons" style={{
            padding: '12px 24px', background: '#0f172a', color: 'white',
            borderRadius: 12, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            Resume Mission <ArrowRight size={18} />
          </Link>
          <a href={process.env.NEXT_PUBLIC_SANDBOX_URL || 'http://localhost:3001'} target="_blank" rel="noopener noreferrer" style={{
            padding: '12px 24px', background: 'white', color: '#0f172a',
            borderRadius: 12, fontWeight: 600, textDecoration: 'none',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8
          }}>
            Open Sandbox ↗
          </a>
        </div>
      </section>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 48 }}>
        {[
          { icon: Trophy, label: 'Mastery Score', value: '85%', color: '#f59e0b', bg: '#fef3c7' },
          { icon: Target, label: 'Active Missions', value: '3', color: '#3b82f6', bg: '#eff6ff' },
          { icon: Clock, label: 'Learning Time', value: '12h 30m', color: '#10b981', bg: '#ecfdf5' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'white', padding: 24, borderRadius: 16,
            border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: stat.bg,
              color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{stat.label}</div>
              <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 800 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT ACTIVITY */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Recent Activity</h2>
          <Link href="/progress" style={{ fontSize: 14, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>View Full History →</Link>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {[1, 2, 3].map((item, i) => (
            <div key={i} style={{
              padding: '16px 24px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12, fontWeight: 700 }}>
                {i === 0 ? 'Today' : i === 1 ? 'Yest' : 'Feb 3'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{i === 0 ? 'Completed Quiz: Introduction to Aviation' : i === 1 ? 'Watched: Aerodynamics 101' : 'Started: Safety Protocols'}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{i === 0 ? 'Score: 90% • Aviation HS' : 'Duration: 15m • Aviation HS'}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? '#10b981' : '#64748b' }}>
                {i === 0 ? '+50 XP' : '+10 XP'}
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
