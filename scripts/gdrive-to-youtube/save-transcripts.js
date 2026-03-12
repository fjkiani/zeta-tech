#!/usr/bin/env node
/**
 * save-transcripts.js — Parse transcript.mdc and save each as transcript.md + context.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TRANSCRIPT_FILE = path.join(PROJECT_ROOT, '.cursor', 'rules', 'transcript.mdc');
const DATA_DIR = path.join(PROJECT_ROOT, 'portal', 'data', 'lessons');

const content = fs.readFileSync(TRANSCRIPT_FILE, 'utf-8');
const lines = content.split('\n');

const lessons = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const localMatch = line.match(/localhost:\d+\/schools\/\w+\/lessons\/([\w-]+)/);

  if (localMatch) {
    if (current) lessons.push(current);
    current = { slug: localMatch[1], lines: [] };
  } else if (current) {
    if (line && !line.match(/^\d{2}:\d{2}$/) && !line.match(/^https?:\/\//)) {
      current.lines.push(lines[i]);
    }
  }
}
if (current) lessons.push(current);

for (const l of lessons) {
  const slug = l.slug;
  const parts = slug.split('-');
  // Remove trailing ID-like part
  if (parts.length > 1 && /[A-Z]/.test(parts[parts.length - 1])) parts.pop();
  const title = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const text = l.lines.map(x => x.trim()).filter(Boolean).join('\n\n');
  const md = `# ${title}\n\n## Lecture Transcript\n\n${text}\n`;
  
  const dir = path.join(DATA_DIR, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'transcript.md'), md, 'utf-8');
  
  const ctx = `# ${title}\n\n## Description\n\n${title} — classroom lesson at Bronx HS of Medical Science covering AI and machine learning fundamentals.\n\n## Transcript / Video Context\n\n${text.substring(0, 2000)}\n`;
  fs.writeFileSync(path.join(dir, 'context.md'), ctx, 'utf-8');
  
  console.log(`${slug}: ${md.length} chars → transcript.md + context.md`);
}
console.log(`\nDone: ${lessons.length} lessons saved.`);
