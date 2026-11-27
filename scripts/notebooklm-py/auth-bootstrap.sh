#!/usr/bin/env bash
# Non-interactive auth bootstrap for Gemini Pro NotebookLM.
# Preferred (durable): NOTEBOOKLM_MASTER_TOKEN_JSON → profile master_token.json
# Fallback (short-lived, often too large for Cursor secrets): NOTEBOOKLM_AUTH_JSON
# Expected account: fjkiani1@gmail.com (override with NOTEBOOKLM_ACCOUNT_EMAIL).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NLM="$SCRIPT_DIR/notebooklm.sh"
EMAIL="${NOTEBOOKLM_ACCOUNT_EMAIL:-fjkiani1@gmail.com}"

echo "=== NotebookLM auth bootstrap ==="
echo "Expected account: $EMAIL"

# Prefer durable master-token path (survives Cursor 4096 AUTH_JSON limit).
if [[ -n "${NOTEBOOKLM_MASTER_TOKEN_JSON:-}" ]]; then
  echo "NOTEBOOKLM_MASTER_TOKEN_JSON present — materializing profile master token."
  exec "$SCRIPT_DIR/bootstrap-master-token.sh"
fi

if [[ -n "${NOTEBOOKLM_AUTH_JSON:-}" ]]; then
  echo "NOTEBOOKLM_AUTH_JSON is set (inline auth — short-lived fallback)."
else
  echo "No NOTEBOOKLM_MASTER_TOKEN_JSON / NOTEBOOKLM_AUTH_JSON — using on-disk profile."
fi

if ! "$NLM" auth check --json; then
  echo ""
  echo "AUTH MISSING. Durable fix (recommended):"
  echo "  1) On a trusted laptop: notebooklm login --master-token --account $EMAIL"
  echo "  2) Set Cloud Agent secret NOTEBOOKLM_MASTER_TOKEN_JSON = contents of"
  echo "     ~/.notebooklm/profiles/<profile>/master_token.json"
  echo "  3) Restart agent; run: $SCRIPT_DIR/bootstrap-master-token.sh"
  echo "Skip NOTEBOOKLM_AUTH_JSON — Cursor secret max length is 4096."
  exit 1
fi

echo "Local auth material OK. Probing token + usage (Pro quota awareness)..."
"$NLM" auth check --test --passive --json || true
"$NLM" usage --json --categories || true
echo "=== bootstrap done ==="
