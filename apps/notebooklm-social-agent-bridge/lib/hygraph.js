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
      videoFile { url fileName mimeType size }
      pdfFile { url fileName }
      thumbnail { url fileName }
      featuredImage { url fileName }
      createdAt
      publishedAt
      type
      category { id title slug }
    }
  }
`;

/** Classify Hygraph asset URLs by fileName when the CDN path has no extension. */
function assetKind(fileName, url) {
  const name = String(fileName || "");
  const u = String(url || "");
  if (/\.pdf(\.pdf)?$/i.test(name) || /\.pdf(\?|$)/i.test(u)) return "pdf";
  if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(name) || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(u)) {
    return "image";
  }
  return "other";
}

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

  return (data?.mediaItems || []).map((m) => {
    const videoFileUrl = m.videoFile?.url || null;
    const externalVideoUrl =
      m.videoUrl && m.videoUrl !== videoFileUrl ? m.videoUrl : null;

    const thumbUrl = m.thumbnail?.url || null;
    const featuredUrl = m.featuredImage?.url || null;
    const thumbName = m.thumbnail?.fileName || null;
    const featuredName = m.featuredImage?.fileName || null;
    const pdfFileUrl = m.pdfFile?.url || null;

    // featuredImage may actually be a PDF deck (glassbox-ai); classify by fileName.
    const pdfUrls = [
      ...(pdfFileUrl ? [pdfFileUrl] : []),
      ...(featuredUrl && assetKind(featuredName, featuredUrl) === "pdf"
        ? [featuredUrl]
        : []),
    ];
    const imageUrls = [
      ...(thumbUrl ? [thumbUrl] : []),
      ...(featuredUrl && assetKind(featuredName, featuredUrl) === "image"
        ? [featuredUrl]
        : []),
    ];

    return {
      id: m.slug || m.id,
      hygraphId: m.id,
      title: m.title,
      excerpt: m.excerpt || m.description?.text || "",
      descriptionText: m.description?.text || "",
      // Prefer CDN/binary mp4 for social; keep NotebookLM/external URL separate.
      videoUrl: videoFileUrl || m.videoUrl || null,
      videoFileUrl,
      externalVideoUrl,
      videoFileName: m.videoFile?.fileName || null,
      videoMimeType: m.videoFile?.mimeType || null,
      videoSize: m.videoFile?.size ?? null,
      pdfUrl: pdfUrls[0] || null,
      thumbnailUrl: thumbUrl,
      thumbnailFileName: thumbName,
      featuredImageUrl: featuredUrl,
      featuredImageFileName: featuredName,
      tags: Array.isArray(m.tags) ? m.tags : [],
      type: m.type || "VIDEO",
      category: m.category?.title || m.category?.slug || null,
      createdAt: m.createdAt || null,
      publishedAt: m.publishedAt || null,
      artifacts: [
        ...pdfUrls,
        ...imageUrls,
        // Keep untyped featured/thumb URLs so nothing is dropped.
        ...(featuredUrl && !pdfUrls.includes(featuredUrl) && !imageUrls.includes(featuredUrl)
          ? [featuredUrl]
          : []),
      ],
      artifactFiles: [
        ...(pdfFileUrl
          ? [{ role: "pdfFile", url: pdfFileUrl, fileName: m.pdfFile?.fileName || null }]
          : []),
        ...(thumbUrl
          ? [{ role: "thumbnail", url: thumbUrl, fileName: thumbName }]
          : []),
        ...(featuredUrl
          ? [{ role: "featuredImage", url: featuredUrl, fileName: featuredName }]
          : []),
      ],
      source: "hygraph",
    };
  });
}
