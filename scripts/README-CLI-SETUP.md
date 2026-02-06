# Google Drive MCP — CLI Setup Guide

What can be done **100% locally via CLI** vs what needs a **one-time web step**.

---

## What Works 100% Via CLI

| Step | Command | Notes |
|:-----|:--------|:------|
| **Create project** | `gcloud projects create PROJECT_ID` | Full CLI |
| **Enable APIs** | `gcloud services enable drive.googleapis.com sheets.googleapis.com docs.googleapis.com` | Full CLI |
| **Create config dir** | `mkdir -p ~/.config/mcp-gdrive` | Full CLI |
| **Install MCP** | `npx -y @isaacphi/mcp-gdrive` | Full CLI |
| **Auth (interactive)** | Run MCP; browser opens once | CLI triggers; browser for Google sign-in |
| **Generate Cursor config** | Script outputs JSON snippet | Full CLI |
| **Create Drive folders** | `rclone` or custom script with Drive API | CLI if you have a service account |

---

## What Requires One-Time Web Step

| Step | Why | Where |
|:-----|:----|:------|
| **OAuth consent screen** | No stable `gcloud` equivalent for APIs & Services consent | [Console](https://console.cloud.google.com/apis/credentials/consent) |
| **OAuth 2.0 Client ID (Desktop)** | Credentials are created in Console; `gcloud iam oauth-clients` is for Workforce Identity (different flow) | [Console > Credentials](https://console.cloud.google.com/apis/credentials) |
| **Download credentials JSON** | One-time download from Console | After creating OAuth client |

---

## Quick CLI-Only Setup (Copy-Paste)

Run in terminal. Assumes `gcloud` is installed and you're logged in (`gcloud auth login`).

```bash
# 1. Set vars
export PROJECT_ID="high-school-portal"
export CONFIG_DIR="$HOME/.config/mcp-gdrive"

# 2. Create project (if new)
gcloud projects create $PROJECT_ID --name="High School Portal" 2>/dev/null || true
gcloud config set project $PROJECT_ID

# 3. Enable APIs
gcloud services enable drive.googleapis.com sheets.googleapis.com docs.googleapis.com

# 4. Create config dir
mkdir -p $CONFIG_DIR

# 5. OAuth — YOU MUST DO THIS IN BROWSER ONCE:
#    Open: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID
#    Create OAuth client ID (Desktop app) → Download JSON
#    Save as: $CONFIG_DIR/gcp-oauth.keys.json
#
echo "Download OAuth JSON from Console, save to $CONFIG_DIR/gcp-oauth.keys.json"
read -p "Press Enter when done..."

# 6. Extract credentials (if you have jq)
export CLIENT_ID=$(jq -r '.installed.client_id' $CONFIG_DIR/gcp-oauth.keys.json)
export CLIENT_SECRET=$(jq -r '.installed.client_secret' $CONFIG_DIR/gcp-oauth.keys.json)

# Or if JSON has "web" or different structure:
# export CLIENT_ID=$(jq -r '.web.client_id // .installed.client_id' $CONFIG_DIR/gcp-oauth.keys.json)
# export CLIENT_SECRET=$(jq -r '.web.client_secret // .installed.client_secret' $CONFIG_DIR/gcp-oauth.keys.json)

# 7. Add to Cursor mcp.json
echo "Add this to ~/.cursor/mcp.json under mcpServers:"
echo ""
cat << EOF
  "gdrive": {
    "command": "npx",
    "args": ["-y", "@isaacphi/mcp-gdrive"],
    "env": {
      "CLIENT_ID": "$CLIENT_ID",
      "CLIENT_SECRET": "$CLIENT_SECRET",
      "GDRIVE_CREDS_DIR": "$CONFIG_DIR"
    }
  }
EOF
```

---

## Run the Setup Script

```bash
chmod +x scripts/setup-gdrive-mcp-cli.sh
./scripts/setup-gdrive-mcp-cli.sh
```

The script will pause for you to download the OAuth JSON. After that, it generates the Cursor config snippet.

---

## Create Drive Folders Via CLI (Optional)

If you use a **service account** instead of OAuth for automation:

```bash
# Create service account
gcloud iam service-accounts create gdrive-mcp-sa \
  --display-name="GDrive MCP Service Account"

# Create key
gcloud iam service-accounts keys create $CONFIG_DIR/sa-key.json \
  --iam-account=gdrive-mcp-sa@$PROJECT_ID.iam.gserviceaccount.com
```

Then use the Drive API (e.g. with `rclone` or a small script) to create folders. **Note:** The MCP server uses OAuth (user context), not service accounts. Service accounts are for backend automation.

---

## Summary

| Fully CLI? | Step |
|:-----------|:-----|
| ✅ | Create project, enable APIs, config dir |
| ❌ | OAuth client + consent screen (one-time web) |
| ✅ | Install MCP, generate Cursor config |
| ✅ | Auth (CLI starts; browser opens once for Google login) |

**Minimum web:** One visit to Cloud Console to create the OAuth client and download JSON. Everything else can be done from the terminal.
