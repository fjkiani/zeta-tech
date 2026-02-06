
import { fetchLessons } from '../app/lib/hygraph.js';
import fetch from 'node-fetch';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

// Manually load env since we are running as a script
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    } catch (e) {
        console.error("Could not load .env.local", e);
    }
}

loadEnv();

async function main() {
    console.log("🔍 Inspecting Hygraph Data...");
    const lessons = await fetchLessons();
    console.log(`Found ${lessons.length} lessons.`);

    lessons.forEach(l => {
        console.log(`--------------------------------------------------`);
        console.log(`Title: ${l.title}`);
        console.log(`Slug:  ${l.slug}`);
        console.log(`URL:   ${l.videoUrl}`);
        console.log(`Tags:  [${l.tags?.join(', ')}]`);
        console.log(`SchoolKey (Normalized): ${l.schoolKey}`);
    });
}

main();
