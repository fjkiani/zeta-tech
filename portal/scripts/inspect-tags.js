
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

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

async function checkTags() {
    const q = `
    {
      mediaItems(stage: PUBLISHED) {
        id
        title
        tags
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
    const items = json.data?.mediaItems || [];

    console.log(`\n🏷  Inspecting Tags (${items.length} items):`);
    items.forEach(i => {
        console.log(`   - [${i.title.substring(0, 30)}] Tags: ${JSON.stringify(i.tags)}`);
    });
}

checkTags();
