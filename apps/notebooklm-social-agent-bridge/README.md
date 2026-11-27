# NotebookLM → Social Agent Bridge

Zeta Tech control surface that turns NotebookLM lesson transcripts into LinkedIn posts via [langchain-social-agent](https://github.com/fjkiani/langchain-social-agent) (LangGraph `upload_post`).

Default LinkedIn target: **CrisPRO.ai company page** (`linkedin.com/company/crispro`, org id `107412290`).

## Run locally

```bash
# Terminal A — social agent (Arcade LinkedIn + org scopes)
cd /path/to/langchain-social-agent
# Ensure .env has:
#   USE_ARCADE_AUTH=true
#   LINKEDIN_USER_ID=fjkiani@gmail.com
#   POST_TO_LINKEDIN_ORGANIZATION=true
#   LINKEDIN_ORGANIZATION_ID=107412290
yarn langgraph:in_mem:up   # http://localhost:54367

# Terminal B — bridge
cd apps/notebooklm-social-agent-bridge
LANGGRAPH_API_URL=http://localhost:54367 \
POST_TO_LINKEDIN_ORGANIZATION=true \
LINKEDIN_ORGANIZATION_ID=107412290 \
node server.js
# → http://127.0.0.1:4317
```

> LangGraph CLI often binds IPv6 `localhost` only — use `http://localhost:54367`, not `127.0.0.1`.

## Company-page auth (required once)

Arcade member auth is already connected. **Org posting needs `w_organization_social`.**

```bash
cd /path/to/langchain-social-agent
yarn tsx scripts/authorize-linkedin-org.mts
# Open the printed Arcade URL, approve LinkedIn company-page scopes, then retry upload.
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Bridge + LangGraph status + Crispro target config |
| GET | `/api/lessons` | Lesson index from NotebookLM artifacts |
| GET | `/api/lessons/:id` | Lesson + transcript |
| POST | `/api/draft` | `{ lessonId, platform? }` → draft post |
| POST | `/api/upload` | Upload via LangGraph `upload_post` (see below) |

### `POST /api/upload` body

```json
{
  "post": "optional text",
  "lessonId": "optional lesson id",
  "postToLinkedInOrganization": true,
  "linkedInOrganizationId": "107412290",
  "videoUrl": "https://…/lesson.mp4",
  "imageUrl": "https://…/slide.png",
  "dryRun": false,
  "wait": true
}
```

- Default target is CrisPRO org when `POST_TO_LINKEDIN_ORGANIZATION` is true.
- Set `target: "personal"` or `postToLinkedInOrganization: false` for the member profile.
- `videoUrl` uses LinkedIn `feedshare-video` via social-agent (public HTTPS URL required).
- NotebookLM lesson artifacts in this repo are mostly audio/slides/quiz — supply a public video URL or generate one in the NotebookLM portal first.

## Env

- `PORT` — default `4317`
- `LANGGRAPH_API_URL` — LangGraph base URL (required for live upload)
- `TEXT_ONLY_MODE` — default on (`true`); auto-disabled when media URL is sent
- `POST_TO_LINKEDIN_ORGANIZATION` — default `true` (Crispro)
- `LINKEDIN_ORGANIZATION_ID` — default `107412290`
- `LINKEDIN_ORG_VANITY` — default `crispro`
