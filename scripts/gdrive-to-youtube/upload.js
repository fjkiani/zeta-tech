#!/usr/bin/env node
/**
 * GDrive → YouTube Upload Script
 * 
 * 1. Lists MP4 files in a Drive folder
 * 2. Downloads each
 * 3. Uploads to YouTube as unlisted
 * 4. Logs video IDs for Hygraph
 * 
 * Setup: npm install && npm run auth
 * Run:   GDRIVE_FOLDER_ID=YOUR_FOLDER_ID npm run upload
 */

import { google } from 'googleapis';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, writeFile, readFile, stat } from 'fs/promises';
import { pipeline } from 'stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = process.env.GDRIVE_CREDS_DIR || path.join(process.env.HOME || '', '.config/mcp-gdrive');
const TOKENS_PATH = path.join(CREDS_PATH, 'token.json');
const KEYS_PATH = path.join(CREDS_PATH, 'gcp-oauth.keys.json');
const DOWNLOAD_DIR = path.join(__dirname, '.downloads');
const MAP_PATH = path.join(__dirname, '../../portal/data/school-drive-map.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
];

async function getAuth() {
  const keys = JSON.parse(await readFile(KEYS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = keys.installed || keys.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const tokens = JSON.parse(await readFile(TOKENS_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  } catch {
    console.error('No token.json found. Run: npm run auth');
    process.exit(1);
  }
}

async function listVideosInFolder(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='video/mp4' and trashed=false`,
    fields: 'files(id, name, size)',
    orderBy: 'createdTime desc',
  });
  return res.data.files || [];
}

async function downloadFile(drive, fileId, destPath) {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  const writer = createWriteStream(destPath);
  await pipeline(res.data, writer);
}

async function uploadToYouTube(youtube, filePath, title) {

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title || path.basename(filePath, '.mp4'),
        description: 'Lesson video - High School Portal',
      },
      status: {
        privacyStatus: 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(filePath),
    },
  }, {
    maxRetries: 3,
  });

  return res.data.id;
}

// Helper to process a single folder and return results
async function processFolder(drive, youtube, folderId, label) {
  console.log(`\n📂 Scanning: ${label} (${folderId})`);
  const files = await listVideosInFolder(drive, folderId);

  if (files.length === 0) {
    console.log('   No MP4 files found.');
    return [];
  }

  console.log(`   Found ${files.length} video(s)\n`);

  // Load existing uploaded-videos.json to skip duplicates
  const outputPath = path.join(__dirname, 'uploaded-videos.json');
  let existing = [];
  try {
    const raw = await readFile(outputPath, 'utf8');
    existing = JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const existingNames = new Set(existing.map(e => e.name));

  const results = [];

  for (const file of files) {
    if (existingNames.has(file.name)) {
      console.log(`   ⏭️  Skipping (Already Uploaded): ${file.name}`);
      continue;
    }

    const destPath = path.join(DOWNLOAD_DIR, file.name);
    console.log(`   ⬇️  Downloading: ${file.name}`);

    try {
      await downloadFile(drive, file.id, destPath);
      console.log(`   ☁️  Uploading to YouTube...`);
      const videoId = await uploadToYouTube(youtube, destPath, file.name.replace(/\.mp4$/i, ''));
      results.push({ name: file.name, youtubeId: videoId, url: `https://www.youtube.com/watch?v=${videoId}` });
      console.log(`   ✅ Uploaded: https://www.youtube.com/watch?v=${videoId}`);
    } catch (err) {
      console.error(`   ✗ Failed:`, err.message);
    }
  }

  return results;
}

async function main() {
  console.log('🚀 GDrive → YouTube Batch Uploader\n');

  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });
  const youtube = google.youtube({ version: 'v3', auth });

  await mkdir(DOWNLOAD_DIR, { recursive: true });

  const singleFolderId = process.env.GDRIVE_FOLDER_ID;
  let allResults = [];

  if (singleFolderId) {
    // Single Mode
    allResults = await processFolder(drive, youtube, singleFolderId, "Target Folder");
  } else {
    // Batch Mode (All Schools)
    console.log('📡 Batch Mode: Reading Schools Map...');
    try {
      const rawMap = await readFile(MAP_PATH, 'utf8');
      const schoolMap = JSON.parse(rawMap);
      for (const [key, config] of Object.entries(schoolMap)) {
        if (config.folderId && !config.folderId.includes('REPLACE')) {
          const schoolResults = await processFolder(drive, youtube, config.folderId, config.label);
          allResults = [...allResults, ...schoolResults];
        }
      }
    } catch (e) {
      console.error("⚠️ Failed to load school-drive-map.json", e.message);
      return;
    }
  }

  // Save Final Results (Append/Merge)
  const outputPath = path.join(__dirname, 'uploaded-videos.json');
  let existing = [];
  try {
    const raw = await readFile(outputPath, 'utf8');
    existing = JSON.parse(raw);
  } catch (e) { /* ignore */ }

  const newResults = [...existing, ...allResults];
  const uniqueResults = Array.from(new Map(newResults.map(item => [item.youtubeId, item])).values());

  await writeFile(outputPath, JSON.stringify(uniqueResults, null, 2));
  console.log(`\n💾 Database Updated: ${outputPath} (Total: ${uniqueResults.length})`);
}

main().catch(console.error);
