#!/usr/bin/env bash
# Wrapper for notebooklm CLI using the project venv.
# Auth: Gemini Pro account (default fjkiani1@gmail.com) via
#   - NOTEBOOKLM_AUTH_JSON (inline Playwright storage_state / cookies), or
#   - ~/.notebooklm/profiles/<profile>/storage_state.json after `login`
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV="$PROJECT_ROOT/.venv-notebooklm"
BIN="$VENV/bin/notebooklm"

export NOTEBOOKLM_ACCOUNT_EMAIL="${NOTEBOOKLM_ACCOUNT_EMAIL:-fjkiani1@gmail.com}"

if [[ ! -x "$BIN" ]]; then
  echo "notebooklm CLI missing at $BIN" >&2
  echo "Install: python3 -m venv $VENV && $VENV/bin/pip install notebooklm" >&2
  exit 127
fi

# Prefer named profile when cookies live on disk (multi-account safe).
# Env-var auth (NOTEBOOKLM_AUTH_JSON) takes precedence inside the CLI itself.
PROFILE_ARGS=()
if [[ -z "${NOTEBOOKLM_AUTH_JSON:-}" && -n "${NOTEBOOKLM_PROFILE:-}" ]]; then
  PROFILE_ARGS=(-p "$NOTEBOOKLM_PROFILE")
fi

exec "$BIN" "${PROFILE_ARGS[@]}" "$@"
