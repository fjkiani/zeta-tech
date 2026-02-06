'use client';

function getYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length >= 10) ? match[2] : null;
}

export default function VideoPlayer({ videoUrl }) {
    const videoId = getYoutubeId(videoUrl);
    const isGDrive = videoUrl && videoUrl.includes('drive.google.com');

    if (!videoUrl) return null;

    let src = videoUrl;
    if (videoId) {
        src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }

    if (!videoId && !isGDrive) {
        return (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <p>Invalid Video URL</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'relative',
            paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
            height: 0,
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <iframe
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                src={src}
                title="Video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
