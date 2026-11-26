# notebooklm-py – Google NotebookLM for High School LMS

Programmatic access to Google NotebookLM for content generation.

**Account:** Gemini **Pro** under `fjkiani1@gmail.com`  
(override with `NOTEBOOKLM_ACCOUNT_EMAIL`)

This portal does **not** apply free-tier soft caps (~3 audio/day). Quotas come
from live `notebooklm usage --json` on the Pro account.

Source: [github.com/teng-lin/notebooklm-py](https://github.com/teng-lin/notebooklm-py)

---

## Setup

```bash
cd /path/to/zeta-tech
python3 -m venv .venv-notebooklm
.venv-notebooklm/bin/pip install -r scripts/notebooklm-py/requirements.txt
```

### Authenticate (Pro account)

**Preferred for Cloud Agents / CI** — set env/secret (never commit):

```bash
export NOTEBOOKLM_ACCOUNT_EMAIL=fjkiani1@gmail.com
export NOTEBOOKLM_AUTH_JSON="$(cat ~/.notebooklm/profiles/default/storage_state.json)"
./scripts/notebooklm-py/auth-bootstrap.sh
```

**Local one-time browser login:**

```bash
./scripts/notebooklm-py/notebooklm.sh login
# Sign in as fjkiani1@gmail.com
./scripts/notebooklm-py/notebooklm.sh auth check --test
./scripts/notebooklm-py/notebooklm.sh usage --json
```

Cookies land in `~/.notebooklm/profiles/<profile>/storage_state.json`.
**Never commit** that file.

### Keep cookies fresh (unattended)

```bash
# When using file-based auth (not NOTEBOOKLM_AUTH_JSON):
./scripts/notebooklm-py/notebooklm.sh auth refresh --verify
# Cadence: every 15–20 minutes via cron/systemd
```

Portal `ensureAuth()` calls `auth refresh --verify` automatically before generate
when cookies exist but look stale.

---

## Quick Usage

```bash
NLM=./scripts/notebooklm-py/notebooklm.sh

$NLM create "High School Research"
$NLM use <notebook_id>
$NLM source add "./Bronx-HS-Medical-Science/week0.5-lesson-plan.md"

$NLM generate audio "engaging deep dive for high-school" --format deep-dive --wait
$NLM generate quiz "focus on misconceptions" --difficulty medium --quantity standard --wait
$NLM generate flashcards --quantity more --wait
$NLM generate slide-deck "one concept per slide" --format detailed --wait
$NLM generate mind-map --kind interactive --instructions "Root = topic; depth ≤ 3"
$NLM generate data-table "Columns: Concept, Definition, Example, Common Mistake" --wait

$NLM download audio ./podcast.mp3
$NLM download quiz --format json ./quiz.json
```

Portal generate API (`POST /api/lessons/[id]/generate`) builds these prompts
from school/lesson context and **rejects stub downloads** (< ~1KB audio).

---

## Env vars

| Var | Purpose |
|---|---|
| `NOTEBOOKLM_ACCOUNT_EMAIL` | Expected Google account (default `fjkiani1@gmail.com`) |
| `NOTEBOOKLM_AUTH_JSON` | Inline Playwright `storage_state` / cookie JSON |
| `NOTEBOOKLM_PROFILE` | Named profile when using on-disk cookies |
| `NOTEBOOKLM_HL` | Output language |
| `NOTEBOOKLM_BACKEND` | `web` (default) or `android` |
