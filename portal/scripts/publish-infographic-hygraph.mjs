#!/usr/bin/env node
/**
 * Publish local NotebookLM Studio infographic.png to Hygraph NotebookBundle.
 * Thin wrapper around caspro tools/publishNotebookToBlog.mjs (expects that clone).
 *
 * Usage:
 *   node portal/scripts/publish-infographic-hygraph.mjs \
 *     --artifacts portal/public/artifacts/python-datatypes-90150c \
 *     --slug nlm-python-datatypes-e2e
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZETA = path.resolve(__dirname, '../..');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

const artifacts = path.resolve(arg('artifacts') || path.join(ZETA, 'portal/public/artifacts/python-datatypes-90150c'));
const slug = arg('slug') || 'nlm-python-datatypes-e2e';
const title = arg('title') || 'NotebookLM: Python Data Types (E2E)';
const png = path.join(artifacts, 'infographic.png');

if (!fs.existsSync(png)) {
  console.error(`Missing ${png} — generate with portal/scripts/generate-infographic.js first`);
  process.exit(2);
}
const st = fs.statSync(png);
if (st.size < 25 * 1024) {
  console.error(`Refusing tiny PNG (${st.size} bytes) — need real NotebookLM Studio output`);
  process.exit(3);
}

const casproCandidates = [
  process.env.CASPRO_ROOT,
  path.resolve(ZETA, '../caspro'),
  '/agent/repos/caspro',
].filter(Boolean);
const caspro = casproCandidates.find((p) => fs.existsSync(path.join(p, 'tools/publishNotebookToBlog.mjs')));
if (!caspro) {
  console.error('caspro tools/publishNotebookToBlog.mjs not found');
  process.exit(4);
}

const pub = path.join(caspro, 'tools/publishNotebookToBlog.mjs');
console.log(`PNG ${st.size} bytes → ${pub}`);
const r = spawnSync(
  process.execPath,
  [pub, '--artifacts', artifacts, '--slug', slug, '--title', title, '--publish'],
  { cwd: caspro, stdio: 'inherit', env: process.env },
);
process.exit(r.status ?? 1);
