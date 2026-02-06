# Handoff: High School LMS

**For**: Next agent or developer building on this codebase.  
**Purpose**: Single entry point to understand the project, run it, and extend it.

---

## 1. What This Is

- **Portal**: Next.js app at `portal/` — the LMS (lessons, quiz, flashcards, progress). Uses Clerk for auth.
- **Sandbox**: Code-editing environment at `sandbox-app/` — forked from [ishaan1013/sandbox](https://github.com/ishaan1013/sandbox). Shares Clerk with portal; linked from nav.
- **Content engine**: Google NotebookLM via `notebooklm-py` (Python CLI). The portal spawns it to generate quizzes, flashcards, and slide decks.
- **CMS**: Hygraph. Lessons come from Hygraph; artifact metadata in local sidecar.

**Auth**: Clerk. Students sign up → onboarding (role, school) → lessons. Same Clerk keys in portal and sandbox for unified auth. See **SANDBOX-SETUP.md**.

---

## 2. Sources of Truth (Docs to Keep)

| Doc | Purpose |
|-----|---------|
| **HANDOFF.md** (this file) | Entry point for any agent; run instructions, layout, next steps |
| **doctorines/zeta.mdc** | Mission doctrine: school profiles (VIPER/Bushwick, ORACLE/Brooklyn Law, CADUCEUS/Bronx Medical, MAVERICK/Aviation), tactics, tone. Read for content/curriculum work. |
| **UNIFIED-LMS-PLAN.md** | Architecture: portal + Hygraph + notebooklm-py; progressive delivery |
| **DELIVERABLES-10-PLAN.md** | First 10 deliverables (D1–D10): sidecar, Hygraph client, NotebookLM orchestrator, API routes, lesson page, quiz, flashcards |
| **DELIVERABLES-NEXT-10-PLAN.md** | Next 10 (D11–D20): school UI, progress, quiz score, generation UX, slides preview, filters, a11y, session gaps, dashboard |
| **IMPROVEMENT-PLAN.md** | 10 UI/UX gaps, agentic LLM by school, tracking & understanding-gaps (scaffolding done) |
| **AUTO-SLIDES-HYGRAPH-PLAN.md** | Next features: auto-generate from video transcript, save artifacts to Hygraph |
| **SANDBOX-INTEGRATION-PLAN.md** | Fork & integrate sandbox as code-editing environment |
| **SANDBOX-SETUP.md** | Clerk unified auth, onboarding, running portal + sandbox |
| **HYGRAPH-MCP-AUDIT.md** | Hygraph MCP setup, schema, capabilities — use when writing to Hygraph |
| **AI-COURSE-GENERATOR-AUDIT.md** | Reference only: external project patterns (VideoPlayer, KnowledgeGraph, stepper) — not integrated yet |

All other plan/audit docs that referred to Open Notebook, GDrive→Portal, Zoom→Portal, or one-off setup have been removed to avoid confusion.

---

## 3. Repo Layout

```
High-School/
├── HANDOFF.md                 ← you are here
├── doctorines/zeta.mdc        ← Mission doctrine (school profiles, tactics, tone)
├── UNIFIED-LMS-PLAN.md
├── DELIVERABLES-10-PLAN.md
├── DELIVERABLES-NEXT-10-PLAN.md
├── IMPROVEMENT-PLAN.md
├── AUTO-SLIDES-HYGRAPH-PLAN.md
├── HYGRAPH-MCP-AUDIT.md
├── AI-COURSE-GENERATOR-AUDIT.md
├── SANDBOX-INTEGRATION-PLAN.md
├── SANDBOX-SETUP.md
│
├── portal/                    ← Main LMS app (Next.js 14, Clerk)
│   ├── app/
│   │   ├── api/               ← lessons, generate, track, session/progress, session/gaps
│   │   ├── components/        ← QuizSection, FlashcardSection, SchoolSelector, ProgressChecklist, etc.
│   │   ├── lessons/           ← List page + [slug] detail (video, generate, quiz, flashcards, slides)
│   │   ├── progress/          ← Dashboard (My Progress)
│   │   ├── onboarding/        ← Student onboarding (role, school)
│   │   ├── sign-in/, sign-up/
│   │   └── layout.jsx, page.jsx
│   ├── data/                  ← lesson-notebooklm.json, student-events.json
│   ├── public/artifacts/      ← Generated quiz, flashcards, slides per lesson
│   └── app/lib/               ← hygraph, sidecar, notebooklm, schools, llm-router, tracking, progress, understanding-gaps, sessionId
│
├── sandbox-app/               ← Code editor (fork of ishaan1013/sandbox; shares Clerk; run on port 3001)
│
├── scripts/
│   ├── notebooklm-py/         ← notebooklm.sh, test-slide-deck.sh; used by portal generate API
│   └── gdrive-to-youtube/     ← Optional: upload GDrive videos to YouTube
│
├── Bronx-HS-Medical-Science/  ← Lesson plans (markdown) used as NotebookLM sources
├── Aviation-HS/
├── Bushwick-HS/
└── brooklyn-law/
```

---

## 4. How to Run

1. **Portal**
   ```bash
   cd portal
   cp .env.local.example .env.local   # set Hygraph + Clerk keys
   npm install && npm run dev
   ```
   App: **http://localhost:3000**. Home, Lessons, My Progress, Sandbox link.

2. **Sandbox** (for Sandbox nav link to work)
   ```bash
   cd sandbox-app/frontend
   npm install && npm run dev
   ```
   Runs on **http://localhost:3001**. Use same Clerk keys in `.env`. See SANDBOX-SETUP.md.

3. **NotebookLM generation** (for “Generate Quiz / Flashcards / Slides” on a lesson)
   - One-time: `cd High-School && .venv-notebooklm/bin/notebooklm login` (browser auth).
   - Portal calls `scripts/notebooklm-py/notebooklm.sh`; ensure path from `portal/` resolves to repo root (e.g. `process.cwd()` in API is `portal`, so `path.resolve(process.cwd(), '..')` = High-School).

4. **Hygraph**
   - Lessons: `mediaItems` with `type: VIDEO`, `tags_contains_some: ["high-school"]`.
   - If `.env.local` has no URL/token or Hygraph has no such items, Lessons list is empty.

---

## 5. Key APIs & Data

| API | Method | Purpose |
|-----|--------|---------|
| `/api/lessons` | GET | List lessons (from Hygraph) |
| `/api/lessons/[id]` | GET | One lesson + artifact URLs from sidecar |
| `/api/lessons/[id]/generate` | POST | Trigger NotebookLM generate (quiz/flashcards/slideDeck); body: `{ artifactType, schoolKey? }` |
| `/api/lessons/[id]/gaps` | GET | Understanding gaps for that lesson (from events) |
| `/api/track` | POST | Record event (lesson_view, quiz_submit, flashcard_rate, …) |
| `/api/session/progress` | GET | Progress for session (cookie `lms_session_id` or ?sessionId=) |
| `/api/session/gaps` | GET | Session-level gaps (topics to review) |

**Sidecar**: `portal/data/lesson-notebooklm.json` — maps `lessonId` → `{ notebookId, sourceId?, schoolKey?, artifacts: { quiz?, flashcards?, slideDeck? } }`.  
**Events**: `portal/data/student-events.json` — list of tracking events for progress and gaps.

---

## 6. What’s Built (D1–D20)

- **D1–D10**: Sidecar, Hygraph fetch by id/slug, NotebookLM orchestrator, generate API, lesson enrichment API, artifact serving, lesson detail page, generation buttons, QuizSection, FlashcardSection.
- **D11–D20**: School selector & labels, progress from events + API, progress badges & checklist, quiz score + review hint, generation steps + retry + no full reload, slides view in new tab + iframe, lesson list filter/search/grouping, accessibility (ARIA, skip to quiz, keyboard), session gaps API, /progress dashboard.

LLM is routed by school (`schools.js`, `llm-router.js`); each school has a default source path (e.g. Bronx Medical → `Bronx-HS-Medical-Science/week0.5-lesson-plan.md`).

---

## 7. What’s Next (For You / Next Agent)

- **AUTO-SLIDES-HYGRAPH-PLAN.md**: Auto-generate slides from video transcript; save artifacts (quiz, flashcards, slides) into Hygraph instead of only sidecar + public files.
- **IMPROVEMENT-PLAN.md**: Remaining UI/UX gaps (e.g. progress bar, a11y polish), and extending tracking/gaps logic.
- **HYGRAPH-MCP-AUDIT.md**: When you add schema or write content (e.g. LessonArtifact, transcript field), use this for MCP/API.

---

## 8. Removed Docs (No Longer in Repo)

Removed to keep a few clear sources of truth:

- ZETA_MANIFEST.md, DO-THIS-NOW.md, AUTONOMOUS-BUILD-PLAN.md  
- BUILD-PLAN-NOTEBOOKLM-FIRST.md, NOTEBOOKLM-INTEGRATION.md  
- OPEN-NOTEBOOK-AUDIT.md, OPEN-NOTEBOOK-LLM-INVOKE.md, OPEN-NOTEBOOK-NO-DOCKER.md  
- GOOGLE-DRIVE-TO-PORTAL-V1.md, V1-GDRIVE-TO-YOUTUBE-TO-FRONTEND.md, ZOOM-TO-PORTAL-V1-MVP.md  

Reason: Open Notebook path not used (we use notebooklm-py); GDrive/YouTube/Zoom are optional pipelines, not the core app. GDrive MCP setup can be recreated from Hygraph/NotebookLM docs if needed.

---

**Summary for an agent**: Read this file first. For curriculum/content work, read **doctorines/zeta.mdc** (school profiles: VIPER, ORACLE, CADUCEUS, MAVERICK). Use UNIFIED-LMS-PLAN for architecture, DELIVERABLES-* for what exists, AUTO-SLIDES-HYGRAPH-PLAN and IMPROVEMENT-PLAN for next work. Run portal from `portal/`; run sandbox from `sandbox-app/frontend` (port 3001) for Sandbox link. Generation requires `notebooklm login` and Hygraph for lessons.
