# Next 10 Deliverables Plan (D11–D20)

Builds on the first 10 (NotebookLM integration) and the improvement-plan scaffolding. Focus: **UI/UX gaps**, **progress**, **session-based gaps**, and **accessibility**.

---

## Overview

| ID   | Deliverable | Scope |
|------|-------------|--------|
| D11  | School context in UI | Selector + school labels on list and detail |
| D12  | Progress derived from events + API | GET /api/session/progress; sessionId via cookie |
| D13  | Progress indicators | Badges on lesson list; checklist on lesson detail |
| D14  | Quiz score and feedback | Score (e.g. 3/5) + “Review in lesson” per wrong question |
| D15  | Generation step-wise UX | Steps, no full reload, retry on failure |
| D16  | Slides view in new tab + inline | Link + optional iframe for PDF |
| D17  | Lesson list grouping + filter + search | By school; filter; search title/excerpt |
| D18  | Accessibility | ARIA, skip link, keyboard nav for quiz/flashcards |
| D19  | Session gaps API | GET /api/session/gaps (sessionId from cookie/query) |
| D20  | Progress / Dashboard page | /progress: lessons with progress + “Topics to review” |

---

## D11: School Context in UI

**Goal**: User sees which school/program they’re in; can switch or filter by school.

**Outputs**:
- `portal/app/components/SchoolSelector.jsx` — client component: dropdown or tabs for school key; reads/writes `schoolKey` in URL (e.g. `?school=bronx_medical`) or localStorage for persistence.
- Lesson list page: show school selector at top; optionally pass `schoolKey` to filter (if lessons have school) or just show label per lesson.
- Lesson detail: show school label (e.g. “Bronx HS Medical Science”) near title; already receives `schoolKey` prop.
- Use `portal/app/lib/schools.js` for labels.

**Acceptance**: User can select school; lesson list and detail show school context.

---

## D12: Progress Derived from Events + API

**Goal**: Progress is derived from tracking events; an API returns progress for the current session.

**Outputs**:
- `portal/app/lib/progress.js` — `getProgressForSession(sessionId)`: from events, compute per-lesson `{ started, quizTaken, flashcardsUsed, slidesDownloaded }` (lesson_view → started; quiz_submit → quizTaken; flashcard_rate → flashcardsUsed; artifact_download or lesson_view with payload for slides → slidesDownloaded). Return `{ lessons: [ { lessonId, ... } ] }`.
- `portal/app/api/session/progress/route.js` — GET: read `sessionId` from cookie `lms_session_id` or query `?sessionId=`. Return progress from `getProgressForSession(sessionId)`.
- Frontend: ensure sessionId is written to cookie `lms_session_id` when generated (so GET can use it). Add in shared `getSessionId()` usage or a small `useSessionId` that sets cookie.

**Acceptance**: GET /api/session/progress returns progress for the session; cookie is set when user has sessionId.

---

## D13: Progress Indicators on Lesson List and Detail

**Goal**: User sees at a glance what they’ve started and completed.

**Outputs**:
- Lesson list: fetch progress (from /api/session/progress) in a client wrapper or server + client; for each lesson show small badges/pills: “Started”, “Quiz taken”, “Slides” when applicable.
- Lesson detail: small checklist or pills near top: “Lesson viewed”, “Quiz taken”, “Flashcards used”, “Slides downloaded” (from same progress API for this lesson).

**Acceptance**: List and detail show progress state per lesson.

---

## D14: Quiz Score and Feedback

**Goal**: After submit, show score and a simple review hint for wrong answers.

**Outputs**:
- In `QuizSection.jsx`: after submit, show “Score: 3/5” (or similar) above or below the questions.
- For each wrong answer (submitted + selected and incorrect), show a short line: “Review this topic in the lesson” with optional link to #quiz or scroll to question.

**Acceptance**: Score visible after submit; wrong answers get a review hint.

---

## D15: Generation Step-Wise UX + No Full Reload + Retry

**Goal**: Generation feels transparent and recoverable.

**Outputs**:
- `GenerationActions.jsx`: replace single “Generating…” with step labels: “Creating notebook” → “Adding source” → “Generating [type]” → “Downloading”. (Backend does not emit steps yet—frontend can show indeterminate steps: step 1 → 2 → 3 → 4 as time passes, or we add a simple polling status endpoint; for MVP show “Step 1/4” … “Step 4/4” with a single request and estimated steps.)
- On success: instead of `window.location.reload()`, refetch artifact status (e.g. call GET /api/lessons/[id] and set local state from response.artifacts) or trigger a callback/custom event so parent can re-fetch; update `done` state so “Take Quiz” / “View Flashcards” / “Download Slides” appear without reload.
- On failure: show error and a “Retry” button that re-calls generate for the same type.

**Acceptance**: Steps shown during generate; success updates UI without full reload; retry on failure.

---

## D16: Slides View in New Tab + Inline Option

**Goal**: Slides are easy to open without leaving the page.

**Outputs**:
- Lesson detail: for slideDeck artifact, show two actions: “View in new tab” (opens PDF URL in new tab) and “Download PDF” (existing). Optionally add an inline viewer: `<iframe src={pdfUrl} />` in a collapsible section (“Preview slides”) — many browsers support PDF in iframe.

**Acceptance**: User can open slides in new tab and optionally view inline.

---

## D17: Lesson List Grouping + Filter + Search

**Goal**: Lessons are grouped by school and filterable/searchable.

**Outputs**:
- Lessons list: group lessons by `schoolKey` (from lesson if available in Hygraph; else assign default, e.g. all to bronx_medical for now). Render sections “Bronx HS Medical Science”, “Aviation”, etc., with lessons under each.
- Add a school filter (tabs or dropdown): “All” | “Bronx Medical” | “Aviation” | …; filter the list by selected school.
- Add a simple search input: filter lessons by title and excerpt (client-side for MVP).

**Acceptance**: List grouped by school; filter by school works; search filters by text.

---

## D18: Accessibility

**Goal**: Quiz and flashcards are navigable and announced correctly.

**Outputs**:
- Quiz: add `aria-label` to option buttons (e.g. “Option 1: …”); wrap quiz in `<section aria-labelledby="quiz-heading">` with `id="quiz-heading"` on the heading; ensure Submit is focusable and has aria-label.
- Flashcards: aria-label on card (“Card 3 of 10, front” / “back”); aria-label on Prev/Next/Know/Still learning; ensure flip is keyboard-activable (Enter/Space).
- Lesson detail: add a “Skip to quiz” link (anchor to #quiz) at the top of the study materials area for keyboard users.

**Acceptance**: Screen reader and keyboard-only flow work for quiz and flashcards; skip link present.

---

## D19: Session Gaps API

**Goal**: “My gaps” can be loaded by session for the dashboard.

**Outputs**:
- `portal/app/api/session/gaps/route.js` — GET: read `sessionId` from cookie `lms_session_id` or query `?sessionId=`. Call `getGapsForSession(sessionId)` from understanding-gaps.js; return `{ gaps: [ ... ] }`.

**Acceptance**: GET /api/session/gaps returns gaps for the current session.

---

## D20: Progress / Dashboard Page

**Goal**: One place to see progress and topics to review.

**Outputs**:
- `portal/app/progress/page.jsx` — client or server+client: fetch /api/session/progress and /api/session/gaps. Show: (1) list of lessons with progress badges (started, quiz taken, etc.); (2) “Topics to review” section from gaps (lesson + suggested action). Link each lesson to /lessons/[slug].
- Add a link to “My Progress” or “Dashboard” in the main nav or lesson list header.

**Acceptance**: /progress shows progress and gaps; navigable from home/lessons.

---

## Dependency Order

- D11 (school UI) — independent.
- D12 (progress API) — independent; D13 depends on D12.
- D13 (progress indicators) — depends on D12.
- D14 (quiz score) — independent.
- D15 (generation UX) — independent.
- D16 (slides view) — independent.
- D17 (grouping/filter/search) — can use D11 school list; lessons may need default schoolKey.
- D18 (a11y) — independent.
- D19 (session gaps API) — depends on existing getGapsForSession.
- D20 (dashboard) — depends on D12, D19.

**Execution order**: D11, D12, D14, D15, D16, D18, D19 first; then D13, D17, D20.

---

## File Summary

| Deliverable | New/Modified Files | Status |
|-------------|--------------------|--------|
| D11 | `components/SchoolSelector.jsx`, lessons page, lesson detail (school label) | Done |
| D12 | `lib/progress.js`, `api/session/progress/route.js`, `lib/sessionId.js` (cookie) | Done |
| D13 | `components/LessonsListWithProgress.jsx`, `components/ProgressChecklist.jsx`, lesson detail | Done |
| D14 | `components/QuizSection.jsx` (score, review hint, ARIA) | Done |
| D15 | `lessons/[slug]/GenerationActions.jsx` (steps, router.refresh, retry) | Done |
| D16 | `lessons/[slug]/page.jsx` (slides: view in new tab, iframe preview) | Done |
| D17 | `lessons/page.jsx`, `LessonsListWithProgress` (grouping, filter, search) | Done |
| D18 | QuizSection, FlashcardSection (ARIA, skip link in GenerationActions, keyboard flip) | Done |
| D19 | `api/session/gaps/route.js` | Done |
| D20 | `progress/page.jsx`, `api/lessons/route.js`, layout nav | Done |
