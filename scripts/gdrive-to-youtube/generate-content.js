#!/usr/bin/env node
/**
 * Batch Content Generator
 * 
 * After sync-to-hygraph.js creates MediaItems, this script triggers
 * the /api/lessons/[slug]/generate endpoint for each artifact type.
 * 
 * Requires the Next.js dev server to be running on localhost:3000.
 * 
 * Usage: node generate-content.js [--assets quiz,flashcards,slideDeck,audio,mindMap]
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS_PATH = path.join(__dirname, 'uploaded-videos.json');
const BASE_URL = process.env.PORTAL_URL || 'http://localhost:3000';

const ALL_ASSETS = ['quiz', 'flashcards', 'slideDeck', 'audio', 'mindMap'];

// Parse --assets flag
const assetsArg = process.argv.find(a => a.startsWith('--assets='));
const ASSETS = assetsArg
  ? assetsArg.split('=')[1].split(',')
  : ALL_ASSETS;

function slugify(name, ytId) {
  let base = name
    .replace(/\.mp4$/i, '')
    .replace(/GMT\d{8}-\d{6}_Recording_\d+x\d+/i, 'recording')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  if (ytId) base = `${base}-${ytId.slice(0, 6)}`;
  return base;
}

async function triggerGenerate(slug, artifactType, videoUrl) {
  const url = `${BASE_URL}/api/lessons/${slug}/generate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactType, videoUrl }),
    });
    const json = await res.json();
    if (json.status === 'completed') {
      return { ok: true, url: json.artifactUrl };
    }
    return { ok: false, error: json.error || 'Unknown error' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('🧠 Batch Content Generator\n');
  console.log(`   Assets: ${ASSETS.join(', ')}`);
  console.log(`   Portal: ${BASE_URL}\n`);

  const videos = JSON.parse(await readFile(VIDEOS_PATH, 'utf8'));
  
  let totalGenerated = 0;
  let totalCached = 0;
  let totalFailed = 0;

  for (const video of videos) {
    const slug = slugify(video.name, video.youtubeId);
    console.log(`\n📦 ${slug}`);

    for (const asset of ASSETS) {
      process.stdout.write(`   ⚙️  ${asset}... `);
      const result = await triggerGenerate(slug, asset, video.url);
      
      if (result.ok) {
        if (result.url) {
          console.log(`✅ ${result.url}`);
        } else {
          console.log(`✅ (cached)`);
          totalCached++;
        }
        totalGenerated++;
      } else {
        console.log(`❌ ${result.error}`);
        totalFailed++;
      }
      
      // Delay between generations to avoid overwhelming NotebookLM
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${totalGenerated}`);
  console.log(`   Cached:    ${totalCached}`);
  console.log(`   Failed:    ${totalFailed}`);
}

main().catch(console.error);
