
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

// Patch Env
if (typeof process !== 'undefined') {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, ...values] = line.split('=');
                if (key && !key.startsWith('#')) {
                    process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
                }
            });
        }
    } catch (e) { }
}

const URL = process.env.NEXT_PUBLIC_HYGRAPH_URL;
const TOKEN = process.env.NEXT_PUBLIC_HYGRAPH_TOKEN;

async function checkType() {
    console.log("🕵️‍♀️ Diagnosing 'Type' Field...");

    // Query 1: Get EVERYTHING (No filter) and check their type
    const qRaw = `
    {
      mediaItems(stage: PUBLISHED) {
        id
        title
        type
      }
    }`;

    // Query 2: The Exact Query used by Frontend
    const qFiltered = `
    {
      mediaItems(stage: PUBLISHED, where: { type: VIDEO }) {
        id
        title
      }
    }`;

    try {
        const res1 = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ query: qRaw })
        });
        const json1 = await res1.json();
        const allItems = json1.data?.mediaItems || [];

        console.log(`\n📦 ALL MediaItems (${allItems.length}):`);
        allItems.forEach(i => console.log(`   - [${i.title.substring(0, 20)}...] Type: ${i.type}`));

        const res2 = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ query: qFiltered })
        });
        const json2 = await res2.json();
        const filteredItems = json2.data?.mediaItems || [];

        console.log(`\n🎯 FILTERED Query (where: {type: VIDEO}): Found ${filteredItems.length} items.`);

        if (allItems.length > 0 && filteredItems.length === 0) {
            console.log("⚠️  CRITICAL: Items exist but 'type' is NOT MATCHING 'VIDEO' enumeration!");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkType();
