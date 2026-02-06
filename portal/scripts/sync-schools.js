
import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLesson, publishLesson, fetchLessonBySlug, updateLesson } from '../app/lib/hygraph.js';
import fetch from 'node-fetch';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDS_PATH = process.env.GDRIVE_CREDS_DIR || path.join(process.env.HOME || '', '.config/mcp-gdrive');
const TOKENS_PATH = path.join(CREDS_PATH, 'token.json');
const KEYS_PATH = path.join(CREDS_PATH, 'gcp-oauth.keys.json');

const MAP_PATH = path.join(__dirname, '../data/school-drive-map.json');
const UPLOADED_JSON_PATH = path.join(__dirname, '../../scripts/gdrive-to-youtube/uploaded-videos.json');

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

async function getAuthEmail(auth) {
    const drive = google.drive({ version: 'v3', auth });
    try {
        const res = await drive.about.get({ fields: 'user(emailAddress)' });
        return res.data.user.emailAddress;
    } catch (e) {
        return "Unknown (Auth Error)";
    }
}

async function loadUploadedVideos() {
    try {
        const raw = await readFile(UPLOADED_JSON_PATH, 'utf8');
        const data = JSON.parse(raw);
        const map = {};
        for (const item of data) {
            map[item.name] = item.url;
        }
        console.log(`📹 Loaded ${Object.keys(map).length} YouTube references from uploaded-videos.json.`);
        return map;
    } catch (e) {
        console.warn(`⚠️  Could not load uploaded-videos.json (this is fine if no manual uploads yet).`);
        return {};
    }
}

// Returns array of objects: { file, className }
async function recursiveFindVideos(folderId, drive, className = "General", depth = 0) {
    if (depth > 3) return [];

    console.log(`   [Depth ${depth}] Scanning ${folderId} (Class: ${className})...`);

    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, createdTime, webViewLink, webContentLink)',
            orderBy: 'createdTime desc',
            pageSize: 100,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = res.data.files || [];
        let videos = [];

        for (const file of files) {
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                const subVideos = await recursiveFindVideos(file.id, drive, file.name, depth + 1);
                videos = videos.concat(subVideos);
            } else if (file.mimeType.startsWith('video/')) {
                videos.push({ file, className });
            }
        }
        return videos;
    } catch (err) {
        console.warn(`   ⚠️ Access denied or error scanning folder ${folderId}: ${err.message}`);
        return [];
    }
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function processVideo(item, schoolKey, config, drive, youtubeMap) {
    const video = item.file;
    const className = item.className;

    const slug = slugify(video.name.replace(/\.[^/.]+$/, ""));
    const date = video.createdTime;
    const tags = [config.tag, 'imported', `class:${className}`, 'high-school'];

    // Check for YouTube match
    let videoUrl = video.webViewLink;
    let isYoutube = false;

    if (youtubeMap && youtubeMap[video.name]) {
        videoUrl = youtubeMap[video.name];
        isYoutube = true;
        console.log(`   🎬 Processing: ${video.name} -> ${slug} [YouTube Found 📺]`);
    } else {
        console.log(`   🎬 Processing: ${video.name} -> ${slug} [GDrive Stream ☁️]`);
    }

    // Check if exists in Hygraph
    const existing = await fetchLessonBySlug(slug);

    if (existing) {
        // Check if we need to upgrade from Drive -> YouTube
        // If existing URL is Drive and we found a YouTube link, we MUST update it.

        const payload = {
            tags: tags,
            description: `Imported from GDrive. Class: ${className}`
        };

        if (isYoutube && !existing.videoUrl?.includes('youtube')) {
            console.log(`      ✨ Upgrading to YouTube URL...`);
            payload.videoUrl = videoUrl;
        }

        // Feature: Auto-fix dirty titles
        if (existing.title.startsWith('GMT20')) {
            console.log(`      🧹 Cleaning dirty title...`);
            payload.title = cleanTitle(video.name, date);
        }

        const updated = await updateLesson(existing.id, payload);
        if (updated) {
            console.log(`      ✅ Metadata Updated.`);
            await publishLesson(updated.id);
        }
        return;
    }

    // Smart Title Cleaning Logic
    function cleanTitle(filename, fileDate) {
        // Remove file extension
        let name = filename.replace(/\.[^/.]+$/, "");

        // Pattern 1: Remove Zoom-style "GMT202..." prefix and "Recording..." suffix
        // Ex: "GMT20260205-155135_Recording_1988x1118" -> "Recording" -> needs better fallback
        // Let's try to extract date from filename if possible, otherwise use fileDate

        // Remove the GMT timestamp noise
        name = name.replace(/^GMT\d{8}-\d{6}_/, "");

        // Remove resolution suffix like "_1920x1080" or "_Recording_..."
        name = name.replace(/_Recording.*$/, "");
        name = name.replace(/_\d+x\d+$/, "");

        // Clean up underscores/dashes
        name = name.replace(/[_-]/g, " ").trim();

        // If name is now generic or empty, use a nice date format
        if (!name || name.toLowerCase() === 'recording' || name.length < 3) {
            const dateObj = new Date(fileDate);
            if (!isNaN(dateObj.getTime())) {
                const options = { month: 'short', day: 'numeric', year: 'numeric' };
                // e.g. "Lesson Recording - Feb 5, 2026"
                return `Lesson Recording - ${dateObj.toLocaleDateString('en-US', options)}`;
            }
        }

        return name || "Untitled Lesson";
    }

    // CREATE NEW
    const payload = {
        title: cleanTitle(video.name, date),
        slug: slug,
        date: date,
        videoUrl: videoUrl, // Will be YT if found, else Drive
        tags: tags,
        description: `Imported from GDrive (ID: ${video.id}). Class: ${className}`
    };

    console.log(`      Creating in Hygraph...`);
    const created = await createLesson(payload);

    if (created && created.id) {
        console.log(`      ✅ Created! Publishing...`);
        await publishLesson(created.id);
        console.log(`      🚀 Saved.`);
    } else {
        console.log(`      ⚠️  Failed to create.`);
    }
}

async function syncSchool(schoolKey, config, drive, youtubeMap) {
    console.log(`\n🏫 Syncing ${config.label} (${schoolKey})...`);
    if (!config.folderId || config.folderId.includes('REPLACE')) {
        return;
    }

    const videos = await recursiveFindVideos(config.folderId, drive, "General");
    console.log(`   Found ${videos.length} videos.`);

    for (const item of videos) {
        await processVideo(item, schoolKey, config, drive, youtubeMap);
    }
}

async function main() {
    console.log("🔄 Starting Tri-School Sync (YouTube Linked)...");

    let schoolMap;
    try {
        schoolMap = JSON.parse(await readFile(MAP_PATH, 'utf8'));
    } catch (e) {
        console.error("Failed to load school-drive-map.json");
        process.exit(1);
    }

    const youtubeMap = await loadUploadedVideos();

    const auth = await getAuth();
    console.log(`🔑 Authenticated as: ${await getAuthEmail(auth)}`);
    const drive = google.drive({ version: 'v3', auth });

    for (const [key, config] of Object.entries(schoolMap)) {
        await syncSchool(key, config, drive, youtubeMap);
    }
}

main().catch(console.error);
