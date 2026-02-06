#!/usr/bin/env bash
#
# Google Drive MCP — CLI Setup Script
# Run this locally to set up as much as possible via CLI.
#
# Prerequisites: gcloud CLI installed and logged in (gcloud auth login)
# One-time web step: OAuth consent + credentials (see notes below)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID="${GCP_PROJECT_ID:-high-school-portal}"
CONFIG_DIR="${GDRIVE_CREDS_DIR:-$HOME/.config/mcp-gdrive}"
REGION="us-central1"

echo "=== Google Drive MCP — CLI Setup ==="
echo "Project ID: $PROJECT_ID"
echo "Config dir: $CONFIG_DIR"
echo ""

# -----------------------------------------------------------------------------
# 1. Create Google Cloud project (if it doesn't exist)
# -----------------------------------------------------------------------------
echo "[1/6] Creating or using Google Cloud project..."
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
  echo "  Project $PROJECT_ID already exists."
else
  gcloud projects create "$PROJECT_ID" --name="High School Portal"
  echo "  Created project $PROJECT_ID"
fi

gcloud config set project "$PROJECT_ID"

# -----------------------------------------------------------------------------
# 2. Enable required APIs
# -----------------------------------------------------------------------------
echo ""
echo "[2/6] Enabling APIs..."
gcloud services enable \
  drive.googleapis.com \
  sheets.googleapis.com \
  docs.googleapis.com \
  --project="$PROJECT_ID"
echo "  Drive, Sheets, Docs APIs enabled."

# -----------------------------------------------------------------------------
# 3. Create config directory
# -----------------------------------------------------------------------------
echo ""
echo "[3/6] Creating config directory..."
mkdir -p "$CONFIG_DIR"
echo "  Config dir: $CONFIG_DIR"

# -----------------------------------------------------------------------------
# 4. OAuth credentials — requires one-time web step
# -----------------------------------------------------------------------------
echo ""
echo "[4/6] OAuth credentials..."
echo ""
echo "  ⚠️  OAuth Client ID cannot be created purely via gcloud."
echo "  You must do this ONCE in the web console:"
echo ""
echo "  1. Open: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "  2. Configure OAuth consent screen (if not done):"
echo "     - APIs & Services > OAuth consent screen"
echo "     - User type: Internal (or External for any Google account)"
echo "     - Add scopes: drive.readonly, spreadsheets"
echo "  3. Create credentials > OAuth client ID"
echo "     - Application type: Desktop app"
echo "     - Name: GDrive MCP"
echo "  4. Download JSON and save as:"
echo "     $CONFIG_DIR/gcp-oauth.keys.json"
echo ""
read -p "  Press Enter after you've downloaded the JSON, or Ctrl+C to exit..."

if [[ ! -f "$CONFIG_DIR/gcp-oauth.keys.json" ]]; then
  echo "  ERROR: $CONFIG_DIR/gcp-oauth.keys.json not found."
  echo "  Please download the OAuth client JSON and place it there."
  exit 1
fi

# Extract client_id and client_secret (Desktop app uses "installed")
if command -v jq &>/dev/null; then
  CLIENT_ID=$(jq -r '.installed.client_id // .web.client_id // empty' "$CONFIG_DIR/gcp-oauth.keys.json")
  CLIENT_SECRET=$(jq -r '.installed.client_secret // .web.client_secret // empty' "$CONFIG_DIR/gcp-oauth.keys.json")
else
  CLIENT_ID=$(grep -oE '"client_id"[[:space:]]*:[[:space:]]*"[^"]+"' "$CONFIG_DIR/gcp-oauth.keys.json" | head -1 | cut -d'"' -f4)
  CLIENT_SECRET=$(grep -oE '"client_secret"[[:space:]]*:[[:space:]]*"[^"]+"' "$CONFIG_DIR/gcp-oauth.keys.json" | head -1 | cut -d'"' -f4)
fi

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "  ERROR: Could not extract client_id or client_secret from JSON."
  exit 1
fi

echo "  Found client_id and client_secret."

# -----------------------------------------------------------------------------
# 5. Run MCP auth (one-time browser flow)
# -----------------------------------------------------------------------------
echo ""
echo "[5/6] Running GDrive MCP authentication..."
echo "  A browser will open for Google sign-in. Complete the flow."
echo ""

# Run npx to trigger auth; the package will use GDRIVE_CREDS_DIR
export GDRIVE_CREDS_DIR="$CONFIG_DIR"
export CLIENT_ID
export CLIENT_SECRET

# Create a minimal wrapper to pass credentials - mcp-gdrive expects them
# The package uses process.env.CLIENT_ID, CLIENT_SECRET, GDRIVE_CREDS_DIR
npx -y @isaacphi/mcp-gdrive 2>/dev/null || true

# Alternative: if the package has an auth command
# npx -y @isaacphi/mcp-gdrive auth 2>/dev/null || true

echo "  If auth completed, credentials are in $CONFIG_DIR"

# -----------------------------------------------------------------------------
# 6. Generate Cursor MCP config snippet
# -----------------------------------------------------------------------------
echo ""
echo "[6/6] Generating Cursor MCP config..."
CURSOR_MCP_SNIPPET="$CONFIG_DIR/cursor-mcp-snippet.json"
cat > "$CURSOR_MCP_SNIPPET" << EOF
{
  "gdrive": {
    "command": "npx",
    "args": ["-y", "@isaacphi/mcp-gdrive"],
    "env": {
      "CLIENT_ID": "$CLIENT_ID",
      "CLIENT_SECRET": "$CLIENT_SECRET",
      "GDRIVE_CREDS_DIR": "$CONFIG_DIR"
    }
  }
}
EOF
echo "  Config snippet saved to: $CURSOR_MCP_SNIPPET"
echo ""
echo "  Add the 'gdrive' entry to ~/.cursor/mcp.json under mcpServers."
echo ""

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Add the gdrive config to ~/.cursor/mcp.json (see $CURSOR_MCP_SNIPPET)"
echo "  2. Restart Cursor"
echo "  3. Create a folder in Google Drive and upload your videos/docs"
echo ""
