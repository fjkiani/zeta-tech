
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0 && !key.startsWith('#')) {
            process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const HYGRAPH_URL = process.env.NEXT_PUBLIC_HYGRAPH_URL;
const HYGRAPH_TOKEN = process.env.NEXT_PUBLIC_HYGRAPH_TOKEN;
const TARGET_SLUG = 'ai-hallucinations';

const QUERY = `
  query GetMediaItemBySlug($slug: String!) {
    mediaItems(stage: PUBLISHED, where: { slug: $slug, type: VIDEO }, first: 1) {
      id
      title
      slug
      tags
      stage
    }
  }
`;

async function debugSlug() {
    console.log('🔍 Debugging Slug:', TARGET_SLUG);
    console.log('🌐 URL:', HYGRAPH_URL);

    try {
        const res = await fetch(HYGRAPH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HYGRAPH_TOKEN}`
            },
            body: JSON.stringify({
                query: QUERY,
                variables: { slug: TARGET_SLUG }
            })
        });

        const json = await res.json();
        console.log('📦 Full Response:', JSON.stringify(json, null, 2));

        if (json.data?.mediaItems?.length > 0) {
            console.log('✅ FOUND:', json.data.mediaItems[0]);
        } else {
            console.log('❌ NOT FOUND with strict query.');
        }

    } catch (e) {
        console.error('💥 Error:', e);
    }
}

debugSlug();
