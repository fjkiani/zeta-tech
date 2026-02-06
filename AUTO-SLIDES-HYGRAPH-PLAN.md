# Auto-Generate Slides from Video Transcript + Save to Hygraph

**Desired state**:
1. Generate slides automatically based on video transcript
2. Auto-save generated artifacts (quiz, flashcards, slides) into Hygraph
3. "Skip to quiz" (already exists in UI—link to #quiz when quiz is ready)

---

## 1. Immediate Fixes (Done)

- **500 on generate**: `notebooklm download quiz` and `flashcards` don't support `--latest` / `--force`. Fixed in `portal/app/lib/notebooklm.js`—only slide-deck gets those flags.
- **404 favicon**: Added `public/icon.svg` and redirect from `/favicon.ico`.

---

## 2. Auto-Generate Slides from Video Transcript

**Current flow**: Source = lesson plan markdown (e.g. `week0.5-lesson-plan.md`).

**Target flow**: Source = video transcript (or transcript + markdown). Slides generated automatically when lesson has a video.

### Prerequisites

| Step | What | Notes |
|------|------|-------|
| 1 | Get transcript for each lesson video | YouTube Data API v3: captions.list, captions.download. Or: store transcript in Hygraph when uploading (Zoom/GDrive flow). |
| 2 | Store transcript | Hygraph MediaItem: add `transcript` field (Rich Text or String). Or separate Transcript model linked to MediaItem. |
| 3 | NotebookLM source | Currently: local file path. Need: pass text/URL. `notebooklm source add` can take URL—if we expose transcript as URL (e.g. API route that returns transcript text) or a temp file. |
| 4 | Trigger | Option A: On lesson publish/view. Option B: Background job (cron, queue). Option C: "Auto-generate" button that runs without user waiting. |

### Implementation Sketch

1. **Transcript fetch**: API route `GET /api/lessons/[id]/transcript`:
   - Read `videoUrl` from Hygraph (YouTube ID)
   - Call YouTube captions API (requires OAuth or API key with captions scope)
   - Return plain text transcript
   - Cache in Hygraph or sidecar

2. **NotebookLM source from transcript**:
   - Write transcript to temp file, or
   - Use `notebooklm source add` with a URL that serves the transcript (if supported)
   - `notebooklm-py` source add: check if it accepts stdin or URL

3. **Auto-generate on lesson load**:
   - When lesson page loads and has video but no slides: trigger generation in background
   - Or: "Generate all" button for teacher that runs for each lesson

---

## 3. Save Artifacts to Hygraph

**Current**: Artifacts saved to `portal/public/artifacts/[lessonId]/` (quiz.json, flashcards.json, slides.pdf). Sidecar stores status.

**Target**: Push artifact content into Hygraph so it's the single source of truth.

### Hygraph Schema Additions

| Model | Purpose |
|-------|---------|
| `LessonArtifact` | Links to MediaItem; stores type (quiz/flashcards/slideDeck), status, asset (file upload or URL) |
| Or extend `MediaItem` | Add `quizContent` (JSON), `flashcardsContent` (JSON), `slideDeckUrl` (asset) |

### Flow

1. After NotebookLM generates:
   - Download to temp/local
   - For quiz/flashcards: parse JSON
   - For slides: upload PDF to Hygraph Assets (or keep in public and store URL)
2. Call Hygraph mutation: create/update LessonArtifact or update MediaItem
3. Portal reads from Hygraph instead of sidecar + public files

### Hygraph API

- `createAsset` for PDF upload
- `updateMediaItem` or create `LessonArtifact` with reference to MediaItem
- Requires `HYGRAPH_TOKEN` with write permissions

---

## 4. Skip to Quiz

- **Already implemented**: `<a href="#quiz">Skip to quiz</a>` in GenerationActions.
- If quiz section isn't present (no artifacts yet), the anchor does nothing. Ensure `id="quiz"` exists on the quiz section wrapper (already done).

---

## 5. Recommended Order

1. **Done**: Fix 500 on generate, favicon 404
2. **Next**: Verify generate works end-to-end (quiz, flashcards, slides)
3. **Then**: Add transcript field to Hygraph + fetch from YouTube; use as NotebookLM source when available
4. **Then**: Hygraph schema for artifacts; save after generation
5. **Later**: Auto-trigger generation (e.g. on first lesson view when transcript exists)
