import path from 'path';
import { getLessonMapping, setLessonMapping, updateArtifact } from '../../../../lib/sidecar';

// NotebookLM generation can take 2-5+ minutes
export const maxDuration = 600;
import {
  createNotebook,
  addSource,
  generateArtifact,
  downloadArtifact,
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
    // Prevents "calling it over and over"
    if (mapping?.artifacts?.[artifactType]?.status === 'completed' && mapping?.artifacts?.[artifactType]?.url) {
      console.log(`[Generate] Cache Hit for ${artifactType}: ${mapping.artifacts[artifactType].url}`);
      return Response.json({ status: 'completed', artifactUrl: mapping.artifacts[artifactType].url });
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

    await generateArtifact(notebookId, artifactType);

    const lessonDir = path.join(ARTIFACT_DIR, id);
    let filename;
    if (artifactType === 'slideDeck') filename = 'slides.pdf';
    else if (artifactType === 'quiz') filename = 'quiz.json';
    else if (artifactType === 'flashcards') filename = 'flashcards.json';
    else if (artifactType === 'audio') filename = 'audio.mp3';
    else if (artifactType === 'mindMap') filename = 'mindMap.json';
    else if (artifactType === 'dataTable') filename = 'data.csv';

    const outputPath = path.join(lessonDir, filename);
    await downloadArtifact(notebookId, artifactType, outputPath);

    const artifactUrl = `/artifacts/${id}/${filename}`;
    updateArtifact(id, artifactType, { status: 'completed', localPath: outputPath, url: artifactUrl });

    return Response.json({ status: 'completed', artifactUrl });
  } catch (err) {
    console.error('Generate error:', err);
    return Response.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
