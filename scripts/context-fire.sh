#!/bin/bash
set -e

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
NOTEBOOKLM_BIN="$PROJECT_ROOT/scripts/notebooklm-py/notebooklm.sh"
SOURCE_FILE="$PROJECT_ROOT/Bushwick-HS/context/python-datatypes.md"
ARTIFACT_DIR="$PROJECT_ROOT/portal/public/artifacts/python-intro"

echo "🔥 Initiating Live Fire Test..."

# 0. Cleanup
mkdir -p "$ARTIFACT_DIR"

# 1. Create Notebook
echo "Creating Notebook 'Iron School Test Fire'..."
TITLE="Iron School Test Fire $(date +%s)"
OUTPUT=$("$NOTEBOOKLM_BIN" create "$TITLE")
NOTEBOOK_ID=$(echo "$OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -n1)

if [ -z "$NOTEBOOK_ID" ]; then
  echo "❌ Failed to create notebook. Output: $OUTPUT"
  exit 1
fi
echo "✅ Notebook Created: $NOTEBOOK_ID"

# 2. Add Source
echo "Adding Source: $SOURCE_FILE..."
"$NOTEBOOKLM_BIN" use "$NOTEBOOK_ID"
"$NOTEBOOKLM_BIN" source add "$SOURCE_FILE"
echo "✅ Source Added."

# 3. Generate Quiz
echo "Generating Quiz (this may take time)..."
"$NOTEBOOKLM_BIN" generate quiz --wait
echo "✅ Quiz Generated."

# 4. Download
echo "Downloading Quiz..."
"$NOTEBOOKLM_BIN" download quiz "$ARTIFACT_DIR/quiz.json" --format json
echo "✅ Downloaded to $ARTIFACT_DIR/quiz.json"

echo "🔥 Test Fire Complete! Weapon is functional."
ls -l "$ARTIFACT_DIR/quiz.json"
