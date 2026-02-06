import { fetchLessonById } from '../../../lib/hygraph';
import { getLessonMapping } from '../../../lib/sidecar';

export async function GET(request, { params }) {
  const id = params.id;
  if (!id) {
    return Response.json({ error: 'Missing lesson id' }, { status: 400 });
  }

  const lesson = await fetchLessonById(id);
  if (!lesson) {
    return Response.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const mapping = getLessonMapping(id);
  const artifacts = {
    quiz: mapping?.artifacts?.quiz?.status === 'completed' ? `/artifacts/${id}/quiz.json` : null,
    flashcards: mapping?.artifacts?.flashcards?.status === 'completed' ? `/artifacts/${id}/flashcards.json` : null,
    slideDeck: mapping?.artifacts?.slideDeck?.status === 'completed' ? `/artifacts/${id}/slides.pdf` : null,
  };

  return Response.json({ ...lesson, artifacts, mapping });
}
