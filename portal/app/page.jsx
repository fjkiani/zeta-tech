import Link from 'next/link';
import { ArrowRight, Trophy, Target, Zap, Clock, Beaker, Plane, Terminal, Scale } from 'lucide-react';
import { SCHOOLS } from './lib/schools';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  const name = user?.firstName || 'Cadet';

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>

      {/* HERO SECTION */}
      <section style={{
        padding: '80px 0 64px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', background: '#0f172a', color: 'white',
          borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 32,
          letterSpacing: '0.05em'
        }}>
          <Zap size={14} fill="currentColor" /> NYC-FINEST.TECH
        </div>
        <h1 style={{
          fontSize: '56px', fontWeight: 900, letterSpacing: '-2px',
          color: '#0f172a', marginBottom: 24, lineHeight: 1.05
        }}>
          Empowering the <br />
          <span style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Next Generation.</span>
        </h1>
        <p style={{ fontSize: '20px', color: '#475569', maxWidth: 640, margin: '0 auto 48px', lineHeight: 1.6 }}>
          Professional-grade AI tools for NYC's core high schools. <br />
          Master your craft with intelligence that adapts to your curriculum.
        </p>
      </section>

      {/* SCHOOLS GRID */}
      <section style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
          Select Your Academy
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {Object.values(SCHOOLS).map((school) => {
            // Dynamic Icon Matching (Simple Map)
            const IconMap = {
              'Beaker': Beaker,
              'Plane': Plane,
              'Terminal': Terminal,
              'Scale': Scale
            };
            // Better: Import more icons at top
            const SchoolIcon = IconMap[school.iconName] || Target;

            return (
              <Link key={school.key} href={`/schools/${school.key}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 24, padding: 32,
                  border: '1px solid #e2e8f0', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  position: 'relative', overflow: 'hidden'
                }} className="hover:shadow-xl hover:-translate-y-1">

                  {/* Top Accent */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: school.color }} />

                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${school.color}15`, color: school.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24
                  }}>
                    <SchoolIcon size={28} />
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                    {school.label}
                  </h3>

                  <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, marginBottom: 32, flex: 1 }}>
                    {school.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                    {school.features?.map(feat => (
                      <span key={feat} style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 10px',
                        borderRadius: 6, background: '#f8fafc', color: '#475569',
                        border: '1px solid #e2e8f0'
                      }}>
                        {feat}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    padding: '12px 20px', borderRadius: 12,
                    background: '#0f172a', color: 'white', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    {school.cta} <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* GLOBAL STATS */}
      <section style={{
        background: 'white', borderRadius: 24, padding: '48px',
        border: '1px solid #e2e8f0', textAlign: 'center'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          <div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>1.2k</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginTop: 8 }}>Active Cadets</div>
          </div>
          <div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>850</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginTop: 8 }}>Flashcards Generated</div>
          </div>
          <div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>98%</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginTop: 8 }}>Pass Rate</div>
          </div>
        </div>
      </section>

    </main>
  );
}
