import Link from 'next/link';

// P2-7 stub: Portal /social surface linking to the NotebookLM social-agent
// bridge console. Minimal on purpose — MissionConsole social tools land in a
// later pass (see zeta docs/PRODUCTION-HANDOFF.md OPEN tickets).
const BRIDGE_URL =
  process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:4317';

export const metadata = {
  title: 'Social — CrisPRO',
};

export default function SocialPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Social</h1>
      <p>
        Draft, approve (dry-run Phase-1), and schedule CrisPRO social posts from
        the NotebookLM social-agent bridge console.
      </p>
      <p>
        <a href={BRIDGE_URL} target="_blank" rel="noreferrer">
          Open bridge console ({BRIDGE_URL})
        </a>
      </p>
      <p style={{ color: '#666' }}>
        HITL approve = dry-run receipt only — does NOT live-publish. Live
        publishing requires <code>LIVE=1</code> and per-post publish-on-approve,
        both default off.
      </p>
      <p>
        <Link href="/">Back to portal</Link>
      </p>
    </main>
  );
}
