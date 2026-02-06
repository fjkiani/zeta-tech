
import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import path from 'path';

const CREDS_PATH = process.env.GDRIVE_CREDS_DIR || path.join(process.env.HOME || '', '.config/mcp-gdrive');
const TOKENS_PATH = path.join(CREDS_PATH, 'token.json');
const KEYS_PATH = path.join(CREDS_PATH, 'gcp-oauth.keys.json');

const FOLDER_ID = '1EI4okzmtKSGVjDOZCbkxOdfBszZi_OOl'; // Lessons folder

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
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    console.log(`Probing Folder: ${FOLDER_ID}`);
    const res = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed=false`, // No mimeType filter
        fields: 'files(id, name, mimeType, size)',
        orderBy: 'createdTime desc',
    });

    const files = res.data.files || [];
    if (files.length === 0) {
        console.log('Empty folder.');
    } else {
        console.table(files.map(f => ({ name: f.name, type: f.mimeType, id: f.id })));
    }
}

main().catch(console.error);
