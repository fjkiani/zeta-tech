#!/usr/bin/env bash
# Wrapper for notebooklm CLI using the project venv
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV="$PROJECT_ROOT/.venv-notebooklm"
exec "$VENV/bin/notebooklm" "$@"
