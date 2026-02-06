# AI Course Generator Audit
## For High School Portal / Edulga Revamp

**Location**: `/Users/fahadkiani/Desktop/development/edulga/ai-course-generator-main`  
**Audit Date**: February 2026  
**Purpose**: Review existing framework and plan how to exploit/revamp for High School use case.

---

## 1. EXECUTIVE SUMMARY

| Component | What It Does | Reusable for High School? |
|:----------|:-------------|:--------------------------|
| **AI Course Layout** | Gemini generates course structure (chapters, graph) from topic/category/duration | ✅ Yes – adapt prompts; videos from **curated playlists** |
| **YouTube Integration** | Search API (random) for video URLs; react-youtube / react-player | ⚠️ Replace Search with **playlistItems.list** – fetch exact videos from teacher playlists |
| **Database** | Neon + Drizzle: CourseList, Chapters, KnowledgeNodes, NodeConnections | ⚠️ Replace with Hygraph |
| **Auth** | Clerk (sign-in/sign-up) | ✅ Yes |
| **UI** | Shadcn, Tailwind, stepper, dashboard, course cards | ✅ Yes – good base |
| **Knowledge Graph** | ForceGraph2D (D3) – chapters as nodes, links between them | ✅ Yes |
| **Chapter Content** | AI generates title/explanation/codeExample per chapter; stored in Chapters table | ✅ Yes – adapt for non-code |
| **Firebase** | Storage (unused in core flow?) | ❓ Optional |

---

## 2. ARCHITECTURE

**Current (ai-course-generator):**

```
User → Create Course (Stepper: Category → Topic/Desc → Options)
         │
         ▼
      Gemini AI (course structure + chapter layout)
         │
         ▼
      YouTube Search API (random video URLs per chapter) ← replace with curated
         │
         ▼
      Save to Neon DB (CourseList, Chapters)
         │
         ▼
      Dashboard → Course Start → ChapterContent (video + AI content)
```

**Target (High School):** See §5.4 for full learning environment flow (playlists, milestones, assessment).

---

## 3. KEY FILES & DATA MODELS

### 3.1 Schema (Drizzle / Neon)

```js
CourseList: id, courseId, name, category, level, includeVideo, courseOutput (JSON), createdBy, userName, userProfileImage, courseBanner, publish
Chapters: id, courseId, chapterId, content (JSON), videoId
KnowledgeNodes: id, courseId, nodeId, title, type, description, content, prerequisites, nextNodes, difficulty, estimatedTime, position
NodeConnections: id, sourceNodeId, targetNodeId, relationshipType, strength
```

### 3.2 Course Output Shape (from AI)

```json
{
  "courseName": "...",
  "description": "...",
  "chapters": [
    {
      "name": "Chapter Name",
      "about": "Description",
      "duration": "time_in_minutes",
      "videoUrl": "https://www.youtube.com/watch?v=...",
      "details": { "summary", "keyPoints", "timeStamps", "prerequisites", "practiceExercises" },
      "nodeType": "core|concept|tool",
      "relatedTopics": ["chapterName1", "chapterName2"]
    }
  ],
  "graphStructure": {
    "nodes": [...],
    "connections": [...]
  }
}
```

### 3.3 Chapter Content Shape (from AI)

```json
[
  { "title": "...", "explanation": "...", "codeExample": "<precode>...</precode>" }
]
```

---

## 4. WHAT WE CAN EXPLOIT

### 4.1 UI / UX Patterns

- **Stepper** (Category → Topic → Options) – reuse for “Create High School Course” or “Add Lesson”.
- **Dashboard** with course cards – map to “My Courses” or “School Lessons”.
- **Chapter list sidebar** + **ChapterContent** – same pattern for lessons with video + text.
- **KnowledgeGraph** – force-directed graph for “Learning Path” or topic dependencies.
- **VideoPlayer** / react-youtube – already supports YouTube URLs.

### 4.2 AI Flow

- **GenerateCourseLayout_AI** – adapt prompts for HS subjects (e.g. Biology, Medical Science, GitHub).
- **GenerateChapterContent_AI** – change from “code example” to “discussion points”, “exercises”, “debrief prompts”.
- Output format can stay similar; we swap `videoUrl` source from YouTube Search to **our Hygraph MediaItems**.

### 4.3 YouTube Handling

- Currently: YouTube Search API + AI picks URLs.
- Our flow: GDrive → YouTube upload → Hygraph MediaItem (videoUrl).
- **Reuse**: `VideoPlayer`, `ChapterContent` layout; pass `videoUrl` from Hygraph instead of Chapters table.

---

## 5. IMPROVEMENTS: CURATED VIDEOS + FULL LEARNING ENVIRONMENT

### 5.1 Curated YouTube Playlists (Not Random Search)

**Problem**: AI/YouTube Search returns random videos; quality and relevance vary.

**Solution**: Teacher creates curated playlists. We fetch **exactly** the videos in the playlist, in order.

| Source | How It Works |
|:-------|:-------------|
| **Primary lessons** | GDrive → YouTube upload → Hygraph (our recordings) |
| **Supplementary videos** | YouTube **Playlist ID** → fetch via API → map to chapters |

**YouTube Data API v3** – `playlists.list` and `playlistItems.list`:

```
GET https://www.googleapis.com/youtube/v3/playlistItems
  ?part=snippet,contentDetails
  &playlistId=PLxxxxxx
  &maxResults=50
```

Returns: `videoId`, `title`, `description`, `position` (order). Map 1:1 to chapters.

**Course creation flow**:
1. Teacher provides **playlist ID(s)** per unit (e.g. "Unit 1: Intro to GitHub" → `PLxxx`).
2. Script/API fetches playlist items.
3. Gemini generates chapter structure (titles, takeaways, milestones) and we **assign** each chapter the corresponding `videoId` by position.
4. No guessing – videos are exactly what the teacher selected.

**Hygraph / schema**: Add `playlistId` to Course/Unit, or store `supplementaryPlaylistIds[]` per unit.

---

### 5.2 Full Learning Environment for Students

Simulate a complete learning experience:

| Feature | What It Does | How to Implement |
|:--------|:-------------|:-----------------|
| **Transcription** | Full transcript for each video | YouTube captions API, or store transcript in Hygraph (from upload/manual) |
| **Takeaways** | 3–5 key points per lesson | AI-generated from transcript, or manual; store in chapter/lesson |
| **Milestones** | Checkpoints (e.g. complete Lessons 1–3) | Define milestone ranges; unlock next when complete |
| **Projects** | Hands-on assignments between units | New model: Project (title, description, rubric, due); link to unit |
| **Review videos** | Recap / supplementary at milestones | Curated playlist or specific MediaItems tagged `review` |

**Enhanced chapter/lesson shape**:

```json
{
  "name": "Lesson 1: Intro to GitHub",
  "videoId": "PEWIdbphaYw",
  "videoSource": "hygraph|playlist",
  "playlistPosition": 0,
  "transcript": "Full transcript text...",
  "takeaways": ["Key point 1", "Key point 2", "Key point 3"],
  "milestoneId": "m1",
  "projectIds": [],
  "reviewVideoIds": ["abc123"]
}
```

**Milestone model**:
```json
{
  "id": "m1",
  "title": "Unit 1 Complete",
  "lessonIds": ["lesson-1", "lesson-2", "lesson-3"],
  "reviewVideoId": "xyz789",
  "unlocksProjectId": "project-1"
}
```

---

### 5.3 Student Assessment

| Assessment Type | Purpose | Implementation |
|:----------------|:--------|:----------------|
| **Quizzes** | Check understanding per lesson/unit | MCQ from AI or NotebookLM export; store questions in Hygraph |
| **Flash cards** | Self-study | NotebookLM flash cards or AI-generated; front/back |
| **Project rubrics** | Grade hands-on work | Rubric model: criteria, points; teacher or self-assessment |
| **Progress tracking** | Completed lessons, quiz scores | Student progress model or table: `studentId`, `lessonId`, `completedAt`, `quizScore` |
| **Review checkpoints** | Must pass quiz to unlock next milestone | Gate: `milestoneUnlocked` only if quiz passed |

**Data models** (Hygraph or backend):

- **Quiz**: `id`, `lessonId`/`unitId`, `questions[]` (question, options, correctIndex)
- **QuizAttempt**: `studentId`, `quizId`, `score`, `answers`, `completedAt`
- **Progress**: `studentId`, `lessonId`, `status` (not_started|in_progress|completed), `completedAt`
- **ProjectSubmission**: `studentId`, `projectId`, `url`/`attachment`, `rubricScores`, `feedback`

**UI**:
- Quiz after each lesson or at milestone
- Progress bar / checklist on course page
- Dashboard: "My progress", "Upcoming projects", "Quiz scores"

---

### 5.4 Updated Architecture (Full Learning Environment)

```
Teacher:
  - Creates course (Stepper)
  - Adds curated playlist ID(s) per unit
  - Optional: our GDrive→YouTube recordings (primary lessons)
  - Defines milestones, projects, review videos

       │
       ▼
  Fetch playlist items (YouTube API) → exact video list
  Gemini: generate structure (titles, takeaways, milestones) + map videos by position
       │
       ▼
  Hygraph: Course, Units, Lessons, Milestones, Projects, Quizzes
       │
       ▼
Student:
  - Views lessons (video + transcript + takeaways)
  - Completes quiz per lesson/milestone
  - Submits projects
  - Sees progress, unlocks next content
  - Watches review videos at milestones
```

---

## 6. REVAMP STRATEGY

### Option A: Fork & Adapt (Heavier)

1. Copy ai-course-generator into High-School.
2. Replace Neon/Drizzle with Hygraph:
   - CourseList → Hygraph model or MediaCategory + MediaItems.
   - Chapters → Hygraph model or nested structure in MediaItem.
3. Swap Clerk for your auth (or keep Clerk).
4. Point video URLs to Hygraph `videoUrl` (our uploaded lessons).
5. Adapt AI prompts for HS content (no code examples; use discussion/exercises).

### Option B: Hybrid (Recommended)

1. **Keep our portal** (Next.js + Hygraph lessons) as the “view” layer.
2. **Reuse components** from ai-course-generator:
   - `VideoPlayer` (or we keep iframe)
   - `KnowledgeGraph` – add a “Learning Path” view for a course/unit.
   - Stepper UI – for “Add New Lesson” or “Create Course from Template”.
3. **Add AI-assisted course creation**:
   - New page: “Create Course” → Stepper → Gemini generates structure.
   - Save structure to Hygraph (new model or JSON in MediaCategory).
   - Chapters link to existing MediaItems (our YouTube lessons) or new ones.
4. **Data source**: Hygraph only. No Neon.

### Option C: Minimal Reuse

1. Use only:
   - `VideoPlayer` component.
   - KnowledgeGraph for visualizing lesson order.
   - Tailwind + shadcn styling patterns.
2. Build the rest from scratch, feeding from Hygraph.

---

## 7. MAPPING: AI COURSE GENERATOR → HIGH SCHOOL

| AI Course Generator | High School Equivalent |
|:--------------------|:------------------------|
| CourseList | Hygraph: Course/Unit model or MediaCategory |
| Chapters | Hygraph: MediaItem or Lesson (videoUrl, transcript, takeaways) |
| videoUrl | **Curated playlists** (YouTube API) + GDrive→YouTube (our recordings) |
| Chapter content (AI) | Takeaways, discussion prompts, exercises, debrief |
| Category (Programming, Health, Creative) | Aviation, Bushwick, Bronx Medical, Brooklyn Law |
| Level | Grade level or course level |
| Knowledge graph | Unit/lesson + milestone dependencies |
| Random YouTube Search | **Replace** with playlist ID → fetch exact videos |
| — | **Add**: Transcripts, milestones, projects, review videos, quizzes, progress |

---

## 8. RECOMMENDED NEXT STEPS

1. **Video source** – Add playlist ID input to course creation; fetch via YouTube `playlistItems.list`.
2. **Schema** – Extend Hygraph: Lesson (transcript, takeaways), Milestone, Project, Quiz, Progress.
3. **Transcription** – YouTube captions API or store manual transcripts per lesson.
4. **Milestones & projects** – Define model; gate progress (complete lesson → unlock quiz → unlock next).
5. **Assessment** – Quiz + flash card models; progress tracking (Hygraph or backend).
6. **Port components** – VideoPlayer, KnowledgeGraph, stepper; add quiz UI, progress bar.

---

## 9. DEPENDENCIES TO CARRY OVER

```json
"@google/generative-ai"   // Gemini
"react-youtube" / "react-player"
"react-force-graph"       // KnowledgeGraph
"d3"
"@radix-ui/*"             // shadcn
"tailwindcss"
```

Skip for High School (use Hygraph instead):

- `@neondatabase/serverless`
- `drizzle-orm`
- `drizzle-kit`

---

## 10. SUMMARY

The ai-course-generator gives you a solid foundation: AI-generated course structure, YouTube embedding, knowledge graph, and a clean UI. For High School:

- **Replace random YouTube Search** with **curated playlists** – teacher provides playlist IDs; we fetch exactly those videos via YouTube API.
- **Replace database** with Hygraph; use GDrive→YouTube for primary lessons.
- **Add full learning environment**: transcripts, takeaways, milestones, projects, review videos.
- **Add student assessment**: quizzes, flash cards, project rubrics, progress tracking.
- **Adapt AI prompts** for non-programming content (discussion, exercises, debrief).

The hybrid approach (Option B) keeps our working portal and layers on the best parts of the generator, extended for a complete student learning experience.
