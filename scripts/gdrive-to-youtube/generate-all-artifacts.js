#!/usr/bin/env node
/**
 * generate-all-artifacts.js
 *
 * Parses the transcript.mdc file, extracts each lesson's transcript,
 * saves it as a clean transcript.md, adds it as a source to a shared
 * NotebookLM notebook, then generates quiz + flashcards + slides for each.
 *
 * Usage:
 *   node generate-all-artifacts.js [--notebook-id <id>] [--skip-existing] [--only <slug>]
 *
 * The shared notebook ID defaults to the one already created:
 *   a11024ca-32f7-41cf-9373-043fb9710ec7
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PORTAL_ROOT = path.join(PROJECT_ROOT, 'portal');
const NOTEBOOKLM_SH = path.join(PROJECT_ROOT, 'scripts', 'notebooklm-py', 'notebooklm.sh');
const TRANSCRIPT_FILE = path.join(PROJECT_ROOT, '.cursor', 'rules', 'transcript.mdc');
const DATA_DIR = path.join(PORTAL_ROOT, 'data', 'lessons');
const ARTIFACTS_DIR = path.join(PORTAL_ROOT, 'public', 'artifacts');

// Default shared notebook
const DEFAULT_NOTEBOOK_ID = 'a11024ca-32f7-41cf-9373-043fb9710ec7';

// Parse CLI args
const args = process.argv.slice(2);
let notebookId = DEFAULT_NOTEBOOK_ID;
let skipExisting = false;
let onlySlug = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--notebook-id' && args[i + 1]) notebookId = args[++i];
  if (args[i] === '--skip-existing') skipExisting = true;
  if (args[i] === '--only' && args[i + 1]) onlySlug = args[++i];
}

// ─── NotebookLM CLI helpers ──────────────────────────────────────────────

function nlm(...cmdArgs) {
  console.log(`  🤖 notebooklm ${cmdArgs.join(' ')}`);
  const result = spawnSync(NOTEBOOKLM_SH, cmdArgs, {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 600_000, // 10 min max per command
  });
  const stdout = result.stdout?.toString() || '';
  const stderr = result.stderr?.toString() || '';
  if (result.status !== 0) {
    console.error(`  ❌ CLI error: ${stderr || stdout}`);
    return null;
  }
  return stdout;
}

function selectNotebook(id) {
  return nlm('use', id);
}

function addSource(filePath) {
  const out = nlm('source', 'add', filePath);
  if (!out) return null;
  const match = out.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : 'added';
}

function generateArtifact(type) {
  let cmd;
  switch (type) {
    case 'quiz': cmd = 'quiz'; break;
    case 'flashcards': cmd = 'flashcards'; break;
    case 'slideDeck': cmd = 'slide-deck'; break;
    default: throw new Error(`Unknown type: ${type}`);
  }
  return nlm('generate', cmd, '--wait');
}

function downloadArtifact(type, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let cmd, extraArgs;
  switch (type) {
    case 'quiz':
      cmd = 'quiz';
      extraArgs = ['--format', 'json'];
      break;
    case 'flashcards':
      cmd = 'flashcards';
      extraArgs = ['--format', 'json'];
      break;
    case 'slideDeck':
      cmd = 'slide-deck';
      extraArgs = ['--latest', '--force'];
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
  return nlm('download', cmd, ...extraArgs, outputPath);
}

// ─── Transcript parser ───────────────────────────────────────────────────

/**
 * Parse the transcript.mdc file into individual lesson blocks.
 * Each lesson block starts with a URL line (localhost or youtube).
 * Returns: [{ slug, title, youtubeUrl, localUrl, rawTranscript }]
 */
function parseTranscripts(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const lessons = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect lesson boundary: a localhost URL or YouTube URL
    const localMatch = line.match(/localhost:\d+\/schools\/\w+\/lessons\/([\w-]+)/);
    const ytMatch = line.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);

    if (localMatch) {
      // Save previous if any
      if (current) lessons.push(current);
      const slug = localMatch[1];
      current = { slug, title: '', youtubeUrl: '', localUrl: line, lines: [] };
    } else if (ytMatch && !current) {
      // YouTube URL before any localhost URL — start a new block
      // Look ahead for a title line
      const titleLine = lines[i + 1]?.trim() || '';
      const localLine = lines[i + 2]?.trim() || '';
      const slugMatch = localLine.match(/localhost:\d+\/schools\/\w+\/lessons\/([\w-]+)/);
      
      if (slugMatch) {
        if (current) lessons.push(current);
        current = {
          slug: slugMatch[1],
          title: titleLine,
          youtubeUrl: line,
          localUrl: localLine,
          lines: [],
        };
        i += 2; // Skip title + local URL lines
      }
    } else if (current) {
      // Accumulate transcript content
      if (line && !line.match(/^\d{2}:\d{2}$/)) {
        // Skip bare timestamp lines (00:29, 01:03, etc.)
        current.lines.push(lines[i]); // preserve original whitespace
      }
    }
  }
  if (current) lessons.push(current);

  // Extract title from slug if not set
  for (const lesson of lessons) {
    if (!lesson.title) {
      // slug like "blueprint-ai-HQ643s" → "Blueprint Ai"
      const parts = lesson.slug.split('-');
      // Remove last part if it looks like an ID (mixed case/digits)
      if (parts.length > 1 && /[A-Z]/.test(parts[parts.length - 1])) parts.pop();
      lesson.title = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    lesson.rawTranscript = lesson.lines.join('\n').trim();
  }

  return lessons;
}

/**
 * Clean a raw transcript into a readable markdown document.
 */
function cleanTranscript(lesson) {
  let text = lesson.rawTranscript;
  
  // Remove leading whitespace from each line
  text = text.split('\n').map(l => l.trim()).filter(l => l).join('\n\n');
  
  // Replace multiple newlines with double
  text = text.replace(/\n{3,}/g, '\n\n');

  return `# ${lesson.title}

## Lecture Transcript

${text}
`;
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  NotebookLM Artifact Generator — All Lessons');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Notebook: ${notebookId}`);
  console.log(`  Transcript file: ${TRANSCRIPT_FILE}`);
  console.log('');

  // 1. Parse transcripts
  console.log('📝 Parsing transcript file...');
  const lessons = parseTranscripts(TRANSCRIPT_FILE);
  console.log(`   Found ${lessons.length} lessons:\n`);
  for (const l of lessons) {
    console.log(`   • ${l.slug} — "${l.title}" (${l.rawTranscript.length} chars)`);
  }
  console.log('');

  // Filter if --only
  const toProcess = onlySlug
    ? lessons.filter(l => l.slug === onlySlug)
    : lessons;

  if (toProcess.length === 0) {
    console.log('❌ No lessons to process.');
    return;
  }

  // 2. Select notebook
  console.log(`📓 Selecting notebook ${notebookId}...`);
  selectNotebook(notebookId);
  console.log('');

  // 3. Process each lesson
  const ARTIFACT_TYPES = ['quiz', 'flashcards', 'slideDeck'];

  for (let i = 0; i < toProcess.length; i++) {
    const lesson = toProcess[i];
    const num = `[${i + 1}/${toProcess.length}]`;

    console.log('───────────────────────────────────────────────────────');
    console.log(`${num} 🎓 ${lesson.title} (${lesson.slug})`);
    console.log('───────────────────────────────────────────────────────');

    // 3a. Save transcript
    const dataDir = path.join(DATA_DIR, lesson.slug);
    const transcriptPath = path.join(dataDir, 'transcript.md');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const cleanedTranscript = cleanTranscript(lesson);
    fs.writeFileSync(transcriptPath, cleanedTranscript, 'utf-8');
    console.log(`   💾 Saved transcript (${cleanedTranscript.length} chars) → ${transcriptPath}`);

    // 3b. Check for existing artifacts
    const artifactsDir = path.join(ARTIFACTS_DIR, lesson.slug);
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

    if (skipExisting) {
      const hasQuiz = fs.existsSync(path.join(artifactsDir, 'quiz.json'));
      const hasFlash = fs.existsSync(path.join(artifactsDir, 'flashcards.json'));
      const hasSlides = fs.existsSync(path.join(artifactsDir, 'slides.pdf'));
      if (hasQuiz && hasFlash && hasSlides) {
        console.log(`   ⏭️  All artifacts exist, skipping.`);
        continue;
      }
    }

    // 3c. Add transcript as source to notebook
    console.log(`   📎 Adding transcript as source...`);
    selectNotebook(notebookId);
    const sourceId = addSource(transcriptPath);
    if (!sourceId) {
      console.error(`   ❌ Failed to add source, skipping lesson.`);
      continue;
    }
    console.log(`   ✅ Source added: ${sourceId}`);

    // 3d. Generate + download each artifact type
    for (const type of ARTIFACT_TYPES) {
      const ext = type === 'slideDeck' ? 'pdf' : 'json';
      const filename = type === 'slideDeck' ? 'slides' : type;
      const outputPath = path.join(artifactsDir, `${filename}.${ext}`);

      if (skipExisting && fs.existsSync(outputPath)) {
        console.log(`   ⏭️  ${type} already exists, skipping.`);
        continue;
      }

      console.log(`   🔄 Generating ${type}...`);
      const genResult = generateArtifact(type);
      if (!genResult) {
        console.error(`   ❌ Failed to generate ${type}`);
        continue;
      }
      console.log(`   ✅ ${type} generated`);

      console.log(`   📥 Downloading ${type} → ${outputPath}`);
      const dlResult = downloadArtifact(type, outputPath);
      if (!dlResult) {
        console.error(`   ❌ Failed to download ${type}`);
        continue;
      }
      console.log(`   ✅ ${type} saved`);
    }

    // Also update the context.md with real content
    const contextPath = path.join(dataDir, 'context.md');
    const contextContent = `# ${lesson.title}

## Description

${lesson.title} — a classroom lesson covering AI and machine learning fundamentals, taught at Bronx HS of Medical Science.

## Lesson Plan

This lesson covers: ${lesson.title}. Students explore machine learning concepts through interactive discussion, quizzes, and hands-on projects.

## Transcript / Video Context

${lesson.rawTranscript.substring(0, 2000)}${lesson.rawTranscript.length > 2000 ? '\n\n[Full transcript available in transcript.md]' : ''}
`;
    fs.writeFileSync(contextPath, contextContent, 'utf-8');
    console.log(`   💾 Updated context.md with real content`);

    console.log(`   ✅ ${num} DONE — ${lesson.title}\n`);

    // Delay between lessons to avoid rate limiting
    if (i < toProcess.length - 1) {
      console.log('   ⏳ Waiting 5s before next lesson...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ ALL LESSONS PROCESSED');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
