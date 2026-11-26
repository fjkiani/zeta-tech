#!/usr/bin/env bash
# Durable headless auth via NOTEBOOKLM_MASTER_TOKEN_JSON (Cursor secret-transport).
# Skip NOTEBOOKLM_AUTH_JSON — Cursor secret max length is 4096; storage_state is larger.
#
# Expected account: fjkiani1@gmail.com (Gemini Pro)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV="${PROJECT_ROOT}/.venv-notebooklm"
NLM="${SCRIPT_DIR}/notebooklm.sh"

export NOTEBOOKLM_ACCOUNT_EMAIL="${NOTEBOOKLM_ACCOUNT_EMAIL:-fjkiani1@gmail.com}"
export NOTEBOOKLM_PROFILE="${NOTEBOOKLM_PROFILE:-agent-cloud}"

PROFILE_DIR="${HOME}/.notebooklm/profiles/${NOTEBOOKLM_PROFILE}"
MASTER_PATH="${PROFILE_DIR}/master_token.json"

echo "=== NotebookLM master-token bootstrap ==="
echo "account=${NOTEBOOKLM_ACCOUNT_EMAIL} profile=${NOTEBOOKLM_PROFILE}"

if [[ -z "${NOTEBOOKLM_MASTER_TOKEN_JSON:-}" ]]; then
  echo "ERROR: NOTEBOOKLM_MASTER_TOKEN_JSON is not set in this process env." >&2
  echo "Add it on the Cloud Agent environment (not AUTH_JSON — too large for Cursor's 4096 limit)," >&2
  echo "then restart this agent so the secret injects. Do not paste the token into chat." >&2
  exit 2
fi

# Ensure headless extra is present
if [[ -x "${VENV}/bin/pip" ]]; then
  "${VENV}/bin/pip" install -q 'notebooklm-py[headless]'
else
  echo "WARN: venv missing at ${VENV}; installing…" >&2
  python3 -m venv "${VENV}"
  "${VENV}/bin/pip" install -q 'notebooklm-py[headless]'
fi

mkdir -p "${PROFILE_DIR}"
umask 077
# Write exact secret value; never echo it.
printf '%s' "${NOTEBOOKLM_MASTER_TOKEN_JSON}" > "${MASTER_PATH}"
chmod 0600 "${MASTER_PATH}"
# Drop from env after materializing to disk (package convention).
unset NOTEBOOKLM_MASTER_TOKEN_JSON

echo "wrote ${MASTER_PATH} (mode $(stat -c %a "${MASTER_PATH}"))"

export NOTEBOOKLM_PROFILE
"$NLM" auth refresh
"$NLM" auth check --test --json
"$NLM" usage --json --categories || true
echo "=== master-token bootstrap OK ==="
