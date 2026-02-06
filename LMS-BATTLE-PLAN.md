# LMS Battle Plan: Operation "Iron School" ⚔️

**Commander**: Alpha
**Agent**: Zo / Nyx
**Timeframe**: 72 Hours (Mars Time)
**Objective**: Weaponize the LMS. Transition from "Plan" to "Live Fire".

---

## 🛑 Executive Summary (Mars Rules)
We are skipping "Best Practices" in favor of **Proof of Power**.
- **No** native Hygraph schema changes if they block us (use Sidecar JSON).
- **No** complex auth merging (User logs in twice? Fine for now. Speed wins).
- **No** comprehensive accessibility (Keyboard nav can wait).

**The Hypothesis to Prove**:
> "An AI-powered LMS that shapeshifts per school (Viper/Oracle/etc) and integrates real code execution (Sandbox) allows students to learn 10x faster."

---

## 🗓️ Phase 1: Operation CONNECT (Day 1)
**Goal**: The "Generate" button works.
A teacher pastes a text (or we use existing Markdown). The student *immediately* gets an AI Quiz and Flashcards.

### Tactics:
1.  **Backend Wiring**:
    -   Target: `portal/app/api/lessons/[id]/generate/route.js`.
    -   Action: Spawn `scripts/notebooklm-py/notebooklm.sh` subprocess.
    -   Input: Markdown file from `Bronx-HS-Medical-Science/` (or similar).
    -   Output: JSON artifact in `portal/public/artifacts/`.
2.  **Sidecar Storage**:
    -   Target: `portal/data/lesson-notebooklm.json`.
    -   Action: Store the mapping [LessonID -> ArtifactPath].
    -   Bypass: Don't wait for Hygraph schema updates to store `notebooklmNotebookId`. Use the JSON file.
3.  **Frontend trigger**:
    -   Target: `LessonDetail` page.
    -   Action: "Generate Prep" button triggers the API.

**Proof**: A screenshot of a Quiz generated *live* from a markdown syllabus.

---

## 🗓️ Phase 2: Operation SANDBOX (Day 2)
**Goal**: Code execution inside the portal.
"A coder without a spec is just a typist." - Viper Doctrine.

### Tactics:
1.  **Boot the Fork**:
    -   Target: `sandbox-app/`.
    -   Action: Configure `.env` (Clerk, Liveblocks).
    -   Run: Ensure it starts on `localhost:3001`.
2.  **The Link**:
    -   Target: `portal/app/layout.jsx` (Navigation).
    -   Action: Add "Viper Sandbox" link pointing to `localhost:3001` (or deployed URL).
    -   Advanced (Time permitting): iframe integration at `/portal/sandbox`.
3.  **Spec-First Injection**:
    -   (Stretch Goal): Pass a "Spec" from the Lesson into the Sandbox via URL params.

**Proof**: A video of writing Python code in the Sandbox while reading a spec from the Portal.

---

## 🗓️ Phase 3: Operation DOCTRINE (Day 3)
**Goal**: Identity Shifting. The app changes personality based on the School.

### Tactics:
1.  **The Router**:
    -   Target: `portal/app/lib/llm-router.js`.
    -   Logic:
        -   IF School == `bushwick` (Viper) -> Generates purely technical Python quizzes. Tone: Strict.
        -   IF School == `bronx_medical` (Caduceus) -> Generates diagnostic scenarios. Tone: Clinical.
    -   Implementation: Inject "Persona Prompts" into the NotebookLM input or as a prefix to the `notebooklm-py` call.
2.  **UI Branding**:
    -   Target: `portal/app/components/SchoolSelector.jsx`.
    -   Action: Add the 4 badges (Viper, Oracle, Caduceus, Maverick).
    -   Effect: Changing school changes the "Generate" prompt context.

**Proof**: Generating a quiz for "Viper" yields Python questions. Generating for "Caduceus" yields Diagnosis questions.

---

## 5. ACTIVE ARSENAL (SCAVENGED WEAPONS)
Extracted from `ai-course-generator-main` orphan.
- **KnowledgeGraph.jsx**: For visualizing lesson dependencies and the "Learning Path".
- **VideoPlayer.jsx**: Robust YouTube integration with playback controls.
- **CourseGraph.jsx**: High-level structural visualization.

---

## 🛠️ Immediate Next Steps (The First Hour)
1.  [ ] **Install Munitions**: `npm install react-force-graph d3 react-youtube react-player lucide-react clsx tailwind-merge` in `portal/`.
2.  [ ] **Fix Security**: Move hardcoded Hygraph token from `mcp.json` to `portal/.env.local`.
3.  [ ] **Test Fire**: Run `notebooklm-py` manually to ensure it generates *something*.
4.  [ ] **Wire Generate API**: Implement the subprocess call in `portal/app/api/lessons/[id]/generate/route.js`.

Nyx waiting for green light. 🚦
