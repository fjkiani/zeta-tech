# Hygraph MCP Audit
## For Backend & Student Portal Build — High School Project

**Audit Date**: February 2025  
**Purpose**: Review Hygraph MCP configuration, capabilities, and fitness for building a student portal + backend.

---

## 1. EXECUTIVE SUMMARY

| Item | Status | Notes |
|:-----|:-------|:------|
| **MCP Connected** | ✅ Yes | Configured in Cursor as `user-Hygraph MCP Server` |
| **Authentication** | ⚠️ Security risk | Bearer token hardcoded in `mcp.json` |
| **Current Project** | ℹ️ Different use case | Oncology/CrisPRO content, not student portal |
| **Schema Fit** | ❌ Needs new models | Must add Student, Course, etc. for portal |
| **Capabilities** | ✅ Full CRUD + Publish | Read, Create, Update, Publish supported |
| **Delete/Unpublish** | ❌ Not supported | Via MCP—use Hygraph Studio if needed |

---

## 2. CONFIGURATION REVIEW

### 2.1 Current Setup (from `~/.cursor/mcp.json`)

```json
"Hygraph MCP Server": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote@latest",
    "https://mcp-us-west-2.hygraph.com/cm65g7pxd09kx07my82376f33/master/mcp",
    "--header",
    "Authorization: Bearer [JWT_TOKEN]"
  ],
  "env": {}
}
```

**Details:**
- **Region**: `us-west-2`
- **Project ID**: `cm65g7pxd09kx07my82376f33`
- **Environment**: `master`
- **Transport**: `mcp-remote` (stdio → HTTP bridge)

### 2.2 ⚠️ SECURITY: Token Exposure

**Problem**: The PAT (Permanent Auth Token) is hardcoded in `mcp.json`.

**Recommendation** (from Hygraph docs):

```json
"Hygraph MCP Server": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote@latest",
    "https://mcp-us-west-2.hygraph.com/YOUR_PROJECT_ID/master/mcp",
    "--header",
    "Authorization: Bearer ${HYGRAPH_TOKEN}"
  ],
  "env": {
    "HYGRAPH_TOKEN": "your_token_here"
  }
}
```

- Move token to `env` and **never commit** `mcp.json` with secrets
- Use `.gitignore` for local MCP config if it contains tokens
- Consider separate tokens for dev vs. prod

---

## 3. AVAILABLE MCP TOOLS (13 Total)

| Tool | Purpose | Use Case for Student Portal |
|:-----|:--------|:----------------------------|
| `get_project_info` | Schema, models, stages, locales | Discover structure; plan new models |
| `list_entity_types` | All content model names | Know what exists (Post, Author, etc.) |
| `list_entities` | Query entries by type + filters | Fetch courses, students, assignments |
| `get_entities_by_id` | Fetch specific entries by ID | Get one student, one course |
| `get_entity_schema` | Field structure for a model | Build forms, validate inputs |
| `get_management_operation_schema` | Management API operations | Schema migrations, model changes |
| `discover_entities` | Explore schema + sample data | Onboarding, debugging |
| `create_entry` | Create new content | Add student, course, grade |
| `update_entry` | Update existing content | Edit student profile, grades |
| `publish_entry` | Publish draft to live | Make course/announcement live |
| `search_content` | Full-text search across content | Search courses, assignments |
| `execute_graphql` | Raw GraphQL queries/mutations | Custom queries, complex filters |
| `submit_batch_migration` | Batch schema changes | Bulk model updates |

**Not available via MCP:**
- `delete_entry` — use Hygraph Studio or Management API directly
- `unpublish` — same

---

## 4. CURRENT HYGRAPH PROJECT SCHEMA

The connected project is **not** student-portal oriented. It appears to be a CrisPRO/oncology content site.

### 4.1 Content Models (Sample)

| Model | Purpose | Relevant for Portal? |
|:------|:--------|:---------------------|
| Author | Blog authors | Maybe (instructor/teacher) |
| Post | Blog posts | Maybe (announcements) |
| Category | Content taxonomy | Maybe (course categories) |
| Projects | Project showcase | Maybe (student projects) |
| HeroContent | Landing hero | Maybe (portal homepage) |
| UseCase | Use case descriptions | No |
| Technology | Tech stack | No |
| TeamMember | Team bios | Maybe (faculty) |
| MediaCategory, MediaItem | Media library | Yes (resources, PDFs) |

### 4.2 System Fields (All Models)

- `id`, `createdAt`, `updatedAt`
- `stage` (DRAFT | PUBLISHED)
- `publishedAt`, `publishedBy`
- `documentInStages`, `locale`, `localizations`, `history`, `scheduledIn`

### 4.3 Stages & Locales

- **Stages**: DRAFT, PUBLISHED
- **Locale**: en (English) — single locale

---

## 5. GAP ANALYSIS: Student Portal vs. Current Schema

### 5.1 What a Student Portal Typically Needs

| Entity | Purpose | Current Hygraph? |
|:-------|:--------|:-----------------|
| **Student** | User/profile, enrollments | ❌ No |
| **Course** | Course catalog, syllabus | ❌ No (Post/Category could be adapted) |
| **Assignment** | Assignments, due dates | ❌ No |
| **Grade** | Grades, feedback | ❌ No |
| **School** | School info (Bronx HS, Bushwick, etc.) | ❌ No |
| **Lesson** | Lesson plans, content | ❌ No (Post could be adapted) |
| **Announcement** | School/class announcements | ⚠️ Post could work |

### 5.2 Options

**Option A: New Hygraph Project for Student Portal**

- Create a dedicated Hygraph project for the High School platform
- Design schema from scratch: Student, Course, Assignment, Grade, School
- Get new MCP endpoint + PAT
- Clean separation from oncology content

**Option B: Extend Current Project**

- Add new content models: Student, Course, Assignment, etc.
- Use Management API / `get_management_operation_schema` + `submit_batch_migration` (if supported for model creation)
- Note: Creating models via MCP may be limited; Hygraph Studio is often required for schema design

**Option C: Use Existing Models Creatively**

- Map Post → Announcement or Lesson
- Map Author → Teacher
- Map Category → Course or Subject
- Map MediaItem → Assignment attachment or resource
- Quick to start but may be limiting long-term

---

## 6. RECOMMENDED STUDENT PORTAL SCHEMA (Hygraph)

If you create a new project or extend the current one, consider:

```
Student
├── name (String)
├── email (String, unique)
├── school (Relation → School)
├── enrollments (Relation[] → Enrollment)
└── avatar (Asset, optional)

School
├── name (String)
├── slug (String)
├── courses (Relation[] → Course)
└── students (Relation[] → Student)

Course
├── title (String)
├── slug (String)
├── description (Richtext)
├── school (Relation → School)
├── lessons (Relation[] → Lesson)
├── assignments (Relation[] → Assignment)
└── syllabus (Richtext, optional)

Lesson
├── title (String)
├── slug (String)
├── content (Richtext)
├── course (Relation → Course)
├── order (Int)
└── week (Int, optional)

Assignment
├── title (String)
├── description (Richtext)
├── dueDate (DateTime)
├── course (Relation → Course)
├── maxPoints (Int)
└── attachments (Relation[] → Asset)

Enrollment
├── student (Relation → Student)
├── course (Relation → Course)
├── status (Enum: ACTIVE, COMPLETED, DROPPED)
└── enrolledAt (DateTime)

Grade (if storing in CMS — otherwise use separate DB)
├── student (Relation → Student)
├── assignment (Relation → Assignment)
├── score (Float)
├── feedback (String, optional)
└── gradedAt (DateTime)
```

---

## 7. MCP TOOL USAGE EXAMPLES (Verified)

### 7.1 `list_entity_types`

```json
// Returns: Api, Asset, Author, Category, Component, HeroContent, MediaCategory, MediaItem, Post, Projects, Technology, TeamMember, UseCase, ...
```

### 7.2 `list_entities`

```json
{
  "typename": "Post",
  "limit": 10,
  "stage": "PUBLISHED"
}
```

Returns: `nodes[]` with `id`, `title`, `slug`, `content`, `excerpt`, `publishedAt`, etc.

### 7.3 `get_project_info`

Returns full schema: models, components, enumerations, stages, locales, management operations.

---

## 8. BACKEND INTEGRATION RECOMMENDATIONS

### 8.1 Direct Hygraph Content API (REST/GraphQL)

For the **student portal frontend** and **backend**:

- Use Hygraph's Content API directly (GraphQL or REST)
- Endpoint: `https://api-us-west-2.hygraph.com/v2/cm65g7pxd09kx07my82376f33/master`
- Auth: Public API token for read-only, or PAT for mutations

### 8.2 When to Use MCP vs. Direct API

| Use Case | MCP | Direct API |
|:---------|:----|:-----------|
| AI-assisted content creation (Cursor) | ✅ | — |
| Schema discovery during development | ✅ | — |
| Student portal frontend queries | — | ✅ |
| Backend CRUD (Next.js API routes, etc.) | — | ✅ |
| Bulk migrations, scripting | ✅ or Direct | ✅ |

### 8.3 Backend Stack Suggestion

- **Frontend**: Next.js, React, or similar
- **CMS/Content**: Hygraph (Content API)
- **Auth**: Separate (Clerk, Auth0, Supabase Auth, etc.) — Hygraph is content, not auth
- **Grades/Enrollments**: Consider a DB (Postgres, Supabase) for transactional data; use Hygraph for course/lesson content

---

## 9. CURSOR-SPECIFIC NOTES

From Hygraph docs:

> **Warning**: Models selected through Auto mode in Cursor cannot handle our MCP server. Select a model manually.

- Use a model that supports MCP (e.g. Claude, GPT-4) — avoid Auto
- If MCP tools don’t appear: restart Cursor, check MCP server status, verify `npx` and Node ≥ 20.18.1

---

## 10. ACTION ITEMS

| Priority | Action |
|:---------|:-------|
| **P0** | Move PAT to env var; remove from `mcp.json` before any commit |
| **P1** | Decide: new Hygraph project vs. extend current vs. creative mapping |
| **P2** | Design Student/Course/Assignment schema if building net-new |
| **P3** | Set up Hygraph Content API in backend (GraphQL client) |
| **P4** | Plan auth (separate from Hygraph) for student login |

---

## 11. REFERENCES

- [Hygraph MCP Server Docs](https://hygraph.com/docs/hygraph-ai/mcp-server)
- [Hygraph AI Overview](https://hygraph.com/docs/hygraph-ai)
- [PAT & Permissions](https://hygraph.com/docs/api-reference/basics/authorization#permanent-auth-tokens)
- [Content API](https://hygraph.com/docs/api-reference/content-api)

---

*Audit complete. Ready for backend and student portal architecture decisions.*
