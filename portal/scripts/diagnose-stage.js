
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

async function query(stage) {
    const q = `
    {
      mediaItems(stage: ${stage}) {
        id
        title
        stage
      }
    }`;

    const res = await fetch(URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ query: q })
    });

    const json = await res.json();
    return json.data?.mediaItems || [];
}

async function main() {
    console.log("🕵️‍♀️ Diagnosing Lesson Stages...");

    const drafts = await query("DRAFT");
    const published = await query("PUBLISHED");

    console.log(`\n📄 DRAFT Count: ${drafts.length}`);
    if (drafts.length > 0) {
        drafts.forEach(d => console.log(`   - [${d.id}] ${d.title}`));
    }

    console.log(`\nmw PUBLISHED Count: ${published.length}`);
    if (published.length > 0) {
        published.forEach(d => console.log(`   - [${d.id}] ${d.title}`));
    }

    if (drafts.length > 0 && published.length === 0) {
        console.log("\n⚠️  ISSUE FOUND: Lessons created but NOT PUBLISHED.");
        console.log("    Likely 'Publish' permission is missing on the token.");
    }
}

main();
