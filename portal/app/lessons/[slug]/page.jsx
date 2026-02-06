import Link from 'next/link';
import { fetchLessonBySlug } from '../../lib/hygraph';
import { getLessonMapping } from '../../lib/sidecar';
import { getLessonIntel } from '../../lib/intel';
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

  // Fetch initial context if it exists
  const contextPath = path.join(process.cwd(), 'data', 'lessons', lesson.id, 'context.md');
  let initialContext = '';
  if (fs.existsSync(contextPath)) {
    initialContext = fs.readFileSync(contextPath, 'utf8');
  }

  // Fetch transcription if it exists
  const transcriptPath = path.join(process.cwd(), 'data', 'lessons', lesson.id, 'transcription.md');
  let initialTranscript = '';
  if (fs.existsSync(transcriptPath)) {
    initialTranscript = fs.readFileSync(transcriptPath, 'utf8');
  }

  const mapping = getLessonMapping(lesson.id);
  const localSlideDeck = mapping?.artifacts?.slideDeck?.status === 'completed' ? `/artifacts/${lesson.id}/slides.pdf` : null;
  const artifacts = {
    quiz: mapping?.artifacts?.quiz?.status === 'completed' ? `/artifacts/${lesson.id}/quiz.json` : null,
    flashcards: mapping?.artifacts?.flashcards?.status === 'completed' ? `/artifacts/${lesson.id}/flashcards.json` : null,
    slideDeck: lesson.pdfDeck?.url || localSlideDeck,
    onePager: lesson.onePager?.url || null,
    audio: mapping?.artifacts?.audio?.status === 'completed' ? `/artifacts/${lesson.id}/audio.mp3` : null,
    mindMap: mapping?.artifacts?.mindMap?.status === 'completed' ? `/artifacts/${lesson.id}/mindMap.json` : null,
    dataTable: mapping?.artifacts?.dataTable?.status === 'completed' ? `/artifacts/${lesson.id}/data.csv` : null,
    briefing: mapping?.artifacts?.briefing?.status === 'completed' ? `/artifacts/${lesson.id}/briefing.md` : null,
  };

  const schoolKey = lesson.schoolKey ?? 'bronx_medical';

  // DYNAMIC INTEL EXTRACTION
  const { objectives, takeaways } = getLessonIntel(lesson.id);

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
    />
  );
}
