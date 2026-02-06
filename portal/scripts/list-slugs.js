
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

const url = process.env.NEXT_PUBLIC_HYGRAPH_URL;
const token = process.env.NEXT_PUBLIC_HYGRAPH_TOKEN;

async function listSlugs() {
    console.log('Fetching slugs from:', url);

    const query = `
    query {
      mediaItems(where: { type: VIDEO }) {
        title
        slug
        stage
      }
    }
  `;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query })
        });

        const json = await res.json();
        if (json.errors) {
            console.error(json.errors);
        }

        console.table(json.data?.mediaItems || []);
    } catch (e) {
        console.error(e);
    }
}

listSlugs();
