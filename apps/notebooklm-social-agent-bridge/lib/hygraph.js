/**
 * Optional live Hygraph lesson source for the bridge.
 *
 * The bridge ships with a static data/lessons.json (NotebookLM dumps). This
 * module lets /api/lessons read PUBLISHED VIDEO MediaItems straight from the
 * Hygraph Content API so the two stop drifting (handoff P1).
 *
 * Config (all optional — when absent, the bridge falls back to static lessons):
 *   HYGRAPH_URL or NEXT_PUBLIC_HYGRAPH_URL   e.g. https://api-us-west-2.hygraph.com/v2/<project>/master
 *   HYGRAPH_TOKEN or NEXT_PUBLIC_HYGRAPH_TOKEN  (not needed for public reads of PUBLISHED stage)
 *
 * Verified against the live schema (2026-11-26): MediaItem has pdfFile and
 * videoFile — NOT pdfDeck/onePager (those names were wrong in the docs and
 * broke the portal query; see zeta-tech commit ce990bd).
 */

const DEFAULT_TIMEOUT_MS = 8000;

export function getHygraphConfig() {
  return {
    url:
      process.env.HYGRAPH_URL ||
      process.env.NEXT_PUBLIC_HYGRAPH_URL ||
      null,
    token:
      process.env.HYGRAPH_TOKEN ||
      process.env.NEXT_PUBLIC_HYGRAPH_TOKEN ||
      null,
  };
}

export function isHygraphConfigured() {
  return Boolean(getHygraphConfig().url);
}

const LESSONS_QUERY = `
  query BridgeLessons {
    mediaItems(
      where: { type: VIDEO, isPublished: true }
      orderBy: createdAt_DESC
      first: 50
    ) {
      id
      slug
      title
      excerpt
      description { text }
      tags
      videoUrl
      videoFile { url fileName }
      pdfFile { url fileName }
      thumbnail { url }
      featuredImage { url }
      createdAt
      publishedAt
    }
  }
`;

/**
 * Fetch published VIDEO MediaItems and normalize to the bridge lesson shape.
 * Throws on any failure — callers decide whether to fall back to static.
 */
export async function fetchHygraphLessons() {
  const { url, token } = getHygraphConfig();
  if (!url) throw new Error("HYGRAPH_URL not configured");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query: LESSONS_QUERY }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Hygraph ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(`Hygraph GraphQL: ${errors[0].message}`);

  return (data?.mediaItems || []).map((m) => ({
    id: m.slug || m.id,
    hygraphId: m.id,
    title: m.title,
    excerpt: m.excerpt || m.description?.text || "",
    videoUrl: m.videoFile?.url || m.videoUrl || null,
    videoFileUrl: m.videoFile?.url || null,
    tags: Array.isArray(m.tags) ? m.tags : [],
    artifacts: [
      ...(m.pdfFile?.url ? [m.pdfFile.url] : []),
      ...(m.thumbnail?.url ? [m.thumbnail.url] : []),
      ...(m.featuredImage?.url ? [m.featuredImage.url] : []),
    ],
    source: "hygraph",
  }));
}
