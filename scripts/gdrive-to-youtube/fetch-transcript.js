
import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = process.env.GDRIVE_CREDS_DIR || path.join(process.env.HOME || '', '.config/mcp-gdrive');
const TOKENS_PATH = path.join(CREDS_PATH, 'token.json');
const KEYS_PATH = path.join(CREDS_PATH, 'gcp-oauth.keys.json');
const MAPPING_PATH = path.join(__dirname, 'uploaded-videos.json');

const FOLDER_ID = '1EI4okzmtKSGVjDOZCbkxOdfBszZi_OOl';

async function getAuth() {
    try {
        const keys = JSON.parse(await readFile(KEYS_PATH, 'utf8'));
        const { client_id, client_secret, redirect_uris } = keys.installed || keys.web;
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        const tokens = JSON.parse(await readFile(TOKENS_PATH, 'utf8'));
        oauth2Client.setCredentials(tokens);
        return oauth2Client;
    } catch (e) {
        console.error('Auth Error:', e.message);
        process.exit(1);
    }
}

async function main() {
    const videoId = process.argv[2];
    if (!videoId) {
        console.error('Usage: node fetch-transcript.js <YOUTUBE_VIDEO_ID>');
        process.exit(1);
    }

    // 1. Lookup in mapping
    let mapping = [];
    try {
        mapping = JSON.parse(await readFile(MAPPING_PATH, 'utf8'));
    } catch (e) {
        console.error('Mapping file not found or invalid.');
        process.exit(1);
    }

    const record = mapping.find(m => m.youtubeId === videoId);
    if (!record) { // Falback: try to find by fuzzy match if passed a filename/slug? No, stick to ID.
        console.error(`Video ID ${videoId} not found in uploaded-videos.json`);
        process.exit(1);
    }

    // 2. Derive base name (remove extension and resolution suffix if present)
    // Example: GMT20260203-151510_Recording_640x360.mp4 -> GMT20260203-151510_Recording
    const baseName = record.name.replace(/_640x360\.mp4$/, '').replace(/\.mp4$/, '');

    // 3. Search GDrive for matching transcript
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and name contains '${baseName}' and (mimeType='text/vtt' or mimeType='text/plain') and trashed=false`,
        fields: 'files(id, name, mimeType)',
    });

    const files = res.data.files || [];
    if (files.length === 0) {
        console.error('No matching transcript file found in GDrive.');
        process.exit(1);
    }

    // Prefer .txt (likely chat/transcript) over .vtt (captions), or VTT if TXT missing?
    // User said "has the transcripts". Let's pick .txt if available, else .vtt
    const transcriptFile = files.find(f => f.name.endsWith('.txt')) || files[0];

    // 4. Download content
    const destres = await drive.files.get({ fileId: transcriptFile.id, alt: 'media' }, { responseType: 'stream' });

    destres.data.on('data', chunk => process.stdout.write(chunk));
    destres.data.on('end', () => { });
    destres.data.on('error', err => {
        console.error('Download Error:', err);
        process.exit(1);
    });
}

main().catch(console.error);
