#!/usr/bin/env node
/**
 * Generate + download a NotebookLM Studio infographic PNG into an artifacts dir.
 *
 * Usage:
 *   node portal/scripts/generate-infographic.js \
 *     --notebook 90150c19-4744-4439-a4f2-37503402afaa \
 *     --out portal/public/artifacts/python-datatypes-90150c \
 *     [--title "Python Data Types"]
 *
 * Requires NOTEBOOKLM_MASTER_TOKEN_JSON (or on-disk agent-cloud master_token.json).
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  ensureAuth,
  generateArtifact,
  downloadArtifact,
  getUsageSnapshot,
  NOTEBOOKLM_ACCOUNT_EMAIL,
} from '../app/lib/notebooklm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTAL_ROOT = path.resolve(__dirname, '..');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

async function main() {
  const notebookId = arg('notebook');
  if (!notebookId) {
    console.error('Missing --notebook <uuid>');
    process.exit(1);
  }
  const outDir = path.resolve(
    arg('out') || path.join(PORTAL_ROOT, 'public', 'artifacts', 'python-datatypes-90150c'),
  );
  const title = arg('title') || 'Python Data Types & I/O';
  fs.mkdirSync(outDir, { recursive: true });
  const outputPath = path.join(outDir, 'infographic.png');

  console.log(`Auth account=${NOTEBOOKLM_ACCOUNT_EMAIL}`);
  await ensureAuth({ refresh: true });
  const usage = await getUsageSnapshot();
  console.log('usage snapshot keys:', Object.keys(usage || {}));

  console.log(`Generating infographic for notebook=${notebookId}…`);
  await generateArtifact(notebookId, 'infographic', {
    context: { lessonId: path.basename(outDir), lessonTitle: title, schoolKey: 'bushwick_law' },
    infographicOrientation: arg('orientation') || 'landscape',
    infographicDetail: arg('detail') || 'detailed',
    infographicStyle: arg('style') || 'professional',
  });

  console.log(`Downloading → ${outputPath}`);
  const downloaded = await downloadArtifact(notebookId, 'infographic', outputPath);
  console.log(JSON.stringify({ ok: true, notebookId, ...downloaded }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
