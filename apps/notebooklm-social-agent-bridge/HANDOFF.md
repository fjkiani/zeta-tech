# Bridge ops handoff — `notebooklm-social-agent-bridge`

**Repo:** `fjkiani/zeta-tech`  
**Path:** `apps/notebooklm-social-agent-bridge/`  
**Branch:** `cursor/notebooklm-social-bridge-0411`  
**PR:** https://github.com/fjkiani/zeta-tech/pull/1  
**Sibling agent handoff:** [`docs/PRODUCTION-HANDOFF.md`](../../docs/PRODUCTION-HANDOFF.md) (system vision) · [`fjkiani/langchain-social-agent` `docs/PRODUCTION-HANDOFF.md`](https://github.com/fjkiani/langchain-social-agent/blob/cursor/linkedin-crispro-org-0411/docs/PRODUCTION-HANDOFF.md)

This file is the **ops cheat sheet** for the bridge process only. Architecture, Hygraph, portal UI, and agentic product design live in the system handoff.

---

## 1. What this process is

A zero-dependency Node HTTP server that:

1. Lists NotebookLM lesson artifacts from local JSON (`data/lessons.json` + `data/transcripts/*`).
2. Drafts LinkedIn/TikTok-flavored captions from transcript excerpts.
3. Calls LangGraph `upload_post` on a reachable `LANGGRAPH_API_URL`.

It does **not** embed Arcade, LinkedIn tokens, or Hygraph. Auth and posting happen inside `langchain-social-agent`.

| Item | Value |
|------|-------|
| Default listen | `0.0.0.0:${PORT\|\|4317}` → `http://127.0.0.1:4317` |
| Entry | `server.js` |
| LangGraph client | `lib/langgraph.js` (raw `fetch`, no SDK) |
| UI | `public/index.html` + `public/styles.css` |
| Publish slug | `notebooklm-social-agent-bridge` (Cursor publish; secrets: `LANGGRAPH_API_URL`, `LINKEDIN_USER_ID`) |

---

## 2. Env vars (bridge process)

| Var | Default | Meaning |
|-----|---------|---------|
| `PORT` | `4317` | HTTP listen port |
| `LANGGRAPH_API_URL` / `LANGGRAPH_URL` | `http://localhost:54367` | LangGraph API base (no trailing slash) |
| `TEXT_ONLY_MODE` | on unless `"false"` | Passed as `configurable.textOnlyMode`; **auto-disabled** when `videoUrl`/`imageUrl` present |
| `POST_TO_LINKEDIN_ORGANIZATION` | `true` | Default CrisPRO company target |
| `LINKEDIN_ORGANIZATION_ID` | `107412290` | CrisPRO.org |
| `LINKEDIN_ORG_VANITY` | `crispro` | Display/metadata only |
| `LINKEDIN_ORG_NAME` | `CrisPRO.ai` | Display/metadata only |
| `LINKEDIN_USER_ID` / `ARCADE_USER_ID` | unset | Surfaced in `/api/health` config only; **posting uses the LangGraph process `.env`** |
| `BRIDGE_API_KEY` | unset | Mutating POSTs: `x-bridge-key` / `?key=` (or Clerk Bearer). GETs + dry-runs stay open |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | unset | When both set: Clerk session JWT accepted on mutating routes; console boots Clerk JS |
| `OPENROUTER_API_KEY` / `LLM_API_KEY` | unset | Optional GTM LLM for `/api/calendar/suggest?runLlm=1` |
| `OPENROUTER_MODEL` / `LLM_MODEL` / `LLM_PROVIDER` / `LLM_BASE_URL` | openrouter + free Ernie | Switch models/providers without code changes; stub path always default |
| `HYGRAPH_URL` / `NEXT_PUBLIC_HYGRAPH_URL` | unset | Content API endpoint; when set, `/api/lessons?source=auto\|hygraph` reads published VIDEO `MediaItem`s live |
| `HYGRAPH_TOKEN` / `NEXT_PUBLIC_HYGRAPH_TOKEN` | unset | Only needed for non-public reads; public PUBLISHED stage needs none |

**Do not put Arcade/LinkedIn tokens in the bridge env.** Put them in `langchain-social-agent/.env`.

---

## 3. API surface (current)

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/health` | Bridge OK + LangGraph `/assistants/search` probe + config snapshot + `auth` mode + `hygraph` status + `auditRows` |
| `GET` | `/api/lessons?source=auto\|static\|hygraph` | `static` = `data/lessons.json`; `hygraph` = live Content API (503 `HYGRAPH_UNAVAILABLE` when unconfigured); `auto` = hygraph when configured, static fallback |
| `GET` | `/api/lessons/:id` | Lesson + optional `transcript` / `context` file contents |
| `GET` | `/api/approvals` | HITL queue (`data/approvals.json`) |
| `GET` | `/api/calendar?source=` | Deterministic 2-week ranked post calendar (GTM Strategist v0; no LLM) |
| `GET` | `/api/calendar/suggest?source=` | GTM stub (default `llm:"not called"`). Add `runLlm=1` for optional OpenRouter/openai-compatible captions |
| `GET` | `/api/auth/config` | Public Clerk publishable bootstrap (`enabled`, `publishableKey`) |
| `GET` | `/api/audit?limit=50` | Read-only tail of `data/audit.log` for the console audit viewer |
| `POST` | `/api/draft` | `{ lessonId, platform? }` → `{ post, chars, rid }` |
| `POST` | `/api/upload` | Drafts if needed, then `upload_post` (or `dryRun`, or `requireApproval` parking). Auth-gated except dry-run. Fail-closed media HEAD check; `platforms` allowlist passthrough; per-platform `results` array in response |
| `POST` | `/api/approvals/:id/approve` | **Dry-run receipt only — does NOT live-publish.** Phase-1 default. Live publish requires BOTH `LIVE=1` env AND the post's `publishOnApprove:true` (both default off). Reject path: `POST .../reject`. Auth-gated |
| `POST` | `/api/approvals/:id/reject` | Mark rejected. Auth-gated |
| `POST` | `/api/schedule` | Park a post for a future ISO time (`scheduledFor` must be future). Auth-gated. **Scheduler never auto-posts** — due items flip to `status:"due"` and release via Approvals |
| `GET` | `/api/schedule` | Scheduled items (`autoPost:false` documented in response) |
| `POST` | `/api/schedule/:id/cancel` | Cancel a scheduled/due item. Auth-gated |
| `GET` | `/api/media-check?url=` | HEAD/ranged check of a video/image URL (`ok`, `contentType`); 400 on non-media |

### `POST /api/upload` body (as implemented in `server.js`)

```json
{
  "post": "optional override text",
  "lessonId": "optional",
  "platform": "linkedin|tiktok",
  "postToLinkedInOrganization": true,
  "target": "organization|personal",
  "linkedInOrganizationId": "107412290",
  "organizationId": "107412290",
  "videoUrl": "https://…/file.mp4",
  "imageUrl": "https://…/file.jpg",
  "mimeType": "video/mp4",
  "dryRun": false,
  "wait": true
}
```

Resolution order for media:

1. `body.videoUrl` / `body.video_url`
2. `lesson.videoUrl`
3. first `lesson.artifacts[]` string matching `/\.(mp4|webm|mov)(\?|$)/i`
4. else text-only (unless `imageUrl`)

`lib/langgraph.js` maps video → `{ imageUrl: videoUrl, mimeType: "video/mp4" }` for `upload_post` state.

---

## 4. Run locally (two processes)

```bash
# A — LangGraph (must share the same .env that has Arcade org auth)
cd /path/to/langchain-social-agent
# Required in .env (names only — never commit values):
#   USE_ARCADE_AUTH=true
#   ARCADE_API_KEY=…
#   LINKEDIN_USER_ID=…
#   POST_TO_LINKEDIN_ORGANIZATION=true
#   LINKEDIN_ORGANIZATION_ID=107412290
yarn langgraph:in_mem:up   # http://localhost:54367
# Prefer hostname localhost (IPv6) over 127.0.0.1 — CLI often binds ::1 only.

# B — Bridge
cd apps/notebooklm-social-agent-bridge
LANGGRAPH_API_URL=http://localhost:54367 \
POST_TO_LINKEDIN_ORGANIZATION=true \
LINKEDIN_ORGANIZATION_ID=107412290 \
node server.js
# → http://127.0.0.1:4317
```

Org OAuth (once / after scope upgrade) — run in **social-agent** repo:

```bash
yarn tsx scripts/authorize-linkedin-org.mts
# Open printed authorizationUrl; do not reuse stale Arcade URLs (flow_not_found).
```

Direct org post (bypass bridge UI):

```bash
# Text only
yarn tsx scripts/post-crispro-org.mts
VIDEO_URL='https://us-west-2.graphassets.com/…/…' yarn tsx scripts/post-crispro-org.mts
```

---

## 5. Verified live state (2026-11-26)

| Probe | Result |
|-------|--------|
| CrisPRO text | `urn:li:share:7531543177888116736` |
| CrisPRO video (`Reasoning_Biology.mp4` via Hygraph graphassets) | `urn:li:ugcPost:7531543923190833152` |
| Org | `107412290` / vanity `crispro` |
| Arcade org scopes | `w_member_social` + `w_organization_social` → `ORG_AUTH_OK` for configured `LINKEDIN_USER_ID` |
| Bridge smoke test (this branch, fresh sandbox) | `/api/health` OK with correct config snapshot; `/api/lessons` → 15 lessons; `POST /api/draft` → post + char count; `POST /api/upload` `dryRun:true` → org defaults + `videoUrl` passthrough all correct |
| graphassets CDN mp4 | `HTTP 206`, `content-type: video/mp4` on the documented URL — public and LinkedIn-usable |
| Hygraph live schema | Introspected: `pdfFile` (not `pdfDeck`), no `onePager`/`lessonDate`/`schools`; exactly 1 published VIDEO MediaItem (`glassbox-ai`) with `videoFile` = the mp4 above |

### Known quirks that affect bridge UX

| Quirk | Symptom | Mitigation |
|-------|---------|------------|
| LinkedIn asset-status poll 400 | Logs `Invalid asset id [urn:li:digitalmediaAsset:…]` for ~30 tries | Client proceeds; video still published. Do not treat poll 400 alone as failure. |
| No lesson `.mp4` in `data/lessons.json` | UI requires pasted public `videoUrl` | Use Hygraph graphassets HTTPS mp4; never YouTube / Drive / NotebookLM `googleusercontent` |
| Published Cursor app → localhost LangGraph | Live upload 503 | Point `LANGGRAPH_API_URL` at a reachable hosted LangGraph deployment |
| Dual LangGraph / dual `.env` | Auth OK in one shell, 403 in another | One process, one `.env`, restart after auth |
| fahadkiani portfolio mirror | Vercel nested `package.json` dead-end | Canonical source is **this** zeta-tech app; portfolio only links via `docs/notebooklm-social-bridge.md` |

---

## 6. Lesson data reality

`data/lessons.json` artifacts are typically `flashcards.json`, `quiz.json`, `slides.pdf`, occasional `audio.mp3`. **There is no hosted public lesson mp4 in this tree.**

To attach video today:

1. Resolve a public mp4: in social-agent, `yarn tsx scripts/resolve-hygraph-video.mts` (fallback glassbox URL documented there).
2. Paste into UI “Public video URL” or `POST /api/upload` `videoUrl`.
3. Longer-term: Hygraph `videoFile.url` → bridge lesson sync (see system `docs/PRODUCTION-HANDOFF.md` § Hygraph).

---

## 7. Production path for this app alone

| Gate | Status | Next concrete step |
|------|--------|--------------------|
| Code on PR | Open PR #1 | Merge when reviewed |
| Secrets on publish | `LANGGRAPH_API_URL`, `LINKEDIN_USER_ID` declared | Bind hosted LangGraph URL (not `localhost`) |
| Auth | Lives in social-agent | Keep Arcade org auth current; bridge only forwards org flags |
| Observability | Console + `/api/health` | Add structured request IDs + forward LangGraph `threadId`/`runId` to UI (already returned on upload) |
| AuthN on bridge | None | Add Clerk or Cursor identity before multi-user; today anyone who can hit the host can draft/upload |
| Rollback | Redeploy previous publish + unset bad `LANGGRAPH_API_URL` | Keep prior Image/slug |

---

## 8. Extension hooks (file-level)

| Change | Touch |
|--------|-------|
| New draft voice / platform | `server.js` → `draftFromLesson` |
| Extra upload fields (schedule, platforms[]) | `server.js` `/api/upload` + `lib/langgraph.js` `buildConfigurable` / input |
| Live Hygraph lessons | Replace `loadLessons()` with portal `app/lib/hygraph.js` pattern (`NEXT_PUBLIC_HYGRAPH_URL` / token) |
| Scheduling UI (delayed runs) | Shipped Phase-1: `POST/GET /api/schedule` + `#scheduleAt` / `#scheduledPanel` — parks only, never auto-posts; release via Approvals. LangGraph delayed runs still future. |
| Visual proof (#5) | `docs/proof/bridge-console-*.png` — full console + calendar + approvals crops (committed) |
| Multi-school filter | Tag lessons in JSON or query Hygraph `schools` enum (migration in `HYGRAPH-SCHEMA-MIGRATION.md`) |

---

## 9. Anti-sandbag (bridge)

- Do **not** claim “NotebookLM videos auto-post” — lesson pack has no mp4 URLs.
- Do **not** claim published Cursor slug can post without a non-localhost `LANGGRAPH_API_URL`.
- Do **not** claim TikTok/Instagram from this UI — draft string may say `tiktok`, but upload always hits `upload_post` LinkedIn/Twitter(/TikTok-on-other-branch) logic in the agent repo.
- Do **not** treat `dryRun: true` as a live post.
- Do **not** reuse Arcade authorization URLs after `flow_not_found`.
