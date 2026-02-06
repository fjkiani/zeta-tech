import { spawn } from 'child_process';
import path from 'path';

export async function POST(request) {
    try {
        const { url } = await request.json();
        if (!url) {
            return Response.json({ error: 'Missing YouTube URL' }, { status: 400 });
        }

        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        // Execute GDrive fetch script
        const scriptPath = path.join(process.cwd(), '..', 'scripts', 'gdrive-to-youtube', 'fetch-transcript.js');

        const content = await new Promise((resolve, reject) => {
            const proc = spawn('node', [scriptPath, videoId]);
            let data = '';
            let error = '';

            proc.stdout.on('data', (chunk) => data += chunk);
            proc.stderr.on('data', (chunk) => error += chunk);

            proc.on('close', (code) => {
                if (code !== 0) reject(new Error(error || 'Script failed'));
                else resolve(data);
            });
        });

        return Response.json({ transcript: content });

    } catch (error) {
        console.error('GDrive Fetch Error:', error);
        return Response.json({ error: 'Failed to fetch from GDrive: ' + error.message }, { status: 500 });
    }
}
