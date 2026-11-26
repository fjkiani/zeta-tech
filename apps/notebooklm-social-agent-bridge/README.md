# NotebookLM → Social Agent Bridge

Zeta Tech control surface that turns NotebookLM lesson transcripts into LinkedIn posts via [langchain-social-agent](https://github.com/fjkiani/langchain-social-agent) (LangGraph `upload_post`).

## Run locally

```bash
# Terminal A — social agent
cd /path/to/langchain-social-agent
yarn langgraph:in_mem:up   # http://127.0.0.1:54367

# Terminal B — bridge
cd apps/notebooklm-social-agent-bridge
LANGGRAPH_API_URL=http://127.0.0.1:54367 node server.js
# → http://127.0.0.1:4317
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Bridge + LangGraph status |
| GET | `/api/lessons` | Lesson index from NotebookLM artifacts |
| GET | `/api/lessons/:id` | Lesson + transcript |
| POST | `/api/draft` | `{ lessonId, platform? }` → draft post |
| POST | `/api/upload` | `{ post? , lessonId?, dryRun? }` → LangGraph `upload_post` |

## Env

- `PORT` — default `4317`
- `LANGGRAPH_API_URL` — LangGraph base URL (required for live upload)
- `TEXT_ONLY_MODE` — default on (`true`)
