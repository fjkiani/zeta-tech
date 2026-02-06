import { getProgressForSession } from '../../../lib/progress.js';

export async function GET(request) {
  const sessionId = request.cookies?.get('lms_session_id')?.value ?? request.nextUrl?.searchParams?.get('sessionId') ?? null;
  const progress = getProgressForSession(sessionId);
  return Response.json(progress);
}
