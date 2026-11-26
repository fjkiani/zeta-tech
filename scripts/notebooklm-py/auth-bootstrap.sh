#!/usr/bin/env bash
# Non-interactive auth bootstrap for Gemini Pro NotebookLM.
# Expected account: fjkiani1@gmail.com (override with NOTEBOOKLM_ACCOUNT_EMAIL).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NLM="$SCRIPT_DIR/notebooklm.sh"
EMAIL="${NOTEBOOKLM_ACCOUNT_EMAIL:-fjkiani1@gmail.com}"

echo "=== NotebookLM auth bootstrap ==="
echo "Expected account: $EMAIL"

if [[ -n "${NOTEBOOKLM_AUTH_JSON:-}" ]]; then
  echo "NOTEBOOKLM_AUTH_JSON is set (inline auth)."
else
  echo "NOTEBOOKLM_AUTH_JSON unset — using ~/.notebooklm profile storage."
fi

if ! "$NLM" auth check --json; then
  echo ""
  echo "AUTH MISSING. One human click required:"
  echo "  1) On a machine with a browser, sign into Google as $EMAIL"
  echo "  2) Run: $NLM login"
  echo "     or:  $NLM auth import-cookies /path/to/storage_state.json"
  echo "  3) Prefer CI/cloud: set secret NOTEBOOKLM_AUTH_JSON to that JSON"
  echo "  4) Re-run this script"
  exit 1
fi

echo "Local auth material OK. Probing token + usage (Pro quota awareness)..."
"$NLM" auth check --test --passive --json || true
"$NLM" usage --json --categories || true
echo "=== bootstrap done ==="
