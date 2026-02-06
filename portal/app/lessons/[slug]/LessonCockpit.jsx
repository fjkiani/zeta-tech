'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ContextEditor from '../../components/ContextEditor';
import ContextSignal from '../../components/ContextSignal';
import ObjectivesTracker from '../../components/ObjectivesTracker';
import AIChat from '../../components/AIChat';
import AssetLibrary from '../../components/AssetLibrary';
import VideoPlayer from '../../components/scavenged/VideoPlayer';
import QuizSection from '../../components/QuizSection';
import FlashcardSection from '../../components/FlashcardSection';
import GapsSection from '../../components/GapsSection';
import GenerationActions from './GenerationActions';
import LessonViewTracker from './LessonViewTracker';
import MindMapViewer from '../../components/MindMapViewer';
import CsvViewer from '../../components/CsvViewer';
import SlidesViewer from '../../components/SlidesViewer';
import MarkdownContent from '../../components/MarkdownContent';
import GenerationWrapper from '../../components/GenerationWrapper';
import { getSchoolConfig } from '../../lib/schools';

export default function LessonCockpit({
    lesson,
    artifacts,
    mapping,
    initialContext,
    initialTranscript,
    schoolKey,
    objectives,
    takeaways
}) {
    const [activeTab, setActiveTab] = useState('overview'); // overview, quiz, flashcards, slides
    const [transcript, setTranscript] = useState(initialTranscript);

    // Auto-Fetch Transcript on Load if missing
    useEffect(() => {
        if (!initialTranscript && lesson.videoUrl) {
            console.log("Auto-Fetching Transcript...");
            fetch('/api/scavenge/transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: lesson.videoUrl })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.transcript) setTranscript(data.transcript);
                })
                .catch(err => console.error("Auto-fetch failed:", err));
        }
    }, [initialTranscript, lesson.videoUrl]);

    const handleTabChange = (tab) => {
        // Scroll to section
        const element = document.getElementById(tab);
        if (element) {
            const offset = 100; // Sticky header offset
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
        setActiveTab(tab); // Keep tracking for highlighting (optional)
    };

    // ScrollSpy & Visited Tracking
    const [visited, setVisited] = useState(new Set(['overview'])); // Default visited

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    setActiveTab(id);
                    setVisited(prev => new Set([...prev, id]));
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px', // Trigger when section is near top
            threshold: 0.1
        });

        // Observe all sections
        const ids = ['overview', 'audio', 'slides', 'onePager', 'quiz', 'flashcards', 'mindMap', 'dataTable', 'transcript'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [artifacts]); // Re-run if artifacts load (sections appear)

    // Quiz Score Tracking for AI Context
    const [quizScore, setQuizScore] = useState(null);
    const handleScoreUpdate = (score, wrongIndices) => {
        setQuizScore({ ...score, wrongIndices });
    };

    return (
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
            <LessonViewTracker lessonId={lesson.id} schoolKey={schoolKey} />
            <nav style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/lessons" style={{ color: '#475569', textDecoration: 'none', fontWeight: 500 }}>← Back to Lessons</Link>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{getSchoolConfig(schoolKey).label}</div>
            </nav>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '32px', alignItems: 'start' }}>
                {/* LEFT COLUMN: Main Content & Media */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

                    {/* Header Card (Overview) */}
                    <div id="overview" className="scroll-mt-24">
                        <article style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', marginBottom: 48 }}>
                            <h1 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>{lesson.title}</h1>
                            {lesson.excerpt && <p style={{ color: '#64748b', margin: 0, lineHeight: '1.6', fontSize: '16px' }}>{lesson.excerpt}</p>}
                        </article>

                        {/* Persistent Video Player & Summary Bar */}
                        <div style={{ position: 'relative' }}>
                            {lesson.videoUrl && <VideoPlayer videoUrl={lesson.videoUrl} />}
                            {/* Lesson Plan (Markdown) - under video */}
                            {lesson.lessonPlan && (
                                <div style={{ marginTop: 32, padding: 24, background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#1e293b' }}>Lesson Plan</h3>
                                    <MarkdownContent content={lesson.lessonPlan} />
                                </div>
                            )}

                            {lesson.videoFile?.url && (
                                <div style={{ marginTop: 24 }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>Supplementary Video</h3>
                                    <GenerationWrapper
                                        title="Generate Supplementary Content"
                                        subtitle="AI will curate and retrieve relevant supplementary video material."
                                        buttonLabel="Generate Video"
                                        loadingLabel="Curating Video Content..."
                                    >
                                        <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                            <video
                                                src={lesson.videoFile.url}
                                                controls
                                                style={{ width: '100%', maxHeight: 500, background: '#000', display: 'block' }}
                                            />
                                        </div>
                                    </GenerationWrapper>
                                </div>
                            )}

                            {/* Summarize Overlay / Action Bar */}
                            <div style={{
                                marginTop: 12,
                                background: '#f5f3ff',
                                border: '1px solid #ddd6fe',
                                borderRadius: 8,
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 24
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '14px', color: '#5b21b6', fontWeight: 600 }}>Video Intel</span>
                                    {!transcript && <span style={{ fontSize: '12px', color: '#64748b' }}>Transcript needed for AI generation.</span>}
                                </div>

                                <ContextEditor
                                    lessonId={lesson.id}
                                    initialContext={initialContext}
                                    initialTranscript={transcript}
                                    videoUrl={lesson.videoUrl}
                                    compact={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* DASHBOARD SECTIONS - Stacked 1-by-1 */}

                    {/* 1. GAPS / OVERVIEW */}
                    <GapsSection lessonId={lesson.id} />

                    <div style={{ borderBottom: '1px solid #e2e8f0' }} />

                    {/* 2. AUDIO DEEP DIVE */}
                    <section id="audio" className="scroll-mt-24">
                        {artifacts.audio ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                    {mapping?.artifacts?.audio?.provenance && (
                                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            🤖 {mapping.artifacts.audio.provenance.description || 'Generated by AI'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ padding: 48, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: 24, textAlign: 'center' }}>
                                    <div style={{ fontSize: '64px', marginBottom: 24 }}>🎧</div>
                                    <h3 style={{ marginBottom: 8, fontSize: '20px' }}>Audio Deep Dive</h3>
                                    <p style={{ marginBottom: 24, color: '#64748b' }}>Listen to an AI-generated discussion about this lesson.</p>
                                    <audio controls src={artifacts.audio} style={{ width: '100%', maxWidth: 600, borderRadius: 30 }} />
                                </div>
                            </>
                        ) : (
                            <GenerationActions target="audio" lessonId={lesson.id} schoolKey={schoolKey} artifacts={artifacts} videoUrl={lesson.videoUrl} />
                        )}
                    </section>

                    <div style={{ borderBottom: '1px solid #e2e8f0' }} />

                    {/* 3. SLIDES (PDF Deck from Hygraph or generated) */}
                    <section id="slides" className="scroll-mt-24">
                        {artifacts.slideDeck ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Lesson Slides</h3>
                                    {mapping?.artifacts?.slideDeck?.provenance && (
                                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            🤖 {mapping.artifacts.slideDeck.provenance.description || 'Generated by AI'}
                                        </span>
                                    )}
                                </div>

                                <GenerationWrapper
                                    title="Generate Lesson Slides"
                                    subtitle="Use NotebookLM to generate the slide deck from the lesson context."
                                    buttonLabel="Generate Slides"
                                    loadingLabel="Generating Slides..."
                                >
                                    <SlidesViewer url={artifacts.slideDeck} />
                                </GenerationWrapper>
                            </>
                        ) : (
                            <GenerationActions target="slideDeck" lessonId={lesson.id} schoolKey={schoolKey} artifacts={artifacts} videoUrl={lesson.videoUrl} />
                        )}
                    </section>

                    {artifacts.onePager && (
                        <>
                            <div style={{ borderBottom: '1px solid #e2e8f0' }} />
                            <section id="onePager" className="scroll-mt-24">
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 16 }}>1 Pager</h3>
                                <GenerationWrapper
                                    title="Generate 1-Pager"
                                    subtitle="Create a concise one-page summary of the lesson."
                                    buttonLabel="Generate 1-Pager"
                                    loadingLabel="Generating Summary..."
                                >
                                    <div className="w-full h-[85vh] min-h-[800px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
                                        <iframe
                                            src={artifacts.onePager}
                                            title="1 Pager"
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                                        <a href={artifacts.onePager} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>
                                            Open PDF in new tab ↗
                                        </a>
                                    </div>
                                </GenerationWrapper>
                            </section>
                        </>
                    )}

                    <div style={{ borderBottom: '1px solid #e2e8f0' }} />

                    {/* 4. MIND MAP */}
                    <section id="mindMap" className="scroll-mt-24">
                        {artifacts.mindMap ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Concept Map</h3>
                                    {mapping?.artifacts?.mindMap?.provenance && (
                                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            🤖 {mapping.artifacts.mindMap.provenance.description || 'Generated by AI'}
                                        </span>
                                    )}
                                </div>
                                <MindMapViewer url={artifacts.mindMap} />
                            </>
                        ) : (
                            <GenerationActions target="mindMap" lessonId={lesson.id} schoolKey={schoolKey} artifacts={artifacts} videoUrl={lesson.videoUrl} />
                        )}
                    </section>

                    <div style={{ borderBottom: '1px solid #e2e8f0' }} />

                    {/* 5. QUIZ */}
                    <section id="quiz" className="scroll-mt-24">
                        {artifacts.quiz ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Interactive Quiz</h3>
                                    {mapping?.artifacts?.quiz?.provenance && (
                                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            🤖 {mapping.artifacts.quiz.provenance.description || 'Generated by AI'}
                                        </span>
                                    )}
                                </div>
                                <QuizSection
                                    quizUrl={artifacts.quiz}
                                    lessonId={lesson.id}
                                    schoolKey={schoolKey}
                                    onScoreUpdate={handleScoreUpdate}
                                />
                            </>
                        ) : (
                            <GenerationActions target="quiz" lessonId={lesson.id} schoolKey={schoolKey} artifacts={artifacts} videoUrl={lesson.videoUrl} />
                        )}
                    </section>

                    <div style={{ borderBottom: '1px solid #e2e8f0' }} />

                    {/* 6. FLASHCARDS */}
                    <section id="flashcards" className="scroll-mt-24">
                        {artifacts.flashcards ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Study Flashcards</h3>
                                    {mapping?.artifacts?.flashcards?.provenance && (
                                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            🤖 {mapping.artifacts.flashcards.provenance.description || 'Generated by AI'}
                                        </span>
                                    )}
                                </div>
                                <FlashcardSection flashcardsUrl={artifacts.flashcards} lessonId={lesson.id} schoolKey={schoolKey} />
                            </>
                        ) : (
                            <GenerationActions target="flashcards" lessonId={lesson.id} schoolKey={schoolKey} artifacts={artifacts} videoUrl={lesson.videoUrl} />
                        )}
                    </section>

                    <div style={{ borderBottom: '1px solid #e2e8f0' }} />


                    {/* 8. TRANSCRIPT (Always at bottom) */}
                    <section id="transcript" className="scroll-mt-24">
                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 16 }}>Full Transcript</h3>
                        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                            <ContextEditor
                                lessonId={lesson.id}
                                initialContext={initialContext}
                                initialTranscript={transcript}
                                videoUrl={lesson.videoUrl}
                                alwaysOpen={true}
                                initialTab="transcript"
                            />
                        </div>
                    </section>

                </div>

                {/* RIGHT COLUMN: Study Cockpit (Intel) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>

                    <ContextSignal
                        artifacts={artifacts}
                        hasContext={initialContext.length > 0}
                        hasTranscript={!!transcript}
                        lessonData={lesson}
                    />

                    {/* Asset Library acts as Navigation Controller */}
                    <AssetLibrary
                        artifacts={artifacts}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        completedSections={Array.from(visited)}
                    />

                    <ObjectivesTracker objectives={objectives} />

                    <AIChat
                        lessonId={lesson.id}
                        initialContext={initialContext}
                        transcript={transcript}
                        quizScore={quizScore}
                    />

                    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>💡</span> Smart Takeaways
                        </h3>
                        {takeaways.length > 0 ? (
                            <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 12 }}>
                                {takeaways.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: 6, height: 6, borderRadius: '50%', background: '#3b82f6', marginTop: 7 }} />
                                        <p style={{ margin: 0, lineHeight: '1.5' }}>{t}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>
                                No takeaways yet. Try summarizing the video!
                            </p>
                        )}
                    </div>

                    {/* Teacher Tools (Removed - Now Contextual) */}
                    {/* Access to Context Editor for Teacher is via the Overview 'Summarize' bar or potentially a sidebar action if needed. 
                        For now, keeping it clean as requested. */}

                </div>
            </div>
        </main>
    );
}
