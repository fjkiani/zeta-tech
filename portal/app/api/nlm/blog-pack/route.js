/**
 * POST /api/nlm/blog-pack
 * On-demand NotebookLM study pack → portal/public/artifacts/<slug>/
 *
 * Body: {
 *   slug: string,
 *   title?: string,
 *   notebookId?: string,
 *   sourcePath?: string,
 *   schoolKey?: string,
 *   types?: ('report'|'quiz'|'flashcards'|'mindMap'|'dataTable'|'slideDeck'|'audio'|'faq')[],
 * }
 *
 * Requires Runtime NOTEBOOKLM_MASTER_TOKEN_JSON (fresh agent). Skip AUTH_JSON.
 */
import path from 'path';
import fs from 'fs';
import {
  ensureAuth,
  getUsageSnapshot,
  createNotebook,
  addSource,
  generateArtifact,
  downloadArtifact,
  generateFaqJson,
  buildArtifactPrompt,
  NOTEBOOKLM_ACCOUNT_EMAIL,
  getDefaultSourcePath,
} from '../../../lib/notebooklm';

export const maxDuration = 600;

const ARTIFACT_DIR = path.join(process.cwd(), 'public', 'artifacts');

const DEFAULT_TYPES = [
  'report',
  'quiz',
  'flashcards',
  'mindMap',
  'dataTable',
  'slideDeck',
  'audio',
  'faq',
];

const FILE_NAMES = {
  report: 'report.md',
  quiz: 'quiz.json',
  flashcards: 'flashcards.json',
  mindMap: 'mindMap.json',
  dataTable: 'data.csv',
  slideDeck: 'slides.pdf',
  audio: 'audio.mp3',
  faq: 'faq.json',
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = String(body?.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) {
    return Response.json({ error: 'slug required' }, { status: 400 });
  }

  const title = body?.title || slug;
  const schoolKey = body?.schoolKey || null;
  const types = Array.isArray(body?.types) && body.types.length ? body.types : DEFAULT_TYPES;
  const outDir = path.join(ARTIFACT_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });

  const context = { lessonId: slug, schoolKey, lessonTitle: title };
  const results = {};

  try {
    await ensureAuth({ refresh: true });
    const usage = await getUsageSnapshot();

    let notebookId = body?.notebookId || null;
    if (!notebookId) {
      const created = await createNotebook(`Blog pack: ${title}`);
      notebookId = created.notebookId;
      const sourcePath = body?.sourcePath || getDefaultSourcePath();
      if (sourcePath) await addSource(notebookId, sourcePath);
    }

    for (const type of types) {
      const fileName = FILE_NAMES[type];
      if (!fileName) {
        results[type] = { ok: false, error: `unknown type ${type}` };
        continue;
      }
      const outputPath = path.join(outDir, fileName);
      try {
        if (type === 'faq') {
          const r = await generateFaqJson(notebookId, outputPath, { context });
          results[type] = { ok: true, ...r, url: `/artifacts/${slug}/${fileName}` };
          continue;
        }

        if (type === 'dataTable') {
          try {
            await generateArtifact(notebookId, type, { context });
            const r = await downloadArtifact(notebookId, type, outputPath);
            results[type] = { ok: true, ...r, url: `/artifacts/${slug}/${fileName}` };
          } catch (dtErr) {
            // Known INVALID_ARGUMENT on notebooklm-py 0.8.6 — leave a header + error note
            const header =
              'Concept,Definition,Example,Common Mistake,Why It Matters\n';
            fs.writeFileSync(
              outputPath,
              `${header}"(generate failed)","${String(dtErr.message).replace(/"/g, "'")}","","",""\n`,
            );
            results[type] = {
              ok: false,
              error: dtErr.message,
              path: outputPath,
              note: 'data-table often INVALID_ARGUMENT — fill CSV via ask fallback in E2E scripts',
              promptHint: buildArtifactPrompt('dataTable', context),
            };
          }
          continue;
        }

        await generateArtifact(notebookId, type, { context });
        const r = await downloadArtifact(notebookId, type, outputPath);
        results[type] = { ok: true, ...r, url: `/artifacts/${slug}/${fileName}` };
      } catch (err) {
        results[type] = { ok: false, error: err.message };
      }
    }

    return Response.json({
      slug,
      title,
      notebookId,
      accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL,
      usage,
      artifactsDir: outDir,
      results,
      next: {
        publish:
          'node tools/publishNotebookToBlog.mjs --artifacts <dir> --slug <slug> --title <title> --audio-url <https> --slides-upload-url <https>',
      },
    });
  } catch (err) {
    const status = /auth required|Auth not found|storage_state|NOTEBOOKLM_/i.test(err.message)
      ? 401
      : 500;
    return Response.json(
      { error: err.message, accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL },
      { status },
    );
  }
}
