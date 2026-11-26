# Production handoff — Zeta Tech × NotebookLM × Social

**Repo:** `fjkiani/zeta-tech` · branch `cursor/notebooklm-social-bridge-0411` · PR https://github.com/fjkiani/zeta-tech/pull/1  
**Companion (LangGraph / platforms / agents):** https://github.com/fjkiani/langchain-social-agent/blob/cursor/linkedin-crispro-org-0411/docs/PRODUCTION-HANDOFF.md  
**Bridge ops:** [`apps/notebooklm-social-agent-bridge/HANDOFF.md`](../apps/notebooklm-social-agent-bridge/HANDOFF.md)  
**LMS entry:** [`HANDOFF.md`](../HANDOFF.md) (portal/sandbox/NotebookLM)

Ownership split: **this doc** = portal frontend, Hygraph content model, bridge product surface, multi-school content ops, production checklist for zeta hosting. **langchain-social-agent doc** = graphs, Arcade/OAuth, `upload_post`, specialized agents, Slack monitors, LangGraph crons.

---

## 1. Current architecture (as-built)

```
┌──────────────────── zeta-tech ────────────────────┐
│ portal/ (Next.js + Clerk)                         │
│   Hygraph MediaItem → lessons, quiz, slides       │
│   NotebookLM via scripts/notebooklm-py            │
│                                                   │
│ apps/notebooklm-social-agent-bridge/              │
│   :4317  UI + /api/draft|/api/upload              │
│   data/lessons.json (static NotebookLM dumps)     │
└───────────────────────┬───────────────────────────┘
                        │ HTTP LANGGRAPH_API_URL
                        ▼
┌──────────── langchain-social-agent ───────────────┐
│ LangGraph CLI :54367  graphs in langgraph.json    │
│ upload_post → Twitter + LinkedIn (+ TikTok PR #1) │
│ Arcade LinkedIn (member + org 107412290)          │
└───────────────────────────────────────────────────┘
```

### Components & ports

| Component | Path | Port / URL | Role today |
|-----------|------|------------|------------|
| Portal LMS | `portal/` | `:3000` | Lessons, quiz, flashcards, progress; Clerk auth |
| Sandbox | `sandbox-app/frontend` | `:3001` | Code editor; same Clerk |
| Bridge | `apps/notebooklm-social-agent-bridge/` | `:4317` | Draft + upload to CrisPRO via LangGraph |
| LangGraph | sibling repo | `:54367` | `upload_post`, `generate_post`, `supervisor`, … |
| Hygraph | project `cm65g7pxd09kx07my82376f33` | Content API us-west-2 | `MediaItem` lessons; Asset CDN `graphassets.com` |
| Auth server | social-agent `src/clients/auth-server.ts` | `:3000` (social-agent) | Twitter/LinkedIn(/TikTok) OAuth helpers |

### Env that exists (names only)

**Portal** (`portal/.env.local` — see `SANDBOX-SETUP.md`): `NEXT_PUBLIC_HYGRAPH_URL`, `NEXT_PUBLIC_HYGRAPH_TOKEN`, Clerk keys.  
**Bridge:** see bridge `HANDOFF.md` (`LANGGRAPH_API_URL`, org defaults).  
**Social-agent:** `.env.full.example` — Arcade, LinkedIn org, Twitter, Slack, FireCrawl, Anthropic, optional Hygraph for video resolve.

### PRs

| Repo | PR | Branch | What shipped |
|------|----|--------|--------------|
| zeta-tech | [#1](https://github.com/fjkiani/zeta-tech/pull/1) | `cursor/notebooklm-social-bridge-0411` | Bridge app + CrisPRO defaults + `videoUrl` |
| langchain-social-agent | [#2](https://github.com/fjkiani/langchain-social-agent/pull/2) | `cursor/linkedin-crispro-org-0411` | Org Arcade + `createVideoPost` + scripts |
| langchain-social-agent | [#1](https://github.com/fjkiani/langchain-social-agent/pull/1) | `cursor/add-tiktok-0411` | Native TikTok client (not merged into #2) |
| fahadkiani (portfolio) | closed/dead-end for hosting | — | Do not re-mirror bridge under Vite site |

### What works today

- CrisPRO **text** org post: `urn:li:share:7531543177888116736`
- CrisPRO **video** org post from public Hygraph mp4: `urn:li:ugcPost:7531543923190833152`
- Bridge dry-run + live upload when LangGraph reachable and Arcade org scopes completed
- Portal lesson list/detail from Hygraph `MediaItem` (`portal/app/lib/hygraph.js`)
- NotebookLM artifact generate path (quiz/flashcards/slides) via portal APIs

### What does not work / not implemented

| Item | Reality |
|------|---------|
| Instagram | **Not implemented** anywhere in either repo (no client, no graph node, no bridge route). |
| TikTok from bridge branch | Draft flavor only. TikTok posting lives on social-agent PR #1 (`src/clients/tiktok.ts`); OAuth often pending / unaudited `SELF_ONLY`. |
| NotebookLM mp4 hosting | Bridge `data/lessons.json` has no public `.mp4`; portal artifacts are quiz/slides/audio. |
| Asset-status poll | LinkedIn `GET /assets/{urn}` returns **400 Invalid asset id** during wait; post still succeeds (see social-agent client). |
| Published bridge → local LangGraph | Cursor publish cannot reach `localhost:54367`. |
| fahadkiani Vercel hosting of bridge | Nested package / wrong framework detection — abandoned; see portfolio `docs/notebooklm-social-bridge.md`. |

---

## 2. Brittleness matrix (zeta / FE / content)

| Area | Symptom | Root cause | Fix | Pri |
|------|---------|------------|-----|-----|
| LangGraph localhost-only publish | Bridge `/api/upload` → 503 `LANGGRAPH_UNREACHABLE` | Published app points at `localhost` or unset URL | Deploy LangGraph (LangGraph Cloud / self-host); set publish secret `LANGGRAPH_API_URL` | P0 |
| Dual LangGraph / `.env` drift | Auth OK in one terminal, 403/pending in another | Two CLI processes or stale env after org OAuth | Single `yarn langgraph:in_mem:up`; restart after `authorize-linkedin-org` | P0 |
| Arcade stale auth URLs | Browser `flow_not_found` | Single-use / expired Arcade flow | Re-run `yarn tsx scripts/authorize-linkedin-org.mts`; never bookmark old URL | P0 |
| Org vs member tokens | Personal posts work; company 403 | Missing `w_organization_social` | Same authorize script; admin of CrisPRO | P0 |
| No public lesson mp4s | Video field empty; only glassbox fallback usable | YouTube/Drive/NotebookLM URLs ≠ binary mp4 | Upload mp4 to Hygraph Asset / CDN; store `videoFile`; sync into bridge lessons | P0 |
| LinkedIn asset poll 400 | Scary logs; may look failed | Legacy assets API quirk | Treat ugcPost URN as success; improve poll endpoint later (social-agent) | P1 |
| Bridge unauthenticated | Anyone with URL can post | No Clerk/identity on `:4317` | Gate with Clerk (reuse portal) or Cursor private publish + allowlist | P0 |
| Static `lessons.json` drift | Portal has newer lessons; bridge stale | Manual dump, not Hygraph live | Bridge `loadLessons` → Hygraph client | P1 |
| Hygraph `videoUrl` vs `videoFile` | Portal embeds YouTube; LinkedIn needs bytes | Sync script wrote watch URLs into `videoUrl` | Prefer `videoFile.url` for social; keep `videoUrl` for LMS player | P0 |
| School schema incomplete | `lessonDate`/`schools` migration pending | `FIELDS_SAFE` omits new fields | Finish `HYGRAPH-SCHEMA-MIGRATION.md`; update `hygraph.js` | P1 |
| HITL not in bridge | No approve step before upload | Bridge calls `upload_post` directly | Route through `generate_post` interrupt or bridge approval queue | P1 |
| Secrets in wrong place | Bridge publish lists `LINKEDIN_USER_ID` but tokens must be on agent | Confusion between processes | Document: Arcade secrets only on LangGraph host | P0 |
| Rate limits | Burst uploads fail intermittently | LinkedIn/Twitter quotas | Scheduler + backoff in agent; FE show cooldown | P2 |
| fahadkiani mirror | Broken Vercel | Nested app under Vite repo | Keep zeta as canonical; no remirror | P2 |

---

## 3. Production readiness checklist

### Frontend (portal + bridge)

- [ ] Bridge behind auth (Clerk session or private publish)
- [ ] Calendar / schedule UI (none today — only immediate upload)
- [ ] Show LangGraph `threadId` / `runId` / LinkedIn URN in UI after upload (partial: returned in JSON, weak UI)
- [ ] CrisPRO vs personal selector (exists) + school filter (missing)
- [ ] Media preview of `videoUrl` HEAD check (`content-type: video/mp4`) before upload
- [ ] Error states for Arcade pending vs LangGraph down vs LinkedIn 403

### Backend / content

- [ ] Hosted LangGraph with durable store (not only `langgraph:in_mem:up`)
- [ ] Hygraph `SocialAsset` / `videoFile` absolute CDN URLs for every lesson used socially
- [ ] Webhook Hygraph publish → enqueue draft (not built)
- [ ] Audit log table (who posted what URN) — not built on zeta side

### Auth

- [ ] Arcade org scopes current for production `LINKEDIN_USER_ID`
- [ ] TikTok Login Kit completed if TikTok PR merged (social-agent)
- [ ] Never commit `.env`; rotate if leaked in agent logs

### Observability

- [ ] Structured logs with request id (bridge is console-only)
- [ ] Slack failure channel already partial on agent (`SLACK_CHANNEL_ID`)
- [ ] LangSmith tracing on agent (`LANGCHAIN_TRACING_V2`)

### CI/CD

- [ ] zeta-tech: no automated bridge tests yet — add smoke `GET /api/health` in CI
- [ ] social-agent: format/build flaky vs main (see PR #2 notes); fix or isolate
- [ ] Do not deploy fahadkiani as bridge host

### Secrets / multi-tenant / rollback

- [ ] Cursor publish secrets: `LANGGRAPH_API_URL`, `LINKEDIN_USER_ID` (+ later Clerk)
- [ ] Multi-school: portal already filters by school; bridge has no tenant isolation
- [ ] Rollback: previous publish build + previous LangGraph image; keep LinkedIn delete runbook (manual)

---

## 4. Agentic product design (dashboard as agent runtime)

Target UX: portal `/progress` or a new `/social` cockpit is not a form — it is an **agent runtime UI** over LangGraph threads.

| Agent | Owner repo | Inputs | Outputs | Tools | Human gate |
|-------|------------|--------|---------|-------|------------|
| Supervisor | social-agent `supervisor` graph | Curated sources / lesson pack | Post plan + routed generate | `curate_data`, `generate_report`, `generate_post` | Agent Inbox accept/edit |
| GTM Strategist | **new** (see §5) | Hygraph lessons, KPIs, school calendars | Content calendar JSON | Hygraph GraphQL, draft API | Approve calendar |
| Content Curator | extend `generate_post` / `generate_report` | Lesson transcript + artifacts | Caption + media candidates | FireCrawl optional, image find | Edit/rewrite interrupt |
| Platform Poster | `upload_post` | Approved caption + media URLs | Platform URNs | LinkedIn/Twitter/(TikTok) clients | Optional final confirm |
| Compliance/Brand | **new** node | Draft + school doctrine `doctorines/zeta.mdc` | Pass/fail + rewrite hints | LLM structured check | Block on fail |
| Analytics Monitor | **new** + Slack | Post URNs, auth expiry | Alerts / advise | LinkedIn analytics API (UNKNOWN — discover after Marketing API access), Slack | Escalate |
| Scheduler | `schedule-post` + crons | `scheduleDate` | Delayed `upload_post` run | LangGraph SDK `afterSeconds` | Accept schedule in Inbox |

Bridge today short-circuits Curator → Poster. Production path should be: **GTM → Curator → HITL → Scheduler → Poster**.

---

## 5. GTM Strategist agent (zeta-owned content inputs)

**Role:** Turn NotebookLM/Hygraph classroom inventory into a multi-week social calendar for CrisPRO (and later school-specific channels).

**Prompt location pattern (proposed):**

- `portal/app/lib/agents/gtm-strategist/prompts.ts` (FE/server actions) **or**
- social-agent `src/agents/gtm-strategist/prompts.ts` (preferred if graph-hosted)

Reuse school tone from `doctorines/zeta.mdc` (VIPER/ORACLE/CADUCEUS/MAVERICK).

**KPIs (concrete starters):**

- Posts/week per platform; % with native video; CTR to portal lesson URL; follower delta on CrisPRO (manual until API).

**Propose calendars:**

1. Query Hygraph `mediaItems` (`portal/app/lib/hygraph.js` fields: `title`, `slug`, `excerpt`, `videoFile`, `pdfDeck`, `onePager`, tags/schools).
2. Score freshness (`lessonDate` after migration) + artifact richness (has mp4 > pdf > transcript-only).
3. Emit calendar rows: `{ lessonId, platform, scheduledAt, angle, videoUrl?, ctaUrl }`.
4. Handoff: each approved row → `generate_post` (URL = portal lesson or graphassets) **or** bridge `POST /api/draft` then `upload_post`.

**Unknown:** official CrisPRO GTM KPI dashboard source — mark UNKNOWN; discover via existing Hex/Notion if any (not in this repo).

---

## 6. Multi-platform pipeline (zeta-facing)

| Platform | Bridge today | Agent code path | OAuth | Media | Flags |
|----------|--------------|-----------------|-------|-------|-------|
| LinkedIn member | `target=personal` | `LinkedInClient` Arcade/basic | Arcade or `LINKEDIN_ACCESS_TOKEN` | text/image/video URL | `POST_TO_LINKEDIN_ORGANIZATION=false` |
| LinkedIn org CrisPRO | default | same + org id `107412290` | `w_organization_social` | public HTTPS mp4 | `POST_TO_LINKEDIN_ORGANIZATION=true` |
| Twitter/X | not in UI | `upload_post` always attempts Twitter first | Arcade or Twitter API | image buffer | `USE_ARCADE_AUTH`, `USE_TWITTER_API_ONLY` |
| TikTok | draft string only | PR #1 `TikTokClient` when configured | Login Kit `/auth/tiktok` | verified domain URL; `SELF_ONLY` until audit | `TIKTOK_*` env |
| Instagram | **none** | **none** | N/A | N/A | Feature flag stub only — do not ship fake |

**`upload_post` extension plan (zeta requests):**

1. Bridge body `platforms: ["linkedin","twitter","tiktok"]` → configurable allowlist.
2. Agent skips unconfigured destinations without swallowing LinkedIn success (today errors are logged + Slack, state still `{}`).
3. Return per-platform results to bridge for UI.

---

## 7. Hygraph extension

**Current model (used):** `MediaItem` with `videoUrl`, `videoFile { url fileName }`, `pdfDeck`, `onePager`, `tags`, optional `lessonPlan` — see `portal/app/lib/hygraph.js` `FIELDS_SAFE`.

**Proposed social fields** (add via Hygraph MCP / Studio; do not invent live API ids until migrated):

| Field / model | Type | Purpose |
|---------------|------|---------|
| `socialVideo` or reuse `videoFile` | Asset | Absolute CDN mp4 for LinkedIn pull |
| `socialCaptionDefault` | String | Optional seed caption |
| `socialStatus` | Enum DRAFT/APPROVED/POSTED | Content ops |
| `linkedInUrn` / `twitterId` | String | Last successful post ids |
| `SocialPost` model | Relation → MediaItem | History of posts, schedule ISO, platform |

**Webhooks:** Hygraph publish webhook → bridge or LangGraph ingest (not built). Payload should include `id`, `slug`, `videoFile.url`.

**Absolute CDN URLs:** LinkedIn `registerAndUploadMedia` does `fetch(mediaUrl)` for bytes — URL must be public HTTPS `video/mp4`. Proven example:

`https://us-west-2.graphassets.com/cm65gc2pl00vr08gs2em34vmw/cmkrjbuftdycb07lpstjklcss` (`Reasoning_Biology.mp4`).

**PDF pipeline:** NotebookLM slides already land as `slides.pdf` artifacts / Hygraph `pdfDeck`. LinkedIn document posts are **not** implemented — either upload PDF to a public URL and link in caption, or add LinkedIn document UGC later (UNKNOWN API readiness).

**Lesson → artifact → social mapping:**

```
MediaItem (Hygraph)
  ├─ videoFile.url → LinkedIn/TikTok video
  ├─ pdfDeck.url → link-in-bio / future document post
  ├─ portal sidecar quiz/flashcards → not for social body (internal LMS)
  └─ transcript (NotebookLM) → caption source (bridge draft)
```

---

## 8. Frontend content ops

**Today:** bridge UI = lesson list + textarea + target select + video URL + Draft / Dry run / Upload (`public/index.html`).

**Build next (portal patterns to reuse):**

| Feature | Reuse from | New work |
|---------|------------|----------|
| Scheduling calendar | none | FullCalendar or custom week grid; store in Hygraph `SocialPost` or LangGraph scheduled runs |
| Approvals | Agent Inbox (social-agent README) | Embed Inbox link or poll thread interrupts |
| Run status | bridge returns `threadId`/`runId` | Poll LangGraph `/threads/{id}/runs/{id}` |
| CrisPRO vs personal | exists in bridge | Persist last choice per user |
| Multi-school filter | `LessonsListWithProgress.jsx` + `schools` | Apply same `schoolKey` to social lesson picker |
| Mission console LLM | `MissionConsole.jsx` | Extend tools for social (see §10) |

---

## 9. LangGraph extension (zeta requests — implement in agent repo)

Needed graphs/nodes for the product vision (details + state schemas in social-agent handoff):

- `schedule` / fix `schedule-post` localhost `PORT` coupling
- `monitor` / `advise` crons
- multi-platform fan-out with feature flags
- Agent Inbox HITL retained for generate path
- Do **not** remove interrupts for brand safety

---

## 10. Dashboard LLM assistant

Surface: extend portal Mission Console or bridge chat panel.

| Tool | Implementation sketch | Guardrail |
|------|----------------------|-----------|
| `list_lessons` | Hygraph `fetchLessons` / bridge `/api/lessons` | Read-only |
| `draft_post` | `POST /api/draft` | No publish |
| `schedule_post` | LangGraph schedule API | Requires human accept if HITL on |
| `post_now` | `POST /api/upload` | Confirm + role check (admin) |
| `check_auth` | Proxy to social-agent authorize status script output | No token echo |
| `metrics` | UNKNOWN until analytics API | Stub with “manual LinkedIn admin” |

**Audit log:** append-only JSON or Supabase (social-agent already has Supabase for images) with `{ actor, action, threadId, urn, ts }`.

---

## 11. Monitors & advising

| Watch | How today | Prod |
|-------|-----------|------|
| Arcade auth expiry / pending | Manual `authorize-linkedin-org.mts` | Cron + Slack |
| Failed posts | Slack from `upload_post` if `SLACK_CHANNEL_ID` | Same + bridge UI |
| Engagement | Manual | Analytics Monitor agent |
| LangGraph down | Bridge `/api/health` | Uptime check on both hosts |

Alert channel: Slack (partial). Email/PagerDuty: not present.

---

## 12. 90-day build plan (week-by-week)

| Week | Milestone | Owner |
|------|-----------|-------|
| 1 | Hosted LangGraph + publish `LANGGRAPH_API_URL`; bridge auth gate | BE |
| 2 | Hygraph: ensure every social lesson has `videoFile` mp4 CDN; sync script → bridge | BE/Content |
| 3 | Bridge: per-platform result UI; HEAD-check videoUrl; audit log | FE |
| 4 | Merge TikTok PR; complete Login Kit; feature flag | Agent |
| 5 | HITL path: bridge “Request approval” → Agent Inbox / generate_post | Agent/FE |
| 6 | GTM Strategist v0 calendar from Hygraph | Agent |
| 7 | Scheduling UI + fix schedule-post API URL | FE/Agent |
| 8 | Compliance node using `doctorines/zeta.mdc` | Agent |
| 9 | Monitors cron (auth + failed runs) → Slack | Agent |
| 10 | Multi-school social filters in portal `/social` | FE |
| 11 | Instagram spike (Meta Graph API) — go/no-go | Agent |
| 12 | Load test + runbooks + anti-sandbag review | All |

---

## 13. How to run / extend (cheat sheet)

```bash
# Portal
cd portal && npm run dev                    # :3000

# LangGraph
cd ../langchain-social-agent
yarn langgraph:in_mem:up                    # :54367

# Bridge
cd apps/notebooklm-social-agent-bridge
LANGGRAPH_API_URL=http://localhost:54367 node server.js   # :4317

# Org auth + post
cd langchain-social-agent
yarn tsx scripts/authorize-linkedin-org.mts
yarn tsx scripts/post-crispro-org.mts
VIDEO_URL='https://us-west-2.graphassets.com/…' yarn tsx scripts/post-crispro-org.mts
yarn tsx scripts/resolve-hygraph-video.mts

# TikTok auth server (on add-tiktok branch)
yarn start:auth                             # /auth/tiktok
```

---

## 14. Anti-sandbag appendix

| Do not claim | Until |
|--------------|-------|
| “Full multi-platform production” | Instagram exists; TikTok OAuth live; Twitter reliably configured in same env |
| “NotebookLM videos post automatically” | Lessons expose public mp4 CDN URLs (not YouTube) |
| “YouTube URL is a LinkedIn video” | Never — LinkedIn path fetches raw bytes |
| “Published Cursor app posts live” | `LANGGRAPH_API_URL` is a public/reachable deployment |
| “Org posting always works” | `ORG_AUTH_OK` for current Arcade user after fresh authorize |
| “Asset poll 400 means failure” | ugcPost URN returned |
| “Bridge is multi-tenant safe” | Auth + school ACL shipped |
| “fahadkiani hosts the bridge” | Explicitly false — zeta-tech is canonical |

**Known temptation:** paste a YouTube watch URL into bridge `videoUrl`. LinkedIn download will fail or fetch HTML. Use graphassets mp4 only.
