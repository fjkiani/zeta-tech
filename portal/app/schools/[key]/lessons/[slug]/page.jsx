import Link from 'next/link';
import { fetchLessonBySlug } from '../../../../lib/hygraph';
import { getLessonMapping } from '../../../../lib/sidecar';
import { getLessonIntel } from '../../../../lib/intel';
import LessonCockpit from './LessonCockpit';
import fs from 'fs';
import path from 'path';

export default async function LessonPage({ params }) {
  const slug = params.slug;
  console.log(`[Page] Fetching slug: ${slug}`);
  const lesson = await fetchLessonBySlug(slug);
  console.log(`[Page] Result for ${slug}:`, lesson ? 'Found' : 'NULL');

  if (lesson && !lesson.videoUrl) {
    // FALLBACK FOR DEV: Python Data Types Video
    lesson.videoUrl = "https://www.youtube.com/watch?v=khCv3It9z2o";
  }

  if (!lesson) {
    return (
      <main>
        <p>Lesson not found.</p>
        <Link href="/lessons">← Back to Lessons</Link>
      </main>
    );
  }

  // Helper: check both Hygraph-ID-based and slug-based paths
  const tryRead = (dir, filename) => {
    for (const key of [lesson.id, slug]) {
      const p = path.join(process.cwd(), dir, key, filename);
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    }
    return '';
  };
  const tryExists = (publicDir, filename) => {
    // publicDir like 'public/artifacts' → URL path '/artifacts/...'
    for (const key of [lesson.id, slug]) {
      const p = path.join(process.cwd(), publicDir, key, filename);
      if (fs.existsSync(p)) {
        const urlDir = publicDir.replace(/^public\//, '');
        return `/${urlDir}/${key}/${filename}`;
      }
    }
    return null;
  };

  // Fetch initial context if it exists (check by id then slug)
  const initialContext = tryRead('data/lessons', 'context.md');

  // Fetch transcription if it exists (check both filenames)
  let initialTranscript = tryRead('data/lessons', 'transcription.md');
  if (!initialTranscript) initialTranscript = tryRead('data/lessons', 'transcript.md');

  const mapping = getLessonMapping(lesson.id);
  const localSlideDeck = mapping?.artifacts?.slideDeck?.status === 'completed'
    ? `/artifacts/${lesson.id}/slides.pdf`
    : tryExists('public/artifacts', 'slides.pdf');
  const artifacts = {
    quiz: mapping?.artifacts?.quiz?.status === 'completed'
      ? `/artifacts/${lesson.id}/quiz.json`
      : tryExists('public/artifacts', 'quiz.json'),
    flashcards: mapping?.artifacts?.flashcards?.status === 'completed'
      ? `/artifacts/${lesson.id}/flashcards.json`
      : tryExists('public/artifacts', 'flashcards.json'),
    slideDeck: lesson.pdfDeck?.url || localSlideDeck,
    onePager: lesson.onePager?.url || null,
    audio: mapping?.artifacts?.audio?.status === 'completed'
      ? `/artifacts/${lesson.id}/audio.mp3`
      : tryExists('public/artifacts', 'audio.mp3'),
    mindMap: mapping?.artifacts?.mindMap?.status === 'completed'
      ? `/artifacts/${lesson.id}/mindMap.json`
      : tryExists('public/artifacts', 'mindMap.json'),
    dataTable: mapping?.artifacts?.dataTable?.status === 'completed'
      ? `/artifacts/${lesson.id}/data.csv`
      : tryExists('public/artifacts', 'data.csv'),
    briefing: mapping?.artifacts?.briefing?.status === 'completed'
      ? `/artifacts/${lesson.id}/briefing.md`
      : tryExists('public/artifacts', 'briefing.md'),
  };

  const schoolKey = lesson.schoolKey ?? 'bronx_medical';

  // DYNAMIC INTEL EXTRACTION
  const { objectives, takeaways } = getLessonIntel(lesson.id);

  // AUTH STATUS CHECK
  const { auth } = await import('@clerk/nextjs/server');
  const { userId } = auth();
  const isAuthenticated = !!userId;

  return (
    <LessonCockpit
      lesson={lesson}
      artifacts={artifacts}
      mapping={mapping}
      initialContext={initialContext}
      initialTranscript={initialTranscript}
      schoolKey={schoolKey}
      objectives={objectives}
      takeaways={takeaways}
      isAuthenticated={isAuthenticated}
    />
  );
}
