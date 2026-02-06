# Unified LMS Plan: NotebookLM + Portal

**Goal**: One application. Elegant, progressive content delivery. Gemini/NotebookLM as the content engine. No YouTube for now; no Open Notebook.

---

## Current State (3 Orphans)

| App | Purpose | Status |
|:----|:--------|:-------|
| **Portal** | Next.js + Hygraph, shows lessons (videos) | Orphan |
| **notebooklm-py** | Google NotebookLM API – slides, quiz, flashcards, audio, video, etc. | Orphan |
| **GDrive→YouTube pipeline** | Upload recordings to YouTube | Paused (skip for now) |

---

## Target: One Unified LMS

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    UNIFIED LMS (Portal)                  │
                    │  Next.js + Hygraph + notebooklm-py backend              │
                    └─────────────────────────────────────────────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
   ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
   │   Hygraph    │              │ notebooklm-py│              │   Students   │
   │   (CMS)      │              │   (Engine)   │              │   (Browser)  │
   │              │              │              │              │              │
   │ Lessons      │◄────────────►│ NotebookLM   │              │ Lesson view  │
   │ Sources      │              │ (Google)     │              │ Quiz, etc.   │
   │ Artifact refs│              │              │              │              │
   └──────────────┘              └──────────────┘              └──────────────┘
```

---

## Elegant Flow: Progressive Delivery (Not a Dump)

**Principle**: Deliver content in context, when the student needs it—not all at once.

| Stage | What Student Sees | What We Serve |
|:------|:------------------|:--------------|
| **1. Lesson start** | Video + transcript + 3–5 takeaways | Baseline from Hygraph |
| **2. After video** | “Ready for a quick check?” → Quiz | notebooklm generate quiz (or pre-generated) |
| **3. Study mode** | “Practice” → Flashcards | notebooklm generate flashcards |
| **4. Deep dive** | “Slides” / “Audio overview” / “Mind map” (optional) | On-demand or pre-generated |
| **5. Milestone** | Complete N lessons → Unlock next unit | Progress tracking |

**UX**: Expandable sections, not a wall of content. “Take Quiz” appears after video progress. “Study flashcards” in a sidebar/tab. Slides and audio as “extras” for those who want more.

---

## Integration Architecture

### 1. Backend: notebooklm-py as Service

- **Option A**: Python FastAPI/Flask app that imports notebooklm, exposes REST endpoints.
- **Option B**: Next.js API routes that spawn notebooklm CLI subprocesses.
- **Option C**: Queue-based worker (e.g. Inngest, Bull) – teacher triggers “generate for lesson X”, worker runs notebooklm, stores results.

**Auth**: notebooklm uses `~/.notebooklm/storage_state.json`. Backend runs with that stored session (service account or single shared login). For multi-tenant later, you’d need per-teacher NotebookLM notebooks or a different auth model.

### 2. Data Model (Hygraph)

Extend Lesson/MediaItem:

```
Lesson:
  - id, title, slug, excerpt
  - videoUrl (optional; skip for now)
  - sourceContent (text/PDF URL – what we send to NotebookLM)
  - notebooklmNotebookId
  - notebooklmSourceId (optional)
  - artifacts: { quizId?, flashcardsId?, slideDeckId?, audioId? }
  - takeaways[] (AI or manual)
```

Or a separate `LessonArtifacts` model linked to Lesson.

### 3. Content Flow

```
Teacher:
  1. Create lesson (title, paste transcript or upload PDF)
  2. Click “Generate with NotebookLM”
     → Backend: create notebook, add source, store notebook_id in Hygraph
  3. Optionally pre-generate: quiz, flashcards (background job)
     → Store artifact IDs; optionally download and host files

Student:
  1. Opens lesson → sees transcript + takeaways
  2. Clicks “Take Quiz” → we fetch quiz (from cache/Hygraph or generate)
  3. Clicks “Flashcards” → same
  4. Clicks “Slides” → optional download
```

### 4. Progressive UI

```
┌─────────────────────────────────────────────────────┐
│ Lesson: AI Hallucination & Limits of Prediction     │
├─────────────────────────────────────────────────────┤
│ [Video placeholder - or transcript]                  │
│                                                     │
│ Takeaways:                                          │
│ • ...                                               │
├─────────────────────────────────────────────────────┤
│ ▼ Quick Check                                       │
│   [Take Quiz]  ← appears after ~80% video/view      │
├─────────────────────────────────────────────────────┤
│ ▼ Study                                             │
│   [Flashcards] [Slides PDF] [Audio Overview]        │
│   (optional; on-demand)                             │
└─────────────────────────────────────────────────────┘
```

---

## Consolidation Plan

### Phase 1: Wire notebooklm-py to Portal (MVP)

1. **Backend**
   - Add Next.js API routes or a small Python service.
   - Endpoints: `POST /api/lessons/:id/generate-quiz`, `POST /api/lessons/:id/generate-flashcards`, etc.
   - Each calls notebooklm (CLI or Python) and returns artifact URL or JSON.

2. **Hygraph**
   - Add `notebooklmNotebookId` (and optional `sourceContent`) to Lesson/MediaItem or equivalent.
   - Add `artifacts` JSON field or linked model for quiz/flashcards/slides.

3. **Portal**
   - Lesson detail page: video/transcript + takeaways.
   - “Take Quiz” button → calls API → displays quiz (or link to download).
   - “Flashcards” button → same.

4. **Source**
   - For MVP: Teacher pastes transcript or we use existing lesson content. Later: PDF/Drive.

### Phase 2: Pre-generation & Caching

- When teacher publishes a lesson, trigger background job to generate quiz + flashcards.
- Store artifact IDs in Hygraph; optionally download and host files (Hygraph Assets, R2, etc.).
- Student gets instant load; no waiting for generation.

### Phase 3: Agentic / Smart Flow

- Use Gemini (or NotebookLM chat) to:
  - Suggest next step: “Based on your quiz score, review section X.”
  - Personalize: “Want a deeper dive on topic Y?”
  - Recommend: “Students who completed this also found the audio overview helpful.”
- Optional: Chat widget on lesson page for Q&A over the lesson content.

---

## What We’re Skipping (For Now)

- **YouTube pipeline** – focus on Gemini/NotebookLM content only.
- **Open Notebook** – using Google NotebookLM via notebooklm-py.
- **Bulk generation** – no “generate everything” at once; progressive and on-demand.

---

## Next Steps

1. Extend Hygraph schema (notebooklmNotebookId, artifacts).
2. Create backend API that invokes notebooklm-py for one lesson.
3. Add lesson detail page with “Take Quiz” and “Flashcards”.
4. Test flow: create lesson → generate → student sees quiz.
5. Add pre-generation job when lesson is published.
