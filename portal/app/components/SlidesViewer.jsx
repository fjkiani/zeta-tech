'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming lucide-react is installed (it is in package.json)

// Configure PDF worker
if (typeof window !== 'undefined' && pdfjs) {
    try {
        console.log(`[SlidesViewer] Configuring Worker for version: ${pdfjs.version}`);
        // Use .mjs for the worker as required by newer versions
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    } catch (e) {
        console.error("Worker config error", e);
    }
}

export default function SlidesViewer({ url }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pageWidth, setPageWidth] = useState(800);

    const containerRef = useRef(null);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
    }

    function changePage(offset) {
        setPageNumber(prevPageNumber => {
            const next = prevPageNumber + offset;
            if (next < 1) return 1;
            if (numPages && next > numPages) return numPages;
            return next;
        });
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }

    // Handle standard browser fullscreen change events (ESC key etc)
    useEffect(() => {
        const handleFsChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            // Adjust width logic
            setPageWidth(isFs ? window.innerWidth * 0.9 : 800);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') changePage(-1);
            if (e.key === 'ArrowRight') changePage(1);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [numPages]); // re-bind if pages change? actually safe to verify bounds inside changePage

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'white',
                borderRadius: isFullscreen ? 0 : 16,
                boxShadow: isFullscreen ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                border: isFullscreen ? 'none' : '1px solid #e2e8f0',
                overflow: isFullscreen ? 'auto' : 'hidden', // Allow scroll in FS if huge
                width: isFullscreen ? '100vw' : '100%',
                height: isFullscreen ? '100vh' : 'auto',
                position: isFullscreen ? 'fixed' : 'relative',
                top: 0, left: 0, zIndex: isFullscreen ? 9999 : 0
            }}>

            {/* Header / Toolbar inside FS */}
            {isFullscreen && (
                <div style={{
                    position: 'absolute', top: 20, right: 20, zIndex: 10,
                    background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8
                }}>
                    <button onClick={toggleFullscreen} style={{ color: 'white', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <Minimize size={24} />
                    </button>
                </div>
            )}

            <div style={{
                position: 'relative',
                width: '100%',
                minHeight: isFullscreen ? '100vh' : 400,
                background: isFullscreen ? '#0f172a' : '#f8fafc',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
            }}>
                {loading && <div style={{ color: '#94a3b8' }}>Loading Slides...</div>}

                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div style={{ padding: 20 }}>Loading PDF...</div>}
                    error={<div style={{ padding: 20, color: 'red' }}>Failed to load PDF.</div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className={isFullscreen ? "animate-in fade-in zoom-in duration-300" : ""}
                    />
                </Document>
            </div>

            {/* Controls */}
            {/* HIDE controls in FS? No, we need them if no keyboard users. 
                But position them differently? Overlay? 
                Let's stick to bar at bottom, maybe overlay style in FS.
            */}
            <div style={{
                width: '100%',
                padding: '16px 24px',
                borderTop: isFullscreen ? 'none' : '1px solid #e2e8f0',
                background: isFullscreen ? 'rgba(0,0,0,0.8)' : '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: isFullscreen ? 'white' : 'inherit',
                position: isFullscreen ? 'absolute' : 'relative',
                bottom: 0
            }}>
                <button
                    type="button"
                    disabled={pageNumber <= 1}
                    onClick={() => changePage(-1)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: isFullscreen ? '1px solid #475569' : '1px solid #cbd5e1',
                        background: pageNumber <= 1 ? (isFullscreen ? '#1e293b' : '#f1f5f9') : (isFullscreen ? '#334155' : 'white'),
                        color: pageNumber <= 1 ? '#64748b' : (isFullscreen ? '#fff' : '#334155'),
                        cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 8
                    }}
                >
                    <ChevronLeft size={16} /> Previous
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: isFullscreen ? '#e2e8f0' : '#475569' }}>
                        {pageNumber} / {numPages || '--'}
                    </span>

                    {/* FS Toggle in Bar */}
                    <button
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: isFullscreen ? '#fff' : '#475569', display: 'flex', alignItems: 'center' }}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>

                <button
                    type="button"
                    disabled={pageNumber >= numPages}
                    onClick={() => changePage(1)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: isFullscreen ? '1px solid #475569' : '1px solid #cbd5e1',
                        background: pageNumber >= numPages ? (isFullscreen ? '#1e293b' : '#f1f5f9') : (isFullscreen ? '#334155' : 'white'),
                        color: pageNumber >= numPages ? '#64748b' : (isFullscreen ? '#fff' : '#334155'),
                        cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 8
                    }}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
