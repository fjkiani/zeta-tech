#!/usr/bin/env node
/**
 * One-time auth for Drive + YouTube APIs.
 * Opens browser for Google sign-in. Paste the code from redirect URL.
 *
 * Prerequisites: Add scope "YouTube Data API v3" to OAuth consent screen.
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = process.env.GDRIVE_CREDS_DIR || path.join(process.env.HOME || '', '.config/mcp-gdrive');
const TOKENS_PATH = path.join(CREDS_PATH, 'token.json');
const KEYS_PATH = path.join(CREDS_PATH, 'gcp-oauth.keys.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
];

async function main() {
  const keys = JSON.parse(readFileSync(KEYS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = keys.installed || keys.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Sign in, approve access.');
  console.log('3. You will be redirected to a blank/cannot connect page.');
  console.log('4. Copy the FULL URL from the address bar (it contains code=...)');
  console.log('\nPaste the full redirect URL here:');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const input = await new Promise((r) => rl.question('> ', r));
  rl.close();

  const code = new URL(input.trim()).searchParams.get('code');
  if (!code) {
    console.error('Could not find "code" in URL. Paste the full redirect URL.');
    process.exit(1);
  }

  const { tokens } = await oauth2Client.getToken(code);
  writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  console.log('\nToken saved to:', TOKENS_PATH);
}

main().catch(console.error);
