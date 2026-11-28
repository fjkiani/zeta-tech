import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getSchoolConfig } from './schools.js';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const NOTEBOOKLM_SH = path.join(PROJECT_ROOT, 'scripts', 'notebooklm-py', 'notebooklm.sh');
const BOOTSTRAP_MASTER_SH = path.join(
  PROJECT_ROOT,
  'scripts',
  'notebooklm-py',
  'bootstrap-master-token.sh',
);

/** Gemini Pro account used for NotebookLM Studio generation. */
export const NOTEBOOKLM_ACCOUNT_EMAIL =
  process.env.NOTEBOOKLM_ACCOUNT_EMAIL || 'fjkiani1@gmail.com';

/**
 * Durable headless profile. Prefer agent-cloud when master-token auth is used
 * (NOTEBOOKLM_AUTH_JSON exceeds Cursor's 4096 secret limit).
 */
export const NOTEBOOKLM_PROFILE =
  process.env.NOTEBOOKLM_PROFILE ||
  (process.env.NOTEBOOKLM_MASTER_TOKEN_JSON ||
  fs.existsSync(
    path.join(os.homedir(), '.notebooklm', 'profiles', 'agent-cloud', 'master_token.json'),
  )
    ? 'agent-cloud'
    : NOTEBOOKLM_ACCOUNT_EMAIL.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '-') || 'default');

const MIN_ARTIFACT_BYTES = {
  audio: 1024,
  slideDeck: 10 * 1024,
  quiz: 64,
  flashcards: 64,
  mindMap: 32,
  dataTable: 16,
  report: 64,
  faq: 32,
  /** NotebookLM Studio infographic downloads as PNG — reject tiny stubs. */
  infographic: 8 * 1024,
};

const TYPE_TO_CLI = {
  slideDeck: 'slide-deck',
  quiz: 'quiz',
  flashcards: 'flashcards',
  audio: 'audio',
  mindMap: 'mind-map',
  dataTable: 'data-table',
  report: 'report',
  infographic: 'infographic',
};

function run(...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(NOTEBOOKLM_SH, args, {
      cwd: PROJECT_ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NOTEBOOKLM_ACCOUNT_EMAIL,
        NOTEBOOKLM_PROFILE,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(stderr || stdout || `exit ${code}`));
      else resolve({ stdout, stderr, code });
    });
  });
}

function tryParseJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function authHandoffMessage(detail) {
  return [
    `NotebookLM auth required for Gemini Pro account ${NOTEBOOKLM_ACCOUNT_EMAIL}.`,
    detail,
    'Fix options (skip NOTEBOOKLM_AUTH_JSON — Cursor secret max length 4096):',
    '1) Set Cloud Agent secret NOTEBOOKLM_MASTER_TOKEN_JSON = master_token.json contents',
    '2) Restart agent so the secret injects into process env',
    '3) Run: ./scripts/notebooklm-py/bootstrap-master-token.sh',
    `4) Or on a laptop: notebooklm login --master-token --account ${NOTEBOOKLM_ACCOUNT_EMAIL}`,
    'See /opt/cursor/artifacts/NOTEBOOKLM-AUTH-BLOCKER.md',
  ].join('\n');
}

function masterTokenPath() {
  return path.join(
    os.homedir(),
    '.notebooklm',
    'profiles',
    NOTEBOOKLM_PROFILE,
    'master_token.json',
  );
}

/**
 * Materialize NOTEBOOKLM_MASTER_TOKEN_JSON → profile master_token.json (0600),
 * then mint storage_state via auth refresh. Secret-transport only — package
 * does not read the env var directly.
 */
export async function materializeMasterToken() {
  const json = process.env.NOTEBOOKLM_MASTER_TOKEN_JSON;
  if (!json) return { materialized: false };

  return new Promise((resolve, reject) => {
    const child = spawn(BOOTSTRAP_MASTER_SH, [], {
      cwd: PROJECT_ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NOTEBOOKLM_ACCOUNT_EMAIL,
        NOTEBOOKLM_PROFILE,
        NOTEBOOKLM_MASTER_TOKEN_JSON: json,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(stderr || stdout || `bootstrap exit ${code}`));
      else resolve({ materialized: true, stdout, path: masterTokenPath() });
    });
  });
}

/**
 * Ensure NotebookLM CLI can authenticate. Prefers durable master-token
 * bootstrap; falls back to cookie refresh. Never assumes free-tier quotas.
 */
export async function ensureAuth({ refresh = true } = {}) {
  // Prefer durable master-token materialization when secret is present.
  if (process.env.NOTEBOOKLM_MASTER_TOKEN_JSON) {
    try {
      await materializeMasterToken();
      return { ok: true, accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL, via: 'master-token' };
    } catch (bootErr) {
      throw new Error(authHandoffMessage(`master-token bootstrap failed: ${bootErr.message}`));
    }
  }

  // If master_token.json already on disk for agent-cloud, refresh to mint cookies.
  if (refresh && fs.existsSync(masterTokenPath())) {
    try {
      await run('auth', 'refresh');
      await run('auth', 'check', '--test', '--json');
      return { ok: true, accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL, via: 'master-token-file' };
    } catch (err) {
      console.warn(`[NotebookLM] master_token.json refresh failed: ${err.message}`);
    }
  }

  try {
    const { stdout } = await run('auth', 'check', '--json');
    const parsed = tryParseJson(stdout);
    if (parsed?.ok === false || parsed?.error) {
      throw new Error(parsed?.message || parsed?.error || 'auth check failed');
    }
  } catch (err) {
    // Attempt refresh when storage exists but cookies are stale.
    if (refresh && !process.env.NOTEBOOKLM_AUTH_JSON) {
      try {
        await run('auth', 'refresh', '--verify', '--json');
      } catch (refreshErr) {
        throw new Error(
          authHandoffMessage(
            `auth check failed: ${err.message}; refresh failed: ${refreshErr.message}`,
          ),
        );
      }
      try {
        await run('auth', 'check', '--json');
      } catch (recheckErr) {
        throw new Error(authHandoffMessage(`after refresh: ${recheckErr.message}`));
      }
    } else {
      throw new Error(authHandoffMessage(err.message));
    }
  }

  try {
    await run('auth', 'check', '--test', '--passive', '--json');
  } catch (probeErr) {
    console.warn(`[NotebookLM] auth check --test warning: ${probeErr.message}`);
  }

  return { ok: true, accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL };
}
/**
 * Live usage / quota snapshot for logging. Pro accounts are not gated by
 * hard-coded free-tier caps in this portal — we only surface server numbers.
 */
export async function getUsageSnapshot() {
  try {
    const { stdout } = await run('usage', '--json', '--categories');
    const parsed = tryParseJson(stdout);
    return parsed || { raw: stdout };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Build a real generation prompt from lesson + school context.
 * data-table REQUIRES instructions — never call it bare.
 */
export function buildArtifactPrompt(type, context = {}) {
  const {
    lessonId = 'lesson',
    schoolKey = null,
    lessonTitle = null,
    customPrompt = null,
  } = context;

  if (customPrompt && String(customPrompt).trim()) {
    return String(customPrompt).trim();
  }

  const school = getSchoolConfig(schoolKey);
  const title = lessonTitle || `Lesson ${lessonId}`;
  const audience = school?.label
    ? `high-school students at ${school.label}`
    : 'high-school students';
  const theme = school?.description
    ? `School theme: ${school.description}`
    : '';

  switch (type) {
    case 'dataTable':
      return [
        `Create a comparison data table for "${title}" aimed at ${audience}.`,
        'Columns: Concept, Definition, Example, Common Mistake, Why It Matters.',
        'One row per key concept from the lesson sources. Prefer concrete examples over jargon.',
        theme,
      ].filter(Boolean).join(' ');

    case 'audio':
      return [
        `Make an engaging deep-dive discussion of "${title}" for ${audience}.`,
        'Two hosts: one curious student and one patient teacher. Cite lesson sources.',
        'No marketing fluff. Explain misconceptions clearly.',
        theme,
      ].filter(Boolean).join(' ');

    case 'quiz':
      return [
        `Quiz for "${title}" for ${audience}.`,
        'Focus on misconceptions and applied understanding, not trivia recall.',
        'Each question needs a clear rationale for the correct answer.',
        theme,
      ].filter(Boolean).join(' ');

    case 'flashcards':
      return [
        `Flashcards for "${title}" for ${audience}.`,
        'One card per atomic fact. Front = cue/term; back = exact definition from sources.',
        'Include operators, syntax, and memory tricks where relevant.',
        theme,
      ].filter(Boolean).join(' ');

    case 'mindMap':
      return [
        `Root = "${title}". Branch only core concepts from the lesson.`,
        `Audience: ${audience}. Keep depth ≤ 3. Prefer hierarchy over laundry lists.`,
        theme,
      ].filter(Boolean).join(' ');

    case 'slideDeck':
      return [
        `High-school lesson deck for "${title}" (${audience}).`,
        'One concept per slide, large type, worked example, and an exit ticket slide.',
        'No corporate pitch. Ground every claim in the lesson sources.',
        theme,
      ].filter(Boolean).join(' ');

    case 'report':
      return [
        `Write a clear blog-style lesson article for "${title}" aimed at ${audience}.`,
        'Use H2/H3 sections, concrete examples, and an exit-ticket takeaway.',
        'No hype. Ground claims in the notebook sources. Keep code blocks short.',
        theme,
      ].filter(Boolean).join(' ');

    case 'infographic':
      return [
        `One-page visual infographic for "${title}" aimed at ${audience}.`,
        'Lead with the core workflow and key data types; include concrete examples and common mistakes.',
        'Dense but scannable — statistics, labeled sections, no marketing fluff.',
        theme,
      ].filter(Boolean).join(' ');

    case 'faq':
      return [
        `For the lesson "${title}" (${audience}), answer with ONLY valid JSON:`,
        '{"items":[{"question":"...","answer":"..."}]}',
        'Include 6–10 FAQ items covering misconceptions from the sources. No markdown fences.',
        theme,
      ].filter(Boolean).join(' ');

    default:
      return `Generate ${type} for "${title}" for ${audience}. ${theme}`.trim();
  }
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

/**
 * @param {string} notebookId
 * @param {keyof typeof TYPE_TO_CLI} type
 * @param {object} [options]
 * @param {object} [options.context] lesson/school context for prompts
 * @param {string} [options.prompt] override prompt
 * @param {string} [options.audioFormat] deep-dive|brief|critique|debate
 * @param {string} [options.audioLength] short|default|long
 * @param {string} [options.difficulty] easy|medium|hard
 * @param {string} [options.quantity] fewer|standard|more
 * @param {string} [options.slideFormat] detailed|presenter
 * @param {string} [options.slideLength] default|short
 * @param {string} [options.mindMapKind] interactive|note-backed
 * @param {string} [options.infographicOrientation] landscape|portrait|square
 * @param {string} [options.infographicDetail] concise|standard|detailed
 * @param {string} [options.infographicStyle] auto|sketch-note|professional|…
 */
export async function generateArtifact(notebookId, type, options = {}) {
  const cmd = TYPE_TO_CLI[type];
  if (!cmd) throw new Error(`Unknown artifact type: ${type}`);

  await run('use', notebookId);

  const prompt = options.prompt || buildArtifactPrompt(type, {
    ...(options.context || {}),
    customPrompt: options.prompt,
  });

  const args = ['generate', cmd, '--wait', '--retry', '2'];

  if (type === 'mindMap') {
    args.push('--kind', options.mindMapKind || 'interactive');
    if (prompt) args.push('--instructions', prompt);
  } else {
    // Positional description — required for data-table, useful for all others.
    if (!prompt || !String(prompt).trim()) {
      throw new Error(`Missing generation prompt for artifact type: ${type}`);
    }
    args.push(prompt);
  }

  if (type === 'audio') {
    args.push('--format', options.audioFormat || 'deep-dive');
    args.push('--length', options.audioLength || 'default');
  } else if (type === 'quiz' || type === 'flashcards') {
    if (options.difficulty) args.push('--difficulty', options.difficulty);
    else args.push('--difficulty', 'medium');
    if (options.quantity) args.push('--quantity', options.quantity);
    else args.push('--quantity', type === 'flashcards' ? 'more' : 'standard');
  } else if (type === 'slideDeck') {
    args.push('--format', options.slideFormat || 'detailed');
    args.push('--length', options.slideLength || 'default');
  } else if (type === 'report') {
    args.push('--format', options.reportFormat || 'blog-post');
  } else if (type === 'infographic') {
    args.push('--orientation', options.infographicOrientation || 'landscape');
    args.push('--detail', options.infographicDetail || 'detailed');
    args.push('--style', options.infographicStyle || 'professional');
  }

  // Longer timeout for audio (CLI default 1200s) — keep wait; no free-tier gates.
  if (type === 'audio') {
    args.push('--timeout', String(options.timeout || 1200));
  } else if (type === 'infographic') {
    args.push('--timeout', String(options.timeout || 600));
  } else if (options.timeout) {
    args.push('--timeout', String(options.timeout));
  }

  console.log(`[NotebookLM] generate ${type} for account=${NOTEBOOKLM_ACCOUNT_EMAIL}`);
  await run(...args);
  return { status: 'completed', prompt };
}

export async function downloadArtifact(notebookId, type, outputPath) {
  await run('use', notebookId);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cmd = TYPE_TO_CLI[type];
  if (!cmd) throw new Error(`Unknown artifact type: ${type}`);

  const args = ['download', cmd];

  if (type === 'quiz' || type === 'flashcards' || type === 'mindMap') {
    args.push('--format', 'json');
  } else if (type === 'slideDeck') {
    // PDF + force latest
    args.push('--latest', '--force');
  } else if (type === 'infographic') {
    // PNG one-pager from Studio — force overwrite when re-publishing
    args.push('--latest', '--force');
  } else if (type === 'report') {
    // markdown report download
  }

  args.push(outputPath);

  await run(...args);

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Download reported success but file missing: ${outputPath}`);
  }

  const size = fs.statSync(outputPath).size;
  const minBytes = MIN_ARTIFACT_BYTES[type] ?? 16;
  if (size < minBytes) {
    // Reject silent stub success (e.g. 25-byte audio.mp3).
    try {
      fs.unlinkSync(outputPath);
    } catch {
      /* ignore */
    }
    throw new Error(
      `Downloaded ${type} is a stub/too small (${size} bytes < ${minBytes}). ` +
        'Treating as failure — re-run generate after confirming Pro auth + usage quota.',
    );
  }

  return { path: outputPath, bytes: size };
}

/**
 * FAQ via `notebooklm ask --json` (not a Studio generate type).
 * Writes `{ items: [{ question, answer }] }` to outputPath.
 */
export async function generateFaqJson(notebookId, outputPath, options = {}) {
  await run('use', notebookId);
  const prompt = options.prompt || buildArtifactPrompt('faq', options.context || {});
  const { stdout } = await run('ask', prompt, '--json');
  const parsed = tryParseJson(stdout);
  const answer = parsed?.answer || parsed?.text || stdout;
  let faq = null;
  if (typeof answer === 'string') {
    const cleaned = answer.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    faq = tryParseJson(cleaned);
  } else if (answer && typeof answer === 'object') {
    faq = answer;
  }
  if (!faq?.items && Array.isArray(faq)) {
    faq = { items: faq };
  }
  if (!faq?.items?.length) {
    // Soft fallback: wrap free-text as one FAQ item
    faq = {
      items: [
        {
          question: 'What should I know from this lesson?',
          answer: typeof answer === 'string' ? answer.slice(0, 2000) : JSON.stringify(answer).slice(0, 2000),
        },
      ],
    };
  }
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(faq, null, 2));
  return { path: outputPath, bytes: fs.statSync(outputPath).size, items: faq.items.length };
}

export function getDefaultSourcePath() {
  return path.join(PROJECT_ROOT, 'Bronx-HS-Medical-Science', 'week0.5-lesson-plan.md');
}

export const PROJECT_ROOT_ref = PROJECT_ROOT;
