#!/usr/bin/env node
/**
 * Re-tag Hygraph MediaItems with correct school tags.
 * 
 * The original sync assigned 'high-school' to everything.
 * This script updates each video's tags array to include the correct school key
 * based on the upload batch order from the GDrive → YouTube pipeline.
 * 
 * Run from portal root: node ../scripts/gdrive-to-youtube/retag-schools.js
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchLessonBySlug, updateLesson, publishLesson } from '../../portal/app/lib/hygraph.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS_PATH = path.join(__dirname, 'uploaded-videos.json');
const MAP_PATH = path.join(__dirname, '../../portal/data/school-drive-map.json');

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

// Known mapping: YouTube IDs → school keys
// Based on the upload batch output order (Bushwick → Brooklyn Law → Bronx Medical)
const YTID_TO_SCHOOL = {
  // === Pre-existing (old uploads, default to bushwick) ===
  'PEWIdbphaYw': 'bushwick',
  'KKra-c6T3dg': 'bushwick',
  '-N5RGAd_utM': 'brooklyn_law',
  'G3rLVh6W6nE': 'bushwick',
  'd7QzYwrhWGU': 'bronx_medical',
  // === Bushwick Leaders batch ===
  'g4xwG_9fFYE': 'bushwick',   // python-variables
  'EljqJ03H0us': 'bushwick',   // sandbox-python
  '0OK8Iy8P6CE': 'bushwick',   // ai-for-python
  'hJHU6yO3u6o': 'bushwick',   // cloning-project
  'cf4QTFH81qI': 'bushwick',   // python-intro
  'VmXJBVGfagQ': 'bushwick',   // supervised-learning
  '6FY9AohPstQ': 'bushwick',   // project-1-teachable-machine
  'WD4dPJ5T3CE': 'bushwick',   // understanding-ai-limit
  // === Brooklyn Law & Tech batch ===
  'gIDyVIcSxjY': 'brooklyn_law', // understanding-ai-limit
  'PPDTfp87hLA': 'brooklyn_law', // intro-to-ai
  'j-xYupkFlHU': 'brooklyn_law', // blueprint-ai
  'st0lfJWCZ_A': 'brooklyn_law', // class-warmup-ML-quiz
  'zq3smmrtU5U': 'brooklyn_law', // project-1-teachable-machine
  'gQR4hhN6p1w': 'brooklyn_law', // learning-ai-tools
  'LOINlkqoMHo': 'brooklyn_law', // intro-to-python
  // === Bronx Medical batch ===
  'BD6rGYWtR2E': 'bronx_medical', // python-variables
  'w6AqjnOJI7g': 'bronx_medical', // python-intro
  'J7DX6EJmJB4': 'bronx_medical', // intro-to-python
  'ZWJ_9OMpnFU': 'bronx_medical', // supervised-learning-warmup
  '0AogOUsq0JI': 'bronx_medical', // class-warmup-ML-quiz
  'HQ643sfMrZ8': 'bronx_medical', // blueprint-ai
};

async function main() {
  console.log('🏷️  Re-tagging Hygraph MediaItems with school keys\n');

  const videos = JSON.parse(await readFile(VIDEOS_PATH, 'utf8'));
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    const slug = slugify(video.name, video.youtubeId);
    const schoolTag = YTID_TO_SCHOOL[video.youtubeId];
    
    if (!schoolTag) {
      console.log(`   ⏭️  ${slug} — no school mapping found`);
      skipped++;
      continue;
    }

    // Fetch current lesson
    const lesson = await fetchLessonBySlug(slug);
    if (!lesson) {
      console.log(`   ❌ ${slug} — not found in Hygraph`);
      failed++;
      continue;
    }

    // Check if already tagged correctly
    if (lesson.tags?.includes(schoolTag)) {
      console.log(`   ✅ ${slug} — already tagged ${schoolTag}`);
      skipped++;
      continue;
    }

    // Update tags only (do NOT pass description — it's a rich text object, not a string)
    const newTags = [...new Set([...(lesson.tags || []), schoolTag])];
    const result = await updateLesson(lesson.id, {
      tags: newTags,
      videoUrl: video.url
    });

    if (result) {
      await publishLesson(lesson.id);
      console.log(`   🏷️  ${slug} → ${schoolTag}`);
      updated++;
    } else {
      console.log(`   ❌ ${slug} — update failed`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed:  ${failed}`);
}

main().catch(console.error);
