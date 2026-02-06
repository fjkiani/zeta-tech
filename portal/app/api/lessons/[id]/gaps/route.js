import { getGapsForLesson } from '../../../../lib/understanding-gaps.js';

/**
 * GET /api/lessons/[id]/gaps — returns suggested understanding gaps for this lesson
 * (from stored quiz submits and flashcard ratings). Scaffolding for guiding logic.
 */
export async function GET(request, { params }) {
  const id = params.id;
  if (!id) {
    return Response.json({ error: 'Missing lesson id' }, { status: 400 });
  }

  const gaps = getGapsForLesson(id);
  return Response.json({ lessonId: id, gaps });
}
