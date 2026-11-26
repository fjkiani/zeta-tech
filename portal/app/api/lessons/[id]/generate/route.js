import path from 'path';
import fs from 'fs';
import { getLessonMapping, setLessonMapping, updateArtifact } from '../../../../lib/sidecar';

// NotebookLM generation can take 2-5+ minutes (audio up to ~20m on Pro)
export const maxDuration = 600;
import {
  createNotebook,
  addSource,
  generateArtifact,
  downloadArtifact,
  ensureAuth,
  getUsageSnapshot,
  NOTEBOOKLM_ACCOUNT_EMAIL,
} from '../../../../lib/notebooklm';
import {
  getSourcePathForLesson,
  getNotebookTitleForLesson,
} from '../../../../lib/llm-router';

const ARTIFACT_DIR = path.join(process.cwd(), 'public', 'artifacts');

const TYPE_MAP = {
  quiz: 'quiz',
  flashcards: 'flashcards',
  slideDeck: 'slideDeck',
  audio: 'audio',
  mindMap: 'mindMap',
  dataTable: 'dataTable',
};

export async function POST(request, { params }) {
  const id = params.id;
  if (!id) {
    return Response.json({ error: 'Missing lesson id' }, { status: 400 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const artifactType = TYPE_MAP[body?.artifactType];
  if (!artifactType) {
    return Response.json({ error: 'Invalid artifactType' }, { status: 400 });
  }

  const schoolKey = body?.schoolKey ?? request.nextUrl?.searchParams?.get('school') ?? null;
  const videoUrl = body?.videoUrl; // Check for YouTube URL
  const customPrompt = body?.prompt || body?.instructions || null;

  try {
    let mapping = getLessonMapping(id);
    let notebookId = mapping?.notebookId;

    // Resolve Source Path
    let sourcePath = getSourcePathForLesson(id, schoolKey);
    // getSourcePathForLesson currently returns a static file or dynamic context.md. 
    // If it returns a FILE that exists, we use it. 
    // BUT we want to support YouTube URL if no manual context exists.

    // Let's refine the logic here:
    // 1. If context.md exists (Teacher Override), use it.
    // 2. If videoUrl is YouTube (and no context), use it.
    // 3. Else fallback to default.

    // CACHING: Check if artifact already exists in mapping (and file exists)
    // Prevents "calling it over and over" — but never treat tiny stubs as success.
    if (mapping?.artifacts?.[artifactType]?.status === 'completed' && mapping?.artifacts?.[artifactType]?.url) {
      const cached = mapping.artifacts[artifactType];
      const localPath = cached.localPath;
      const isHygraph = localPath === 'HYGRAPH_ASSET' || /^https?:\/\//i.test(cached.url || '');
      let stub = false;
      if (!isHygraph && localPath && fs.existsSync(localPath)) {
        const bytes = fs.statSync(localPath).size;
        // Mirror downloadArtifact audio floor (~1KB) for local cache
        if (artifactType === 'audio' && bytes < 1024) stub = true;
        if (bytes < 16) stub = true;
      } else if (!isHygraph && localPath && localPath !== 'HYGRAPH_ASSET' && !fs.existsSync(localPath)) {
        // Mapped but missing on disk — regenerate
        stub = true;
      }
      if (!stub) {
        console.log(`[Generate] Cache Hit for ${artifactType}: ${cached.url}`);
        return Response.json({ status: 'completed', artifactUrl: cached.url });
      }
      console.warn(`[Generate] Cache stub/missing for ${artifactType} — regenerating`);
    }

    // BYPASS: Check Hygraph for existing assets (e.g. manually uploaded slides)
    if (artifactType === 'slideDeck') {
      try {
        console.log(`[Generate] Checking Hygraph Bypass for ID/Slug: ${id}`);
        const { fetchLessonBySlug, fetchLessonById } = await import('../../../../lib/hygraph');

        let lesson = await fetchLessonById(id);
        if (lesson) {
          console.log(`[Generate] Found lesson by ID. PDF Deck:`, lesson.pdfDeck);
        } else {
          console.log(`[Generate] Lesson not found by ID. Trying Slug...`);
          lesson = await fetchLessonBySlug(id);
          console.log(`[Generate] Lesson by Slug result:`, lesson ? `Found (${lesson.title})` : 'Not Found');
          if (lesson) console.log(`[Generate] PDF Deck content:`, lesson.pdfDeck);
        }

        if (lesson?.pdfDeck?.url) {
          console.log(`[Generate] Bypass SUCCESS: Found existing PDF Deck: ${lesson.pdfDeck.url}`);
          // Fake delay to simulate "work"
          await new Promise(r => setTimeout(r, 1500));

          // Update mapping so the UI knows
          updateArtifact(id, artifactType, { status: 'completed', localPath: 'HYGRAPH_ASSET', url: lesson.pdfDeck.url });
          return Response.json({ status: 'completed', artifactUrl: lesson.pdfDeck.url });
        } else {
          console.log(`[Generate] Bypass SKIPPED: No pdfDeck.url found on lesson.`);
        }
      } catch (e) {
        console.error("Bypass Check Failed:", e);
      }
    }

    // Live NotebookLM path — require Gemini Pro auth (no free-tier soft gates)
    await ensureAuth({ refresh: true });
    const usage = await getUsageSnapshot();
    console.log(
      `[Generate] NotebookLM account=${NOTEBOOKLM_ACCOUNT_EMAIL} usage=`,
      usage?.error ? usage : {
        tierish: usage?.tier ?? usage?.account?.tier ?? usage?.plan,
        windows: usage?.windows ?? usage?.summaries,
        actions: Array.isArray(usage?.actions) ? usage.actions.slice(0, 8) : undefined,
      },
    );

    const { fetchLessonBySlug, fetchLessonById } = await import('../../../../lib/hygraph');

    // Determine Source Path strategy
    const dynamicContextPath = path.join(process.cwd(), 'data', 'lessons', id, 'context.md');
    const hasManualContext = await import('fs').then(fs => fs.existsSync(dynamicContextPath));

    if (hasManualContext) {
      // 1. Priority: Manual Local Override
      sourcePath = dynamicContextPath;
    } else {
      // 2. Priority: Hygraph Content (Description + Lesson Plan)
      // Fetch fresh data
      let lesson = await fetchLessonById(id);
      if (!lesson) lesson = await fetchLessonBySlug(id);

      if (lesson && (lesson.description || lesson.lessonPlan)) {
        console.log("[Generate] Synthesizing Context from Hygraph Data...");
        const fs = await import('fs');
        const contextContent = `
# Lesson: ${lesson.title}

## Description
${lesson.description || ''}

## Lesson Plan
${lesson.lessonPlan || ''}

## Transcript/Video Context
(See video source)
         `;
        // Ensure dir exists
        const dir = path.dirname(dynamicContextPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(dynamicContextPath, contextContent);
        sourcePath = dynamicContextPath;
        console.log(`[Generate] Created synthesis context at ${sourcePath}`);
      } else if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
        // 3. Priority: YouTube Video
        if (videoUrl.includes('/embed/')) {
          const videoId = videoUrl.split('/embed/')[1].split('?')[0];
          sourcePath = `https://www.youtube.com/watch?v=${videoId}`;
        } else {
          sourcePath = videoUrl;
        }
      }
    }

    const notebookTitle = getNotebookTitleForLesson(id, schoolKey);

    // RACE CONDITION CHECK:
    // Re-fetch mapping just in case another parallel request finished creating the notebook
    if (!notebookId) {
      const freshMapping = getLessonMapping(id);
      if (freshMapping?.notebookId) {
        console.log(`[Generate] Race Condition Avoided! Found notebookId created by peer: ${freshMapping.notebookId}`);
        notebookId = freshMapping.notebookId;
      }
    }

    if (!notebookId) {
      console.log(`[Generate] Creating NEW Notebook: ${notebookTitle}`);
      const { notebookId: newId } = await createNotebook(notebookTitle);
      notebookId = newId;
      const { sourceId } = await addSource(notebookId, sourcePath);
      // Persist immediately
      setLessonMapping(id, { notebookId, sourceId, schoolKey, artifacts: mapping?.artifacts || {} });
    } else {
      // Ensure schoolKey is updated if present
      if (schoolKey) {
        setLessonMapping(id, { schoolKey });
      }
    }

    // Resolve a human title when available for richer prompts
    let lessonTitle = null;
    try {
      let lessonMeta = await fetchLessonById(id);
      if (!lessonMeta) lessonMeta = await fetchLessonBySlug(id);
      lessonTitle = lessonMeta?.title || null;
    } catch {
      /* title is optional for prompts */
    }

    const genResult = await generateArtifact(notebookId, artifactType, {
      prompt: customPrompt,
      context: { lessonId: id, schoolKey, lessonTitle },
      audioFormat: body?.audioFormat,
      audioLength: body?.audioLength,
      difficulty: body?.difficulty,
      quantity: body?.quantity,
      slideFormat: body?.slideFormat,
      slideLength: body?.slideLength,
      mindMapKind: body?.mindMapKind,
    });

    const lessonDir = path.join(ARTIFACT_DIR, id);
    let filename;
    if (artifactType === 'slideDeck') filename = 'slides.pdf';
    else if (artifactType === 'quiz') filename = 'quiz.json';
    else if (artifactType === 'flashcards') filename = 'flashcards.json';
    else if (artifactType === 'audio') filename = 'audio.mp3';
    else if (artifactType === 'mindMap') filename = 'mindMap.json';
    else if (artifactType === 'dataTable') filename = 'data.csv';

    const outputPath = path.join(lessonDir, filename);
    const downloaded = await downloadArtifact(notebookId, artifactType, outputPath);

    const artifactUrl = `/artifacts/${id}/${filename}`;
    updateArtifact(id, artifactType, {
      status: 'completed',
      localPath: outputPath,
      url: artifactUrl,
      bytes: downloaded.bytes,
      prompt: genResult.prompt,
      accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL,
    });

    return Response.json({
      status: 'completed',
      artifactUrl,
      bytes: downloaded.bytes,
      accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL,
    });
  } catch (err) {
    console.error('Generate error:', err);
    const message = err.message || 'Generation failed';
    const status = /auth required|Auth not found|storage_state|NOTEBOOKLM_AUTH/i.test(message)
      ? 401
      : 500;
    return Response.json({ error: message, accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL }, { status });
  }
}
