
import { fetchLessons } from '../app/lib/hygraph.js';
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

async function verify() {
    console.log("🔍 Verifying Content in Hygraph...");
    console.log("📍 Endpoint:", process.env.NEXT_PUBLIC_HYGRAPH_URL);

    const lessons = await fetchLessons();
    console.log(`\n📦 Total Lessons Found: ${lessons.length}`);

    if (lessons.length > 0) {
        console.log("\n✅ Recent Lessons:");
        lessons.slice(0, 5).forEach(l => {
            console.log(`   - [${l.slug}] ${l.title} (Video: ${l.videoUrl ? 'Yes' : 'No'})`);
        });
    } else {
        console.log("❌ No lessons found. Check Stage (Published vs Draft) or Auth.");
    }
}

verify();
