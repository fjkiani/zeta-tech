# Bridge console visual proof

Durable screenshots for greenlight item **#5** (browser/visual proof). Captured 2026-11-27 against a live `node server.js` on `:4317` (`LIVE=0`, no social posts).

| File | What it shows |
|------|----------------|
| `bridge-console-screenshot.png` | Full console: lessons, draft, dry-run log, **per-platform results[]** panel, Scheduled, Approvals (Approve dry-run / Reject), 2-week calendar, audit trail |
| `bridge-console-calendar.png` | Calendar panel crop (deterministic ranking, glassbox-ai top) |
| `bridge-console-approvals.png` | Approvals panel crop (pending queue + dry-run approve actions) |

Also copied to `/opt/cursor/artifacts/` and the Project store `media/` for walkthrough linking.

**Not a browser E2E suite** — smoke remains curl + typed `results[]` asserts; these PNGs are the durable visual receipt prior agents claimed but did not commit.
