
import { notFound } from 'next/navigation';
import { getSchoolConfig, SCHOOLS } from '../../lib/schools';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Cpu, Target, Calendar } from 'lucide-react';
import MindMapViewer from '../../components/MindMapViewer';
import MissionConsole from '../../components/MissionConsole';

export default function SchoolPortal({ params }) {
    const school = getSchoolConfig(params.key);

    // If key is invalid (and getSchoolConfig returned default but params didn't match), 404
    if (!SCHOOLS[params.key]) {
        notFound();
    }

    return (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>

            {/* Back Link */}
            <div style={{ padding: '24px 0' }}>
                <Link href="/" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    color: '#64748b', fontWeight: 600, textDecoration: 'none'
                }}>
                    <ArrowLeft size={16} /> Back to Hub
                </Link>
            </div>

            {/* School Hero */}
            <section style={{
                background: 'white', borderRadius: 24, padding: 48,
                border: '1px solid #e2e8f0', marginBottom: 48,
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, background: school.color }} />

                <div style={{ maxWidth: 700 }}>
                    <div style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: 8,
                        background: `${school.color}15`, color: school.color,
                        fontWeight: 700, fontSize: 13, marginBottom: 16
                    }}>
                        AUTHORIZED PERSONNEL ONLY
                    </div>
                    <h1 style={{ fontSize: 42, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
                        {school.label}
                    </h1>
                    <p style={{ fontSize: 20, color: '#64748b', lineHeight: 1.6 }}>
                        {school.description}
                    </p>
                </div>
            </section>

            {/* Tools & Curriculum Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>

                {/* Left Column: Curriculum Map */}
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={20} /> Curriculum Roadmap
                    </h2>
                    {/* Using MindMapViewer with a sample JSON endpoint for now - can be specialized later */}
                    <MindMapViewer url={`/api/mindmap?school=${school.key}`} />
                </div>

                {/* Right Column: Mission Control */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Active Mission Console */}
                    <div style={{ zIndex: 10 }}>
                        <MissionConsole school={school} />
                    </div>

                    {/* Quick Stats */}
                    <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Class Performance</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                            <div style={{ fontSize: 48, fontWeight: 800, color: school.color, lineHeight: 1 }}>A-</div>
                            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>Top 10%</div>
                        </div>
                        <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />
                        <Link href="/lessons" style={{ color: '#0f172a', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            View All Lessons <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                        </Link>
                    </div>

                </div>
            </div>

        </main>
    );
}
