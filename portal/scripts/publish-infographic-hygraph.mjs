#!/usr/bin/env node
/**
 * Publish local NotebookLM Studio infographic.png to Hygraph NotebookBundle.
 * Uploads PNG as Asset, sets infographic + infographicUrl, publishes, proves HTTP 200.
 *
 * Usage:
 *   node portal/scripts/publish-infographic-hygraph.mjs \
 *     --artifacts portal/public/artifacts/python-datatypes-90150c \
 *     --slug nlm-python-datatypes-e2e \
 *     [--bundle-id cmwx8n51c151s07lmcbpno8qj]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZETA = path.resolve(__dirname, '../..');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const casproCandidates = [
  process.env.CASPRO_ROOT,
  path.resolve(ZETA, '../caspro'),
  '/agent/repos/caspro',
].filter(Boolean);
const caspro = casproCandidates.find((p) => fs.existsSync(path.join(p, '.env.local')));
if (caspro) loadEnvFile(path.join(caspro, '.env.local'));
loadEnvFile(path.join(ZETA, 'portal/.env.local'));

const ENDPOINT =
  process.env.HYGRAPH_ENDPOINT ||
  process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT ||
  process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT;
const TOKEN =
  process.env.GRAPHCMS_TOKEN ||
  process.env.HYGRAPH_TOKEN ||
  (fs.existsSync('/tmp/hygraph-crispro.token')
    ? fs.readFileSync('/tmp/hygraph-crispro.token', 'utf8').trim()
    : null);

if (!ENDPOINT || !TOKEN) {
  console.error('Missing HYGRAPH_ENDPOINT / token');
  process.exit(1);
}

const artifacts = path.resolve(
  arg('artifacts') || path.join(ZETA, 'portal/public/artifacts/python-datatypes-90150c'),
);
const slug = arg('slug') || 'nlm-python-datatypes-e2e';
const bundleIdArg = arg('bundle-id') || 'cmwx8n51c151s07lmcbpno8qj';
const png = path.join(artifacts, 'infographic.png');

if (!fs.existsSync(png)) {
  console.error(`Missing ${png} — generate with portal/scripts/generate-infographic.js first`);
  process.exit(2);
}
const st = fs.statSync(png);
if (st.size < 25 * 1024) {
  console.error(`Refusing tiny PNG (${st.size} bytes) — need real NotebookLM Studio output`);
  process.exit(3);
}

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    const err = new Error(json.errors.map((e) => e.message).join('; '));
    err.response = json;
    throw err;
  }
  return json.data;
}

async function uploadLocalPng(filePath) {
  const fileName = path.basename(filePath);
  const created = await gql(
    `mutation($fn: String!) {
      createAsset(data: { fileName: $fn }) {
        id
        upload {
          status
          error { code message }
          requestPostData {
            url
            date
            key
            signature
            algorithm
            policy
            credential
            securityToken
          }
        }
      }
    }`,
    { fn: fileName },
  );
  const asset = created.createAsset;
  const post = asset?.upload?.requestPostData;
  if (!post?.url) {
    throw new Error(`No upload URL from createAsset: ${JSON.stringify(asset?.upload)}`);
  }

  const form = new FormData();
  form.append('X-Amz-Date', post.date);
  form.append('key', post.key);
  form.append('X-Amz-Signature', post.signature);
  form.append('X-Amz-Algorithm', post.algorithm);
  form.append('policy', post.policy);
  form.append('X-Amz-Credential', post.credential);
  if (post.securityToken) form.append('X-Amz-Security-Token', post.securityToken);
  const buf = fs.readFileSync(filePath);
  form.append('file', new Blob([buf], { type: 'image/png' }), fileName);

  const up = await fetch(post.url, { method: 'POST', body: form });
  if (!up.ok) {
    const text = await up.text();
    throw new Error(`S3 upload failed ${up.status}: ${text.slice(0, 400)}`);
  }

  // Wait briefly for asset processing then publish
  let url = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await gql(
        `mutation($id: ID!) { publishAsset(where: { id: $id }, to: PUBLISHED) { id url } }`,
        { id: asset.id },
      );
    } catch {
      /* still processing */
    }
    const q = await gql(
      `query($id: ID!) {
        asset(where: { id: $id }, stage: DRAFT) { id url mimeType size width height }
        published: asset(where: { id: $id }, stage: PUBLISHED) { id url }
      }`,
      { id: asset.id },
    );
    url = q?.published?.url || q?.asset?.url || null;
    if (url && q?.asset?.size > 0) break;
  }
  if (!url) throw new Error(`Asset ${asset.id} never got a public URL`);
  return { id: asset.id, url };
}

async function resolveBundleId() {
  for (const stage of ['DRAFT', 'PUBLISHED']) {
    const byId = await gql(
      `query($id: ID!) { notebookBundle(where: { id: $id }, stage: ${stage}) { id slug } }`,
      { id: bundleIdArg },
    );
    if (byId?.notebookBundle?.id) return byId.notebookBundle.id;
  }
  for (const stage of ['DRAFT', 'PUBLISHED']) {
    const bySlug = await gql(
      `query($slug: String!) { notebookBundle(where: { slug: $slug }, stage: ${stage}) { id slug } }`,
      { slug },
    );
    if (bySlug?.notebookBundle?.id) return bySlug.notebookBundle.id;
  }
  throw new Error(`NotebookBundle not found id=${bundleIdArg} slug=${slug}`);
}

async function main() {
  console.log(`PNG ${st.size} bytes → Hygraph bundle ${slug} (${bundleIdArg})`);
  const asset = await uploadLocalPng(png);
  console.log(`Asset uploaded id=${asset.id} url=${asset.url}`);

  const bundleId = await resolveBundleId();
  await gql(
    `mutation($id: ID!, $url: String!, $assetId: ID!) {
      updateNotebookBundle(
        where: { id: $id }
        data: {
          infographicUrl: $url
          infographic: { connect: { id: $assetId } }
        }
      ) { id slug infographicUrl }
    }`,
    { id: bundleId, url: asset.url, assetId: asset.id },
  );

  await gql(
    `mutation($id: ID!) { publishNotebookBundle(where: { id: $id }, to: PUBLISHED) { id } }`,
    { id: bundleId },
  );

  // Also publish linked Post if present
  try {
    const postQ = await gql(
      `query($id: ID!) {
        notebookBundle(where: { id: $id }, stage: DRAFT) {
          post { id slug }
        }
      }`,
      { id: bundleId },
    );
    const postId = postQ?.notebookBundle?.post?.id;
    if (postId) {
      await gql(
        `mutation($id: ID!) { publishPost(where: { id: $id }, to: PUBLISHED) { id slug } }`,
        { id: postId },
      );
      console.log(`Published post ${postId}`);
    }
  } catch (e) {
    console.warn('Post publish skipped:', e.message);
  }

  const published = await gql(
    `query($id: ID!) {
      notebookBundle(where: { id: $id }, stage: PUBLISHED) {
        id slug infographicUrl
        infographic { id url mimeType size width height }
      }
    }`,
    { id: bundleId },
  );
  const url =
    published?.notebookBundle?.infographicUrl ||
    published?.notebookBundle?.infographic?.url ||
    asset.url;

  const probe = await fetch(url, { method: 'GET', redirect: 'follow' });
  const proof = {
    ok: probe.status === 200,
    status: probe.status,
    contentType: probe.headers.get('content-type'),
    contentLength: probe.headers.get('content-length'),
    url,
    bundleId,
    slug,
    assetId: asset.id,
    localBytes: st.size,
    published: published.notebookBundle,
  };
  console.log(JSON.stringify(proof, null, 2));
  if (probe.status !== 200) process.exit(5);
}

main().catch((err) => {
  console.error(err.message || err);
  if (err.response) console.error(JSON.stringify(err.response, null, 2));
  process.exit(1);
});
