# 10 Deliverables Plan: Backend Core → Plumbing → Frontend

**Separation of concerns** for maximum parallel output and clean architecture.

---

## Layer Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (4 deliverables)                                                    │
│   Pages, components, UX, data binding                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BACKEND PLUMBING (3 deliverables)                                            │
│   API routes, HTTP handlers, orchestration of core                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BACKEND CORE (3 deliverables)                                                │
│   Data, Hygraph, NotebookLM orchestration – no HTTP                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## BACKEND CORE

Pure logic and data. No API routes. Callable from plumbing or scripts.

---

### D1: Sidecar Store + Schema

**Scope**: Data model and I/O for notebooklm ↔ lesson mapping.

**Outputs**:
- `portal/lib/sidecar.js` – `readSidecar()`, `writeSidecar()`, `getLessonMapping(id)`, `setLessonMapping(id, data)`, `updateArtifact(id, type, artifactData)`
- `portal/data/lesson-notebooklm.json` – `{}` initial
- Schema: `{ [lessonId]: { notebookId, sourceId?, artifacts: { quiz?, flashcards?, slideDeck? }, updatedAt } }`

**Acceptance**: Import and call from Node; read/write persists.

**Depends on**: None. Can run first.

---

### D2: Hygraph Client Extensions

**Scope**: Fetch single lesson by id or slug.

**Outputs**:
- Add to `portal/app/lib/hygraph.js`: `fetchLessonById(id)`, `fetchLessonBySlug(slug)`
- GraphQL: `mediaItem(where: { id: $id })` and `mediaItem(where: { slug: $slug })`

**Acceptance**: Both return one lesson or null; fields match list shape.

**Depends on**: None. Parallel with D1.

---

### D3: NotebookLM Orchestrator

**Scope**: All notebooklm operations as callable functions. Spawns CLI, parses output, manages state.

**Outputs**:
- `portal/lib/notebooklm.js`:
  - `createNotebook(title)` → `{ notebookId }`
  - `addSource(notebookId, sourcePathOrText)` → `{ sourceId }`
  - `generateArtifact(notebookId, type)` → `{ taskId, status }` (types: quiz, flashcards, slideDeck)
  - `waitForArtifact(notebookId, taskId)` → `{ status, artifactId }`
  - `downloadArtifact(notebookId, type, outputPath)` → `outputPath`
  - Resolves paths: project root, notebooklm.sh, default source file

**Acceptance**: Each function works when called from Node (notebooklm login done).

**Depends on**: None (path resolution only). Parallel with D1, D2.

---

## BACKEND PLUMBING

API routes that call backend core and expose HTTP.

---

### D4: Generate API Route

**Scope**: Trigger artifact generation for a lesson.

**Outputs**:
- `portal/app/api/lessons/[id]/generate/route.js`
- POST body: `{ artifactType: "quiz" | "flashcards" | "slideDeck" }`
- Logic: Get/create notebook via D3, update D1; generate; wait; download to `public/artifacts/[lessonId]/`; update D1
- Response: `{ status, artifactUrl?, error? }`

**Acceptance**: `curl -X POST .../api/lessons/xxx/generate -d '{"artifactType":"quiz"}'` returns JSON; file appears in public/artifacts.

**Depends on**: D1, D3.

---

### D5: Lesson Enrichment API

**Scope**: Single lesson with notebooklm artifact metadata.

**Outputs**:
- `portal/app/api/lessons/[id]/route.js` (or `[slug]`)
- GET: Fetch from D2, merge with D1; return lesson + `artifacts: { quiz, flashcards, slideDeck }` with URLs

**Acceptance**: GET returns lesson + artifact URLs when available.

**Depends on**: D1, D2.

---

### D6: Artifact Serving

**Scope**: Serve generated files to the frontend.

**Outputs**:
- Option A: Static – files in `portal/public/artifacts/[lessonId]/quiz.json`, etc. Next.js serves automatically.
- Option B: API route `GET /api/artifacts/[lessonId]/[type]` – stream file, validate path.
- Create `portal/public/artifacts/.gitkeep`; add `artifacts/` to .gitignore for contents (optional).

**Acceptance**: Frontend can fetch `/artifacts/clmxxx/quiz.json` or via API.

**Depends on**: D4 (files written there). Minimal; can be static only.

---

## FRONTEND

Pages and components. Consume plumbing APIs.

---

### D7: Lesson Detail Page Shell

**Scope**: Page layout, data fetch, core content.

**Outputs**:
- `portal/app/lessons/[slug]/page.jsx`
- Fetch lesson (via D5 or server component + D2 + D1)
- Render: title, excerpt, description, video (iframe), takeaways
- Placeholder sections: “Quiz”, “Flashcards”, “Slides”

**Acceptance**: Visiting `/lessons/[slug]` shows lesson content.

**Depends on**: D2 (or D5). D5 preferred for artifact info.

---

### D8: Generation UX

**Scope**: Buttons and loading/status for artifact generation.

**Outputs**:
- “Generate Quiz”, “Generate Flashcards”, “Generate Slides” buttons
- On click: POST to D4, show loading, poll or redirect when done
- If artifact exists: show “Take Quiz” / “View Flashcards” / “Download Slides” instead

**Acceptance**: Click generate → loading → artifact appears or link works.

**Depends on**: D4, D7.

---

### D9: Quiz UI Component

**Scope**: Display and interact with quiz.

**Outputs**:
- `portal/app/lessons/[slug]/QuizSection.jsx` (or `components/`)
- Fetches `quiz.json` from D6
- Renders: question, options, submit, reveal correct answer
- Props: `lessonId` or `quizUrl`

**Acceptance**: Quiz renders; user can answer and see result.

**Depends on**: D6, D7 (or D8 for when to show).

---

### D10: Flashcards UI Component

**Scope**: Display and interact with flashcards.

**Outputs**:
- `portal/app/lessons/[slug]/FlashcardSection.jsx`
- Fetches `flashcards.json` from D6
- Renders: card stack, flip front/back, next/prev
- Props: `lessonId` or `flashcardsUrl`

**Acceptance**: Flashcards render; flip works.

**Depends on**: D6, D7.

---

## Dependency Graph

```
D1 ──┬──► D4 ──► D6 ──┬──► D9
     │                └──► D10
D2 ──┼──► D5 ──────────► D7 ──► D8
     │
D3 ──┘
```

**Parallel tracks**:
- Track 1: D1, D2, D3 (all independent)
- Track 2: D4, D5, D6 (after Track 1)
- Track 3: D7 (after D5), then D8 (after D4, D7)
- Track 4: D9, D10 (after D6, D7)

---

## Execution Order (Max Parallelism)

| Wave | Deliverables | Can Start |
|:-----|:-------------|:----------|
| 1 | D1, D2, D3 | Immediately |
| 2 | D4, D5, D6 | After Wave 1 |
| 3 | D7 | After D5 |
| 4 | D8 | After D4, D7 |
| 5 | D9, D10 | After D6, D7 |

**Critical path**: D1 → D4 → D8 (longest chain for generation UX).  
**Short path**: D2 → D5 → D7 (lesson view).

---

## File Summary

| Deliverable | New Files | Modified Files |
|:------------|:----------|:---------------|
| D1 | `portal/lib/sidecar.js`, `portal/data/lesson-notebooklm.json` | — |
| D2 | — | `portal/app/lib/hygraph.js` |
| D3 | `portal/lib/notebooklm.js` | — |
| D4 | `portal/app/api/lessons/[id]/generate/route.js` | — |
| D5 | `portal/app/api/lessons/[id]/route.js` | — |
| D6 | `portal/public/artifacts/.gitkeep` | `portal/.gitignore` (optional) |
| D7 | `portal/app/lessons/[slug]/page.jsx` | — |
| D8 | — | `portal/app/lessons/[slug]/page.jsx` |
| D9 | `portal/components/QuizSection.jsx` (or in page dir) | `portal/app/lessons/[slug]/page.jsx` |
| D10 | `portal/components/FlashcardSection.jsx` | `portal/app/lessons/[slug]/page.jsx` |

Also: `portal/app/lessons/page.jsx` – add `Link` to detail (small, part of D7 or separate).

---

## Deliverable Checklist (Copy for Agent)

```
[ ] D1: sidecar.js + lesson-notebooklm.json
[ ] D2: fetchLessonById, fetchLessonBySlug in hygraph.js
[ ] D3: notebooklm.js orchestrator
[ ] D4: POST /api/lessons/[id]/generate
[ ] D5: GET /api/lessons/[id]
[ ] D6: Artifact serving (public/ or API)
[ ] D7: Lesson detail page shell
[ ] D8: Generation buttons + loading
[ ] D9: QuizSection component
[ ] D10: FlashcardSection component
```
