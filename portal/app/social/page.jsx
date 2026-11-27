import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

// Portal /social — Clerk-gated entry to the NotebookLM bridge console.
// This is the Zeta portal surface, NOT the langchain-social-agent LangGraph UI.
const BRIDGE_URL =
  process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:4317';

export const metadata = {
  title: 'Social — CrisPRO',
};

export default async function SocialPage() {
  const session = await auth();
  const email =
    session.sessionClaims?.email ||
    session.sessionClaims?.primary_email_address ||
    null;

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Social</h1>
      <p>
        Draft, approve (dry-run Phase-1), and schedule CrisPRO social posts from
        the NotebookLM social-agent <strong>bridge</strong> console (zeta-tech
        :4317) — separate from the LangGraph playground UI in
        langchain-social-agent.
      </p>
      {session.userId ? (
        <p style={{ color: '#0d7a5f' }}>
          Signed in{email ? ` as ${email}` : ''} — open the bridge and use the
          same Clerk session (or BRIDGE_API_KEY) for mutating actions.
        </p>
      ) : (
        <p style={{ color: '#9a5b12' }}>
          Sign in required for this portal page. Bridge mutating APIs also
          accept a Clerk Bearer token or BRIDGE_API_KEY.
        </p>
      )}
      <p>
        <a href={BRIDGE_URL} target="_blank" rel="noreferrer">
          Open bridge console ({BRIDGE_URL})
        </a>
      </p>
      <p style={{ color: '#666' }}>
        HITL approve = dry-run receipt only — does NOT live-publish. Live
        publishing requires <code>LIVE=1</code> and per-post publish-on-approve,
        both default off. GTM captions: stub by default; optional OpenRouter via
        bridge <code>?runLlm=1</code>.
      </p>
      <p>
        <Link href="/">Back to portal</Link>
      </p>
    </main>
  );
}
