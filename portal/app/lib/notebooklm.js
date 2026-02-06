import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const NOTEBOOKLM_SH = path.join(PROJECT_ROOT, 'scripts', 'notebooklm-py', 'notebooklm.sh');

function run(...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(NOTEBOOKLM_SH, args, {
      cwd: PROJECT_ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(stderr || stdout || `exit ${code}`));
      else resolve({ stdout, stderr });
    });
  });
}

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function createNotebook(title) {
  const { stdout } = await run('create', title);
  const match = stdout.match(UUID_REGEX);
  if (!match) throw new Error('Could not parse notebook ID from: ' + stdout);
  return { notebookId: match[0] };
}

export async function addSource(notebookId, sourcePathOrUrl) {
  await run('use', notebookId);
  const { stdout } = await run('source', 'add', sourcePathOrUrl);
  const match = stdout.match(UUID_REGEX);
  return { sourceId: match ? match[0] : null };
}

export async function generateArtifact(notebookId, type) {
  await run('use', notebookId);
  // Map internal type to CLI command
  let cmd;
  switch (type) {
    case 'slideDeck': cmd = 'slide-deck'; break;
    case 'quiz': cmd = 'quiz'; break;
    case 'flashcards': cmd = 'flashcards'; break;
    case 'audio': cmd = 'audio'; break;
    case 'mindMap': cmd = 'mind-map'; break;
    case 'dataTable': cmd = 'data-table'; break;
    default: throw new Error(`Unknown artifact type: ${type}`);
  }

  // Audio might need instructions, default to generic "engaging"
  const args = ['generate', cmd, '--wait'];
  if (type === 'audio') args.push('Make it an engaging deep dive discussion');

  await run(...args);
  return { status: 'completed' };
}

export async function downloadArtifact(notebookId, type, outputPath) {
  await run('use', notebookId);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let cmd;
  switch (type) {
    case 'slideDeck': cmd = 'slide-deck'; break;
    case 'quiz': cmd = 'quiz'; break;
    case 'flashcards': cmd = 'flashcards'; break;
    case 'audio': cmd = 'audio'; break;
    case 'mindMap': cmd = 'mind-map'; break;
    case 'dataTable': cmd = 'data-table'; break;
    default: throw new Error(`Unknown artifact type: ${type}`);
  }

  const args = ['download', cmd, outputPath];

  if (type === 'quiz' || type === 'flashcards' || type === 'mindMap') {
    args.splice(2, 0, '--format', 'json');
  } else if (type === 'slideDeck') {
    args.push('--latest', '--force');
  } else if (type === 'dataTable') {
    // Data table usually defaults to CSV or Markdown. Let's force CSV if supported or trust extension.
    // CLI probably infers from output path or defaults. README says "export formats... CSV (data tables)"
    // The Python CLI likely handles it.
  }

  await run(...args);
  return outputPath;
}

export function getDefaultSourcePath() {
  return path.join(PROJECT_ROOT, 'Bronx-HS-Medical-Science', 'week0.5-lesson-plan.md');
}

export const PROJECT_ROOT_ref = PROJECT_ROOT;
