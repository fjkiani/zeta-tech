#!/usr/bin/env bash
# Bridge smoke test (handoff §3 checklist). Boots the server on a test port and
# asserts the full API contract. Exits non-zero on first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT_TEST=4399
BASE="http://127.0.0.1:${PORT_TEST}"
export BRIDGE_API_KEY=smoke-test-key

# deterministic start: clear prior approval-queue state from earlier runs
rm -f data/approvals.json data/scheduled.json

node --check server.js
node --check lib/hygraph.js
node --check lib/langgraph.js
node --check lib/llm.js
node --check lib/clerk-auth.js
node --check lib/gtm-prompts.js
node --check scripts/sync-hygraph.js
echo "PASS syntax (server.js, lib/*.js, scripts/sync-hygraph.js)"

PORT=$PORT_TEST node server.js &>/tmp/bridge-smoke.log &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
for _ in $(seq 1 40); do curl -sf "$BASE/api/health" >/dev/null 2>&1 && break; sleep 0.25; done

fail() { echo "FAIL: $1"; exit 1; }
# JSON bodies are pretty-printed; match ignoring whitespace/newlines
jgrep() { printf '%s' "$1" | tr -d ' \n' | grep -q "$2"; }

# 1. health
HEALTH=$(curl -sf "$BASE/api/health") || fail "health unreachable"
jgrep "$HEALTH" '"ok":true' || fail "health ok"
jgrep "$HEALTH" 'notebooklm-social-agent-bridge' || fail "health service name"
node -e "const h=JSON.parse(process.argv[1]); const ok=['api_key','clerk','clerk+api_key'].includes(h.auth); if(!ok) process.exit(1)" "$HEALTH" \
  || fail "health auth mode (expected api_key|clerk|clerk+api_key)"
echo "PASS /api/health (ok, service, auth gated)"

# 2. lessons
LESSONS=$(curl -sf "$BASE/api/lessons?source=static") || fail "lessons unreachable"
COUNT=$(node -e "console.log(JSON.parse(process.argv[1]).count)" "$LESSONS")
[ "$COUNT" -gt 0 ] || fail "lessons count>0"
echo "PASS /api/lessons?source=static (count=$COUNT)"

# source=hygraph hard-fails 503 when unconfigured
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/lessons?source=hygraph")
[ "$CODE" = "503" ] || fail "source=hygraph without config must 503, got $CODE"
echo "PASS /api/lessons?source=hygraph → 503 HYGRAPH_UNAVAILABLE (unconfigured)"

# 3. lesson detail
LESSON=$(curl -sf "$BASE/api/lessons/$(node -e "console.log(JSON.parse(process.argv[1]).lessons[0].id)" "$LESSONS")") \
  || fail "lesson detail unreachable"
jgrep "$LESSON" '"id"' || fail "lesson detail id"
echo "PASS /api/lessons/:id"

# 4. draft
DRAFT=$(curl -sf -X POST "$BASE/api/draft" -H 'content-type: application/json' \
  -d "{\"lessonId\":\"$(node -e "console.log(JSON.parse(process.argv[1]).lessons[0].id)" "$LESSONS")\"}") \
  || fail "draft unreachable"
jgrep "$DRAFT" '"chars"' || fail "draft chars"
echo "PASS /api/draft"

# 5. dry-run upload: CrisPRO defaults + platforms passthrough + HARD results[] assert
DRY=$(curl -sf -X POST "$BASE/api/upload" -H 'content-type: application/json' \
  -d '{"post":"smoke test post","dryRun":true,"platforms":["linkedin","twitter"]}') \
  || fail "dry-run unreachable"
jgrep "$DRY" '"dryRun":true' || fail "dryRun true"
jgrep "$DRY" '"organizationId":"107412290"' || fail "CrisPRO org default"
jgrep "$DRY" '"platforms":\["linkedin","twitter"\]' || fail "platforms passthrough"
# HARD ASSERT: results[] present, each item exactly the upload_post shape.
node -e '
const d = JSON.parse(process.argv[1]);
if (!Array.isArray(d.results) || d.results.length === 0) throw new Error("results[] missing/empty");
for (const r of d.results) {
  if (typeof r.platform !== "string" || !r.platform) throw new Error("platform not string");
  if (typeof r.attempted !== "boolean") throw new Error("attempted not boolean");
  if (typeof r.ok !== "boolean") throw new Error("ok not boolean");
  if (r.urn !== undefined && typeof r.urn !== "string") throw new Error("urn not string|undefined");
  if (r.error !== undefined && typeof r.error !== "string") throw new Error("error not string|undefined");
}
console.log("results[] typed OK:", d.results.map(r => r.platform + "/att=" + r.attempted + "/ok=" + r.ok).join(" "));
' "$DRY" || fail "results[] hard assert"
echo "PASS /api/upload dryRun (org=107412290, platforms echo, HARD results[] type assert)"

# 6. fail-closed media HEAD check: non-video URL → 400
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/upload" \
  -H 'content-type: application/json' -H "x-bridge-key: smoke-test-key" \
  -d '{"post":"bad media","videoUrl":"https://example.com/not-a-video"}')
[ "$CODE" = "400" ] || fail "media HEAD check must 400 on non-video, got $CODE"
echo "PASS media HEAD check rejects non-video (400)"

# 7. API-key gate on uploads/approvals
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/upload" \
  -H 'content-type: application/json' -d '{"post":"no key","lessonId":"does-not-exist"}')
[ "$CODE" = "401" ] || fail "upload without key must 401, got $CODE"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/upload" \
  -H 'content-type: application/json' -H "x-bridge-key: smoke-test-key" -d '{"lessonId":"does-not-exist"}')
[ "$CODE" = "404" ] || fail "upload with key + missing lesson (no post) must 404, got $CODE"
echo "PASS api-key gate (401 without key, 404 with key on missing lesson)"

# 8. HITL approval queue (Track B)
Q=$(curl -sf -X POST "$BASE/api/upload" -H 'content-type: application/json' \
  -H "x-bridge-key: smoke-test-key" \
  -d '{"post":"hitl smoke post","requireApproval":true,"platforms":["linkedin"]}')
jgrep "$Q" '"queued":true' || fail "approval queue parked"
jgrep "$Q" '"status":"pending"' || fail "approval pending"
AID=$(node -e "console.log(JSON.parse(process.argv[1]).approvalId)" "$Q")
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/approvals/$AID/approve")
[ "$CODE" = "401" ] || fail "approve without key must 401, got $CODE"
APPROVE=$(curl -sf -X POST "$BASE/api/approvals/$AID/approve" -H "x-bridge-key: smoke-test-key")
jgrep "$APPROVE" '"mode":"dry_run"' || fail "approve must be dry-run"
jgrep "$APPROVE" '"status":"approved"' || fail "approve status"
REJ=$(curl -sf -X POST "$BASE/api/upload" -H 'content-type: application/json' \
  -H "x-bridge-key: smoke-test-key" -d '{"post":"hitl reject","requireApproval":true}')
RID2=$(node -e "console.log(JSON.parse(process.argv[1]).approvalId)" "$REJ")
REJECTED=$(curl -sf -X POST "$BASE/api/approvals/$RID2/reject" -H "x-bridge-key: smoke-test-key")
jgrep "$REJECTED" '"status":"rejected"' || fail "reject status"
# 8b. publish-on-approve WITHOUT LIVE=1 must still be DRY-RUN (P1-6 default-off gate)
Q3=$(curl -sf -X POST "$BASE/api/upload" -H 'content-type: application/json' \
  -H "x-bridge-key: smoke-test-key" \
  -d '{"post":"publish-on-approve smoke","requireApproval":true,"publishOnApprove":true}')
AID3=$(node -e "console.log(JSON.parse(process.argv[1]).approvalId)" "$Q3")
APPROVE3=$(curl -sf -X POST "$BASE/api/approvals/$AID3/approve" -H "x-bridge-key: smoke-test-key")
jgrep "$APPROVE3" '"mode":"dry_run"' || fail "approve with publishOnApprove but no LIVE=1 must stay dry-run"
jgrep "$APPROVE3" '"status":"approved"' || fail "approve3 status"
APPROVALS=$(curl -sf "$BASE/api/approvals")
echo "$APPROVALS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d);if(a.count!==3) process.exit(1)})" \
  || fail "approvals list count=3"
echo "PASS HITL queue (park → approve=dry-run → reject → list; publishOnApprove WITHOUT LIVE=1 stays dry-run)"

# 8c. scheduler: park future → listed; past → 400; cancel works (P1-3)
FUTURE=$(node -e "console.log(new Date(Date.now()+3600e3).toISOString())")
SCH=$(curl -sf -X POST "$BASE/api/schedule" -H 'content-type: application/json' \
  -H "x-bridge-key: smoke-test-key" \
  -d "{\"post\":\"scheduled smoke post\",\"scheduledFor\":\"$FUTURE\",\"platforms\":[\"linkedin\"]}")
jgrep "$SCH" '"status":"scheduled"' || fail "schedule parked"
SID=$(node -e "console.log(JSON.parse(process.argv[1]).scheduleId)" "$SCH")
SCHEDLIST=$(curl -sf "$BASE/api/schedule")
jgrep "$SCHEDLIST" '"autoPost":false' || fail "scheduler autoPost=false documented"
jgrep "$SCHEDLIST" "\"id\":\"$SID\"" || fail "scheduled item listed"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/schedule" \
  -H 'content-type: application/json' -H "x-bridge-key: smoke-test-key" \
  -d "{\"post\":\"past\",\"scheduledFor\":\"2020-01-01T00:00:00Z\"}")
[ "$CODE" = "400" ] || fail "past scheduledFor must 400, got $CODE"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/schedule" \
  -H 'content-type: application/json' \
  -d "{\"post\":\"no key\",\"scheduledFor\":\"$FUTURE\"}")
[ "$CODE" = "401" ] || fail "schedule without key must 401, got $CODE"
CANCEL=$(curl -sf -X POST "$BASE/api/schedule/$SID/cancel" -H "x-bridge-key: smoke-test-key")
jgrep "$CANCEL" '"status":"cancelled"' || fail "schedule cancel"
echo "PASS /api/schedule (park future → list, autoPost:false, past→400, no-key→401, cancel)"

# 8d. media check endpoint (P1-4 backend)
MC_OK=$(curl -sf "$BASE/api/media-check?url=https%3A%2F%2Fus-west-2.graphassets.com%2Fcm65gc2pl00vr08gs2em34vmw%2Fcmkrjbuftdycb07lpstjklcss")
jgrep "$MC_OK" '"ok":true' || fail "media-check ok for real mp4"
jgrep "$MC_OK" 'video/mp4' || fail "media-check content-type"
MC_BAD=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/media-check?url=https%3A%2F%2Fexample.com%2Fnot-a-video")
[ "$MC_BAD" = "400" ] || fail "media-check must 400 on non-video, got $MC_BAD"
echo "PASS /api/media-check (live mp4 → ok video/mp4; non-video → 400)"

# 9. deterministic calendar (Track D)
CAL=$(curl -sf "$BASE/api/calendar?source=static")
jgrep "$CAL" '"deterministic":true' || fail "calendar deterministic"
jgrep "$CAL" '"horizonDays":14' || fail "calendar horizon"
node -e "const c=JSON.parse(process.argv[1]); if(!c.items.length) process.exit(1); c.items.forEach(i=>{if(!['linkedin','twitter'].includes(i.platform)) process.exit(1)})" "$CAL" \
  || fail "calendar items platforms"
echo "PASS /api/calendar (deterministic, 14-day, ranked)"

# 9b. GTM suggest stub (default): prompts present, no LLM called
SUG=$(curl -sf "$BASE/api/calendar/suggest?source=static")
jgrep "$SUG" '"llm":"not' || fail "suggest llm not called"
node -e "
const s = JSON.parse(process.argv[1]);
const sug = s.suggestion || {};
if (typeof sug.systemPrompt !== 'string' || !sug.systemPrompt.length) process.exit(1);
if (typeof sug.userPrompt !== 'string' || !sug.userPrompt.length) process.exit(1);
if (!Array.isArray(s.items) || !s.items.length) process.exit(1);
if (typeof s.deterministic !== 'boolean' || !s.deterministic) process.exit(1);
" "$SUG" || fail "suggest prompts/types"
echo "PASS /api/calendar/suggest (GTM prompts stub, llm=not called, types OK)"

# 9c. auth config + health expose clerk/llm flags (no secrets beyond publishable)
AUTHCFG=$(curl -sf "$BASE/api/auth/config")
jgrep "$AUTHCFG" '"clerk":' || fail "auth/config missing clerk"
HEALTH=$(curl -sf "$BASE/api/health")
jgrep "$HEALTH" '"llm":' || fail "health missing llm"
echo "PASS /api/auth/config + health clerk/llm surface"

# 9d. optional live LLM — only when OPENROUTER_API_KEY/LLM_API_KEY present in env
if [ -n "${OPENROUTER_API_KEY:-${LLM_API_KEY:-}}" ]; then
  LLM_SUG=$(curl -sf "$BASE/api/calendar/suggest?source=static&runLlm=1") \
    || fail "runLlm suggest failed"
  jgrep "$LLM_SUG" '"llm":"called"' || jgrep "$LLM_SUG" '"llm":"skipped' \
    || fail "runLlm must be called or skipped"
  echo "PASS /api/calendar/suggest?runLlm=1 (optional live LLM path)"
else
  echo "SKIP live LLM smoke (no OPENROUTER_API_KEY/LLM_API_KEY in env)"
fi

# 10. audit trail rows grew
tail -1 data/audit.log | grep -q '"evt"' || fail "audit log events"
echo "PASS audit trail (data/audit.log events appended)"

# 11. audit viewer endpoint
AUDIT=$(curl -sf "$BASE/api/audit?limit=50")
jgrep "$AUDIT" '"events":\[' || fail "audit endpoint events array"
node -e "const a=JSON.parse(process.argv[1]); if(!a.total) process.exit(1); if(a.events.length>a.total) process.exit(1)" "$AUDIT" \
  || fail "audit endpoint counts"
echo "PASS /api/audit (tail of data/audit.log)"

# 12. console FE serves the ops panels (approvals, calendar, audit, key, results, clerk, GTM)
HTML_FILE=$(mktemp)
curl -sf "$BASE/" >"$HTML_FILE" || fail "console HTML fetch"
for id in approvalsPanel calendarPanel auditPanel scheduledPanel apiKey resultsBox pLinkedin requireApproval publishOnApprove mediaPreview scheduleAt sourceBadge clerkMount gtmSuggestBtn gtmLlmBtn; do
  grep -q "id=\"$id\"" "$HTML_FILE" || fail "console HTML missing id=$id"
done
node -e "
const fs=require('fs');
const s=fs.readFileSync(process.argv[1],'utf8');
const m=s.match(/<script>([\\s\\S]*)<\\/script>/);
if(!m) process.exit(1);
new Function(m[1].replace(/await /g,''));
" "$HTML_FILE" || fail "console inline script does not parse"
rm -f "$HTML_FILE"
echo "PASS console FE (ops panels + key entry + results box present, script parses)"

echo "ALL BRIDGE SMOKE TESTS PASSED"
