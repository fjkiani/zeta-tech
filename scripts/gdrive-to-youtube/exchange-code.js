#!/usr/bin/env node
/**
 * Exchange an auth code for tokens (when you have the redirect URL from the browser)
 * Usage: node exchange-code.js "http://localhost/?code=..."
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDS_PATH = process.env.GDRIVE_CREDS_DIR || path.join(process.env.HOME || '', '.config/mcp-gdrive');
const TOKENS_PATH = path.join(CREDS_PATH, 'token.json');
const KEYS_PATH = path.join(CREDS_PATH, 'gcp-oauth.keys.json');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node exchange-code.js "http://localhost/?code=..."');
  process.exit(1);
}

const url = input.startsWith('http') ? new URL(input) : new URL('http://localhost/?' + input);
const code = url.searchParams.get('code');
if (!code) {
  console.error('No code found in URL');
  process.exit(1);
}

const keys = JSON.parse(readFileSync(KEYS_PATH, 'utf8'));
const { client_id, client_secret, redirect_uris } = keys.installed || keys.web;
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const { tokens } = await oauth2Client.getToken(code);
writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
console.log('Token saved to:', TOKENS_PATH);
