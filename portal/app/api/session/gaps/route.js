import { getGapsForSession } from '../../../lib/understanding-gaps.js';

export async function GET(request) {
  const sessionId = request.cookies?.get('lms_session_id')?.value ?? request.nextUrl?.searchParams?.get('sessionId') ?? null;
  const gaps = sessionId ? getGapsForSession(sessionId) : [];
  return Response.json({ gaps });
}
