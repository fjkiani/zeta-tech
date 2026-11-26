#!/usr/bin/env bash
# Bridge smoke test (handoff §3 checklist). Boots the server on a test port and
# asserts the full API contract. Exits non-zero on first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT_TEST=4399
BASE="http://127.0.0.1:${PORT_TEST}"
export BRIDGE_API_KEY=smoke-test-key

# deterministic start: clear prior approval-queue state from earlier runs
rm -f data/approvals.json

node --check server.js
node --check lib/hygraph.js
node --check lib/langgraph.js
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
jgrep "$HEALTH" '"auth":"api_key"' || fail "health auth mode"
echo "PASS /api/health (ok, service, auth=api_key)"

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

# 5. dry-run upload: CrisPRO defaults + platforms passthrough + per-platform contract
DRY=$(curl -sf -X POST "$BASE/api/upload" -H 'content-type: application/json' \
  -d '{"post":"smoke test post","dryRun":true,"platforms":["linkedin","twitter"]}') \
  || fail "dry-run unreachable"
jgrep "$DRY" '"dryRun":true' || fail "dryRun true"
jgrep "$DRY" '"organizationId":"107412290"' || fail "CrisPRO org default"
jgrep "$DRY" '"platforms":\["linkedin","twitter"\]' || fail "platforms passthrough"
jgrep "$DRY" '"resultContract"' || fail "per-platform results contract documented"
echo "PASS /api/upload dryRun (org=107412290, platforms echo, Track-A result contract)"

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
APPROVALS=$(curl -sf "$BASE/api/approvals")
jgrep "$APPROVALS" '"count":2' || fail "approvals list count=2"
echo "PASS HITL queue (park → approve=dry-run → reject → list)"

# 9. deterministic calendar (Track D)
CAL=$(curl -sf "$BASE/api/calendar?source=static")
jgrep "$CAL" '"deterministic":true' || fail "calendar deterministic"
jgrep "$CAL" '"horizonDays":14' || fail "calendar horizon"
node -e "const c=JSON.parse(process.argv[1]); if(!c.items.length) process.exit(1); c.items.forEach(i=>{if(!['linkedin','twitter'].includes(i.platform)) process.exit(1)})" "$CAL" \
  || fail "calendar items platforms"
echo "PASS /api/calendar (deterministic, 14-day, ranked)"

# 10. audit trail rows grew
tail -1 data/audit.log | grep -q '"evt"' || fail "audit log events"
echo "PASS audit trail (data/audit.log events appended)"

# 11. audit viewer endpoint
AUDIT=$(curl -sf "$BASE/api/audit?limit=50")
jgrep "$AUDIT" '"events":\[' || fail "audit endpoint events array"
node -e "const a=JSON.parse(process.argv[1]); if(!a.total) process.exit(1); if(a.events.length>a.total) process.exit(1)" "$AUDIT" \
  || fail "audit endpoint counts"
echo "PASS /api/audit (tail of data/audit.log)"

# 12. console FE serves the ops panels (approvals, calendar, audit, key, results)
HTML=$(curl -sf "$BASE/")
for id in approvalsPanel calendarPanel auditPanel apiKey resultsBox pLinkedin requireApproval sourceBadge; do
  echo "$HTML" | grep -q "id=\"$id\"" || fail "console HTML missing id=$id"
done
node -e "const h=require('fs').writeFileSync; void h; const s=process.argv[1]; new (class{constructor(){}});
// crude syntax gate: the inline script must parse as a script element body
const m=s.match(/<script>([\s\S]*)<\/script>/); if(!m) process.exit(1); new Function(m[1].replace(/await /g,'')) " "$HTML" \
  || fail "console inline script does not parse"
echo "PASS console FE (ops panels + key entry + results box present, script parses)"

echo "ALL BRIDGE SMOKE TESTS PASSED"
