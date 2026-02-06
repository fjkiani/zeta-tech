/**
 * Client-side only: get or create session ID and sync to cookie so server can read it.
 * Use from browser; no-op on server.
 */
export function getSessionId() {
  if (typeof window === 'undefined') return null;
  let s = sessionStorage.getItem('lms_session_id');
  if (!s) {
    s = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem('lms_session_id', s);
    setSessionCookie(s);
  }
  return s;
}

export function setSessionCookie(sessionId) {
  if (typeof document === 'undefined' || !sessionId) return;
  document.cookie = `lms_session_id=${encodeURIComponent(sessionId)}; path=/; max-age=2592000; SameSite=Lax`;
}
