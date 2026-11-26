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

**Preferred for Cloud Agents / CI — durable master token** (never commit):

`NOTEBOOKLM_AUTH_JSON` / `storage_state.json` is often **>4096 chars** and
**cannot** be saved as a Cursor secret. Use master token instead:

```bash
# Laptop (one-time):
pip install 'notebooklm-py[headless,browser]'
notebooklm login --master-token --account fjkiani1@gmail.com
# Set Cloud Agent secret NOTEBOOKLM_MASTER_TOKEN_JSON = master_token.json contents
# Restart agent so process env receives it, then:
export NOTEBOOKLM_ACCOUNT_EMAIL=fjkiani1@gmail.com
export NOTEBOOKLM_PROFILE=agent-cloud
./scripts/notebooklm-py/bootstrap-master-token.sh
```

**Local one-time browser login (cookies):**

```bash
./scripts/notebooklm-py/notebooklm.sh login
# Sign in as fjkiani1@gmail.com
./scripts/notebooklm-py/notebooklm.sh auth check --test
./scripts/notebooklm-py/notebooklm.sh usage --json
```

Master token → `~/.notebooklm/profiles/agent-cloud/master_token.json` (mode 0600).  
Cookies mint to sibling `storage_state.json` via `auth refresh`.  
**Never commit** those files.

### Keep cookies fresh (unattended)

```bash
./scripts/notebooklm-py/notebooklm.sh auth refresh --verify
# Cadence: every 15–20 minutes via cron/systemd
# Sibling master_token.json can remint expired cookies
```

Portal `ensureAuth()` materializes `NOTEBOOKLM_MASTER_TOKEN_JSON` when set, else
refreshes on-disk master token / cookies before generate.

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
| `NOTEBOOKLM_MASTER_TOKEN_JSON` | Durable headless auth (write to profile `master_token.json`) |
| `NOTEBOOKLM_PROFILE` | Named profile (`agent-cloud` for master-token path) |
| `NOTEBOOKLM_AUTH_JSON` | Short-lived cookie JSON — **skip in Cursor** (4096 limit) |
| `NOTEBOOKLM_HL` | Output language |
| `NOTEBOOKLM_BACKEND` | `web` (default) or `android` |
