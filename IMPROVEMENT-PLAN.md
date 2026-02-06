# Improvement Plan: UI/UX Gaps, Agentic LLM by School, and Understanding Tracking

**Goal**: Improve the delivered LMS by (1) fixing 10 UI/UX gaps, (2) making the LLM layer agentic and separated by school type, and (3) adding tracking and guiding logic to analyze student understanding gaps—with scaffolding in place for all three.

---

## Part 1: 10 UI/UX Gaps

| # | Gap | Current State | Improvement |
|---|-----|---------------|-------------|
| **1** | **No school/course context** | All lessons look the same; no indication of which school or program (Bronx Medical, Aviation, Bushwick, Brooklyn Law). | Add school/course selector or derive from URL/layout; show school branding and course name on lesson list and detail. |
| **2** | **No progress or completion state** | Users cannot see which lessons they’ve started, completed, or which artifacts they’ve used. | Add progress indicators (e.g. “Started”, “Quiz taken”, “Slides downloaded”), progress bar or checklist on lesson list and detail. |
| **3** | **Quiz has no feedback or score** | After submit, only correct/incorrect styling; no score, no explanation, no link back to content. | Show score (e.g. 3/5), optional explanation per question, and “Review in lesson” links or timestamps. |
| **4** | **Quiz answers not persisted or analyzed** | Answers exist only in component state; no server-side record for gaps analysis. | Persist quiz submissions via tracking API; use for understanding-gaps analysis and future “weak areas” views. |
| **5** | **Generation is opaque and blocking** | “Generating…” with full-page reload on success; no progress steps, no retry, no queue. | Add step-wise progress (creating notebook → adding source → generating → downloading), retry on failure, optional background queue. |
| **6** | **Flashcards lack “know / don’t know”** | Only flip and next/prev; no self-assessment or spaced-repetition signal. | Add “Know” / “Still learning” (or 1–5) and persist; feed into tracking for gap detection and future SRS. |
| **7** | **No accessibility or keyboard flow** | Buttons and cards not clearly focusable; no skip links, no ARIA. | Add focus management, aria-labels, skip links, and keyboard nav for quiz and flashcards. |
| **8** | **Slides are download-only** | No inline preview; users must leave the page to view PDF. | Add “View in new tab” and optional inline PDF viewer (e.g. iframe or PDF.js) for quicker access. |
| **9** | **Lesson list is flat and dense** | No grouping by course/week/school; no filters or search. | Group by course/school and optionally by week; add filters (e.g. by school) and simple search. |
| **10** | **No guidance or remediation** | Wrong quiz answers don’t lead to suggested review or next steps. | Use understanding-gaps analysis to show “Topics to review” and links back to lesson sections or related lessons. |

---

## Part 2: Agentic LLM (Not a Monolith) — Separated by School Type

**Current**: One NotebookLM flow; single default source path (e.g. Bronx week0.5); no notion of school or program.

**Target**: LLM/content generation is **routed by school type**. Each school has its own “agent” config: source paths, optional prompts, and later different models or providers.

### Architecture (scaffolding)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Frontend: lesson page, generate buttons                                       │
│   (pass schoolKey: e.g. bronx_medical | aviation | bushwick | brooklyn_law)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/lessons/[id]/generate?school=bronx_medical                          │
│   → LLM Router (getConfigForSchool(schoolKey))                                │
│   → NotebookLM orchestrator with school-specific source path & notebook title │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
            │ Bronx Medical │   │ Aviation      │   │ Bushwick      │  ...
            │ sources +     │   │ sources +     │   │ sources +     │
            │ config        │   │ config        │   │ config        │
            └───────────────┘   └───────────────┘   └───────────────┘
```

- **School registry** (`app/lib/schools.js`): List of school keys, labels, and config (default source path, optional prompt prefix).
- **LLM router** (`app/lib/llm-router.js`): `getConfigForSchool(schoolKey)`, `getSourcePathForLesson(lessonId, schoolKey)` (can map lesson → file per school).
- **Generate route**: Accepts `school` (or reads from lesson/course in Hygraph later); uses router to get source path and optional settings; calls existing NotebookLM orchestrator with that source.
- **Sidecar**: Optionally store `schoolKey` per lesson mapping so generated artifacts are tied to school.

Scaffolding delivered: `schools.js`, `llm-router.js`, generate route and notebooklm wired to school context.

---

## Part 3: Tracking and Guiding — Analyze Gaps in Student Understanding

**Goal**: Record student actions (quiz submit, flashcard self-rate, lesson view, artifact use), then analyze to infer **understanding gaps** and surface simple guiding (e.g. “Review these topics”).

### Event model (scaffolding)

- **Event types**: `lesson_view`, `quiz_submit`, `flashcard_rate`, `artifact_download`, `artifact_view`.
- **Payload**: `{ eventType, lessonId, schoolKey?, payload: { ... } }`.
  - `quiz_submit`: `{ questionIndex, selectedIndex, correct, score, total }` (and optionally per-question).
  - `flashcard_rate`: `{ cardIndex, rating }` (e.g. know / still_learning).
  - `lesson_view`: `{ durationSeconds? }`.
- **Identity**: Anonymous for now: `sessionId` (cookie or generated client-side) or `userId` when auth exists.

### Storage (scaffolding)

- **Store**: JSON file or DB later; schema `data/student-events.json` as array of events (or one file per session).
- **API**: `POST /api/track` — body `{ eventType, lessonId, schoolKey?, payload }`; appends to store.
- **Lib**: `app/lib/tracking.js` — `recordEvent(event)`, `getEventsForLesson(lessonId)`, `getEventsForSession(sessionId)`.

### Understanding-gaps (scaffolding)

- **Input**: Events for a session or user (e.g. quiz_submit with wrong answers, flashcard_rate “still_learning”).
- **Output**: List of “gaps”: e.g. `{ lessonId, conceptLabel?, questionIndex?, suggestedAction: 'review_section' | 'retake_quiz' }`.
- **Lib**: `app/lib/understanding-gaps.js` — `computeGapsFromEvents(events)` returning minimal structure (e.g. wrong quiz questions → gap per question or per lesson).
- **API**: `GET /api/lessons/[id]/gaps` or `GET /api/me/gaps` — returns suggested gaps for that lesson or user (from stored events).

Scaffolding delivered: event schema, `tracking.js`, `POST /api/track`, `understanding-gaps.js`, `GET /api/lessons/[id]/gaps` (and optionally `GET /api/me/gaps`).

---

## Part 4: Implementation Checklist (Scaffolding)

- [ ] **Schools**: `portal/app/lib/schools.js` — registry of school keys and config (default source path per school).
- [x] **LLM router**: `portal/app/lib/llm-router.js` — get config and source path by school (and optionally by lesson).
- [ ] **Generate API**: Read `school` from query or body; use router; pass school-specific source to NotebookLM.
- [x] **Sidecar**: Optionally add `schoolKey` to lesson mapping schema.
- [ ] **Tracking store**: `portal/data/student-events.json` + schema doc.
- [x] **Tracking lib**: `portal/app/lib/tracking.js` — recordEvent, getEventsForLesson, getEventsForSession.
- [ ] **Track API**: `portal/app/api/track/route.js` — POST to record event.
- [x] **Understanding-gaps lib**: `portal/app/lib/understanding-gaps.js` — computeGapsFromEvents.
- [ ] **Gaps API**: `portal/app/api/lessons/[id]/gaps/route.js` or `api/me/gaps` — return gaps for lesson/session.
- [x] **Frontend**: QuizSection — on submit, POST to `/api/track` (quiz_submit) with score and per-question correct/incorrect; optional “Topics to review” from gaps API.
- [ ] **Frontend**: FlashcardSection — optional “Know / Still learning” buttons that call `/api/track` (flashcard_rate).
- [x] **Frontend**: Lesson page — send `lesson_view` on mount; pass `schoolKey` to generate (from URL or selector).

Once this scaffolding is in place, the 10 UI/UX improvements can be implemented incrementally (progress, quiz score/feedback, accessibility, etc.) without blocking on the agentic or tracking backends.
