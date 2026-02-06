# GDrive → YouTube Upload Script

Uploads MP4 videos from a Google Drive folder to YouTube (unlisted).

## Setup

### 1. Add YouTube scope to OAuth consent screen

1. Open: https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0767945907
2. Edit app → Scopes → Add scope
3. Add: `https://www.googleapis.com/auth/youtube.upload`
4. Save

### 2. Enable YouTube Data API v3

```bash
gcloud config set project gen-lang-client-0767945907
gcloud services enable youtube.googleapis.com
```

### 3. Install & auth

```bash
cd scripts/gdrive-to-youtube
npm install
npm run auth
```

Follow prompts: open URL, sign in, paste redirect URL.

### 4. Run upload

```bash
# Default: uses Lessons folder (1EI4okzmtKSGVjDOZCbkxOdfBszZi_OOl)
npm run upload

# Or specify folder:
GDRIVE_FOLDER_ID=YOUR_FOLDER_ID npm run upload
```

Output: `uploaded-videos.json` with `youtubeId` for each video. Use these in Hygraph.
