# Sandbox Integration Plan

**Goal**: Fork [ishaan1013/sandbox](https://github.com/ishaan1013/sandbox) and integrate it into the High School LMS as a code-editing environment for students (practice, exercises, real-time collaboration).

**Sandbox repo**: Code editing environment with AI copilot and real-time collaboration. Tech: Next.js, Monaco, Liveblocks, Clerk, Cloudflare Workers (D1, R2, Workers AI), E2B (Linux sandboxes for terminal/preview).

---

## 1. Fork & Clone

```bash
# On GitHub: Fork https://github.com/ishaan1013/sandbox → your-org/sandbox (or your-username/sandbox)

# Clone into High-School repo (as subdirectory or sibling)
cd /Users/fahadkiani/Desktop/development/High-School
git clone https://github.com/YOUR_USERNAME/sandbox.git sandbox-app
```

**Option A – Monorepo**: Add `sandbox-app/` as a subdirectory of High-School.  
**Option B – Separate repo**: Keep sandbox in its own repo; link from portal (recommended for complexity).

---

## 2. Integration Options

| Option | Description | Effort |
|--------|-------------|--------|
| **A. Linked app** | Portal has "Open Sandbox" → opens sandbox in new tab or same tab at `/sandbox`. Sandbox runs as separate Next.js app (different port or same domain via proxy). | Low |
| **B. Embedded iframe** | Portal route `/sandbox` renders an iframe to sandbox URL. Sandbox must allow embedding (X-Frame-Options, CORS). | Low |
| **C. Merged frontend** | Merge sandbox frontend into `portal/` (e.g. `portal/app/sandbox/`). Share layout, nav. Requires reconciling auth (Clerk vs our session) and bundling. | High |
| **D. Subdomain** | Deploy sandbox at `sandbox.highschool.example.com`; portal links there. Clean separation. | Medium |

**Recommendation**: Start with **A** or **B** – run sandbox as a separate app, link/embed from portal. Unify auth later if needed.

---

## 3. Portal Integration Points

- **Nav**: Add "Sandbox" link in `portal/app/layout.jsx` → `/sandbox` or external URL.
- **Lesson context**: Optional – "Practice in Sandbox" button on lesson detail, passing lesson/school context as query params for sandbox to preload.
- **Route**: Either `portal/app/sandbox/page.jsx` that redirects or embeds iframe.

---

## 4. Sandbox Dependencies (from repo)

| Service | Purpose | Our replacement? |
|---------|---------|------------------|
| **Clerk** | Auth | Keep for sandbox; or swap for portal session (bigger change) |
| **Liveblocks** | Real-time collab | Keep (has free tier) |
| **E2B** | Linux sandboxes (terminal, preview) | Keep (paid; needed for isolation) |
| **Cloudflare D1** | DB | Keep or migrate to Hygraph/Postgres later |
| **Cloudflare R2** | Storage | Keep or migrate |
| **Workers AI** | AI autocomplete | Keep or swap for our NotebookLM/other LLM |

Minimum: Clerk, Liveblocks, E2B, Cloudflare Workers. You’ll need accounts and API keys.

---

## 5. Steps to Execute

1. **Fork** on GitHub: https://github.com/ishaan1013/sandbox → Fork.
2. **Clone** into High-School (or sibling folder).
3. **Configure** sandbox:
   - `frontend/.env` – Clerk, Liveblocks
   - `backend/server/.env` – E2B, etc.
   - `backend/database`, `storage`, `ai` – `wrangler.toml` / env
4. **Run sandbox** locally:
   - `cd sandbox-app/frontend && npm run dev` (e.g. port 3001)
   - `cd sandbox-app/backend/server && npm run dev`
   - Cloudflare Workers: `npm run dev` in each worker dir
5. **Add portal link**:
   - In `portal/app/layout.jsx`: `<Link href="http://localhost:3001">Sandbox</Link>` (dev)
   - For production: use deployed sandbox URL or `/sandbox` proxy/iframe.
6. **Optional**: Create `portal/app/sandbox/page.jsx` that embeds sandbox in iframe or redirects.

---

## 6. Production Considerations

- **Deploy sandbox**: Vercel/Railway for frontend + server; Cloudflare for workers; E2B for sandboxes.
- **Same-domain embedding**: Reverse proxy `/sandbox` → sandbox app to avoid iframe restrictions.
- **Auth**: Students can use Clerk (sandbox’s own sign-in) or we add SSO later to share portal identity.

---

## 7. Handoff Note

When you’re ready to implement:

1. Fork and clone per §1.
2. Set up sandbox env per §4–5.
3. Add portal link per §3.
4. Deploy sandbox when moving to production per §6.

See [sandbox README](https://github.com/ishaan1013/sandbox) for setup details and [@jamesmurdza’s guide](https://github.com/ishaan1013/sandbox#running-locally) for local setup.
