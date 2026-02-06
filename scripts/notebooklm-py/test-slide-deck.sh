#!/usr/bin/env bash
# Test: create notebook, add source, generate slide deck, download
# Prerequisite: run 'notebooklm login' first and complete Google sign-in
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
NBOOKLM="$PROJECT_ROOT/scripts/notebooklm-py/notebooklm.sh"
SOURCE="$PROJECT_ROOT/Bronx-HS-Medical-Science/week0.5-lesson-plan.md"
OUTPUT_DIR="$SCRIPT_DIR/output"
mkdir -p "$OUTPUT_DIR"

echo "=== NotebookLM Slide Deck Test ==="
echo ""

echo "1. Creating notebook..."
CREATE_OUT=$("$NBOOKLM" create "High School Slide Test" 2>&1)
echo "$CREATE_OUT"
NB_ID=$(echo "$CREATE_OUT" | grep -oE 'nb[a-zA-Z0-9_-]+' | head -1)
if [ -z "$NB_ID" ]; then
  NB_ID=$(echo "$CREATE_OUT" | grep -oE '[a-zA-Z0-9_-]{15,}' | head -1)
fi

if [ -z "$NB_ID" ]; then
  echo "Failed to get notebook ID. Make sure you've run: notebooklm login"
  exit 1
fi

echo ""
echo "2. Setting active notebook: $NB_ID"
"$NBOOKLM" use "$NB_ID"

echo ""
echo "3. Adding source: $SOURCE"
"$NBOOKLM" source add "$SOURCE"

echo ""
echo "4. Generating slide deck (this may take a few minutes)..."
"$NBOOKLM" generate slide-deck "Key concepts for students" --wait

echo ""
echo "5. Downloading to $OUTPUT_DIR/..."
"$NBOOKLM" download slide-deck "$OUTPUT_DIR" --latest --force

echo ""
echo "Done! Check: $OUTPUT_DIR"
