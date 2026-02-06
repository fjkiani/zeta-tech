import { fetchLessons } from '../../lib/hygraph';

export async function GET() {
  const lessons = await fetchLessons();
  return Response.json(lessons);
}
