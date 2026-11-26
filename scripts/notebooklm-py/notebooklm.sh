#!/usr/bin/env bash
# Wrapper for notebooklm CLI using the project venv.
# Auth (Gemini Pro, default fjkiani1@gmail.com):
#   1) Durable: NOTEBOOKLM_MASTER_TOKEN_JSON → profiles/<profile>/master_token.json
#      (run bootstrap-master-token.sh first; profile default agent-cloud)
#   2) Short-lived fallback: NOTEBOOKLM_AUTH_JSON (often too large for Cursor secrets)
#   3) On-disk storage_state.json after login / refresh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV="$PROJECT_ROOT/.venv-notebooklm"
BIN="$VENV/bin/notebooklm"

export NOTEBOOKLM_ACCOUNT_EMAIL="${NOTEBOOKLM_ACCOUNT_EMAIL:-fjkiani1@gmail.com}"

# Prefer durable headless profile when master-token material exists or is configured.
if [[ -z "${NOTEBOOKLM_PROFILE:-}" ]]; then
  if [[ -n "${NOTEBOOKLM_MASTER_TOKEN_JSON:-}" ]] \
    || [[ -f "${HOME}/.notebooklm/profiles/agent-cloud/master_token.json" ]]; then
    export NOTEBOOKLM_PROFILE=agent-cloud
  fi
fi

if [[ ! -x "$BIN" ]]; then
  echo "notebooklm CLI missing at $BIN" >&2
  echo "Install: python3 -m venv $VENV && $VENV/bin/pip install 'notebooklm-py[headless]'" >&2
  exit 127
fi

# Named profile when not using inline AUTH_JSON (CLI env-var auth takes precedence).
PROFILE_ARGS=()
if [[ -z "${NOTEBOOKLM_AUTH_JSON:-}" && -n "${NOTEBOOKLM_PROFILE:-}" ]]; then
  PROFILE_ARGS=(-p "$NOTEBOOKLM_PROFILE")
fi

exec "$BIN" "${PROFILE_ARGS[@]}" "$@"
