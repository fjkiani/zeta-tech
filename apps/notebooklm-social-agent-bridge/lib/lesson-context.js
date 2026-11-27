/**
 * Read-only lesson context pack for GTM / caption prompts.
 *
 * Assembles ONLY facts present on the lesson object, local transcript/context
 * files, or Hygraph read fields. Never invents clinical claims, metrics, or
 * missing copy. Media URLs are always surfaced explicitly when present.
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_TRANSCRIPT_CHARS = 1800;

function cleanText(value, maxChars) {
  if (value == null) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (maxChars && text.length > maxChars) {
    return `${text.slice(0, maxChars)}…`;
  }
  return text;
}

function uniqUrls(urls) {
  const out = [];
  const seen = new Set();
  for (const u of urls) {
    if (!u || typeof u !== "string") continue;
    const t = u.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function looksLikeNotebookLm(url) {
  const h = hostOf(url) || "";
  return (
    h.includes("notebooklm") ||
    h.includes("googleusercontent.com") ||
    /\/notebooklm\//i.test(url || "")
  );
}

function readRelText(dataDir, rel, maxChars = DEFAULT_TRANSCRIPT_CHARS) {
  if (!dataDir || !rel) return "";
  const p = path.join(dataDir, rel);
  if (!fs.existsSync(p)) return "";
  try {
    return cleanText(fs.readFileSync(p, "utf8"), maxChars);
  } catch {
    return "";
  }
}

/**
 * Infer provenance labels from evidence only (no invented production story).
 * @param {object} lesson
 * @param {{ videoFileUrl?: string|null, externalVideoUrl?: string|null }} media
 */
export function inferProvenance(lesson, media = {}) {
  const inputs = [];
  const notes = [];

  if (lesson.hygraphId || lesson.source === "hygraph") {
    notes.push("Hygraph MediaItem (type VIDEO, PUBLISHED)");
  }
  if (lesson.source === "static" || lesson.transcriptFile || lesson.contextFile) {
    notes.push("Bridge static lesson dump (NotebookLM classroom artifacts)");
  }

  const external = media.externalVideoUrl || null;
  if (external && looksLikeNotebookLm(external)) {
    notes.push(
      `External videoUrl host looks like NotebookLM/Google (${hostOf(external)})`,
    );
    inputs.push({ kind: "notebooklm_video_url", url: external });
  } else if (external) {
    notes.push(`External videoUrl present (${hostOf(external) || "unknown host"})`);
    inputs.push({ kind: "external_video_url", url: external });
  }

  if (media.videoFileUrl) {
    inputs.push({
      kind: "hygraph_video_file",
      url: media.videoFileUrl,
      fileName: lesson.videoFileName || null,
      mimeType: lesson.videoMimeType || null,
    });
  }
  if (lesson.transcriptFile) {
    inputs.push({ kind: "transcript_file", path: lesson.transcriptFile });
  }
  if (lesson.contextFile) {
    inputs.push({ kind: "context_file", path: lesson.contextFile });
  }
  if (Array.isArray(lesson.tags) && lesson.tags.length) {
    inputs.push({ kind: "tags", tags: lesson.tags });
  }
  for (const a of lesson.artifacts || []) {
    if (typeof a === "string" && a.startsWith("http")) {
      inputs.push({ kind: "artifact_url", url: a });
    } else if (a && typeof a === "object" && a.url) {
      inputs.push({ kind: "artifact_url", url: a.url, label: a.name || a.type || null });
    }
  }

  return {
    source: lesson.source || (lesson.hygraphId ? "hygraph" : "static"),
    hygraphId: lesson.hygraphId || null,
    producedHow: notes.length ? notes : ["unknown — only listed fields available"],
    inputs,
  };
}

/**
 * Build a read-only context pack for one lesson.
 *
 * @param {object} lesson  Bridge lesson shape (static and/or Hygraph-normalized)
 * @param {{ dataDir?: string, transcriptChars?: number }} [opts]
 */
export function buildLessonContextPack(lesson, opts = {}) {
  if (!lesson || typeof lesson !== "object") {
    throw new Error("lesson required");
  }

  const dataDir = opts.dataDir || null;
  const transcriptChars = opts.transcriptChars ?? DEFAULT_TRANSCRIPT_CHARS;

  const videoFileUrl = lesson.videoFileUrl || null;
  // Prefer binary/CDN mp4 for social; keep original Hygraph videoUrl when distinct.
  const socialVideoUrl = videoFileUrl || lesson.videoUrl || null;
  const externalVideoUrl =
    lesson.externalVideoUrl ||
    (lesson.videoUrl &&
    videoFileUrl &&
    lesson.videoUrl !== videoFileUrl
      ? lesson.videoUrl
      : lesson.externalVideoUrl) ||
    null;

  const artifactList = Array.isArray(lesson.artifacts) ? lesson.artifacts : [];
  const artifactUrls = uniqUrls(
    artifactList.map((a) => (typeof a === "string" ? a : a?.url)).filter(Boolean),
  );

  const imageUrls = uniqUrls([
    lesson.thumbnailUrl || null,
    lesson.featuredImageUrl || null,
    ...artifactUrls.filter((u) => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(u)),
  ]);
  const pdfUrls = uniqUrls([
    lesson.pdfUrl || null,
    ...artifactUrls.filter((u) => /\.pdf(\?|$)/i.test(u)),
  ]);

  const excerpt = cleanText(
    lesson.excerpt || lesson.description || lesson.descriptionText || "",
    transcriptChars,
  );
  const transcriptFromFile = readRelText(
    dataDir,
    lesson.transcriptFile,
    transcriptChars,
  );
  const contextFromFile = readRelText(dataDir, lesson.contextFile, transcriptChars);
  const transcriptInline = cleanText(lesson.transcript, transcriptChars);
  const contextInline = cleanText(lesson.context, transcriptChars);

  const transcriptExcerpt =
    transcriptFromFile || transcriptInline || contextFromFile || contextInline || "";

  const media = {
    videoUrl: socialVideoUrl,
    videoFileUrl,
    externalVideoUrl:
      externalVideoUrl && externalVideoUrl !== socialVideoUrl
        ? externalVideoUrl
        : null,
    videoFileName: lesson.videoFileName || null,
    videoMimeType: lesson.videoMimeType || null,
    videoSize: lesson.videoSize ?? null,
    imageUrls,
    pdfUrls,
    artifactUrls,
  };

  const provenance = inferProvenance(lesson, media);

  const gaps = [];
  if (!excerpt && !transcriptExcerpt) gaps.push("no_excerpt_or_transcript");
  if (!socialVideoUrl) gaps.push("no_video_url");
  if (!imageUrls.length && !pdfUrls.length && !artifactUrls.length) {
    gaps.push("no_image_or_pdf_artifacts");
  }

  return {
    lessonId: lesson.id,
    title: lesson.title || lesson.id,
    tags: Array.isArray(lesson.tags) ? lesson.tags : [],
    excerpt,
    transcriptExcerpt,
    media,
    provenance,
    hygraph: {
      id: lesson.hygraphId || null,
      slug: lesson.id || null,
      createdAt: lesson.createdAt || null,
      publishedAt: lesson.publishedAt || null,
      category: lesson.category || null,
      type: lesson.type || (lesson.hygraphId ? "VIDEO" : null),
    },
    gaps,
    readOnly: true,
  };
}

/**
 * Format a context pack into prompt lines. Video/image URLs are never omitted
 * when present — the caption model must see them as media to reference.
 */
export function formatContextPackForPrompt(pack, { platform } = {}) {
  const lines = [];
  lines.push(`lessonId=${pack.lessonId}`);
  lines.push(`title=${JSON.stringify(pack.title)}`);
  if (platform) lines.push(`platform=${platform}`);
  if (pack.tags?.length) lines.push(`tags=${pack.tags.join(",")}`);

  const m = pack.media || {};
  if (m.videoUrl) {
    lines.push(`MEDIA_VIDEO_URL (must reference in caption): ${m.videoUrl}`);
  } else {
    lines.push("MEDIA_VIDEO_URL: (none)");
  }
  if (m.videoFileUrl && m.videoFileUrl !== m.videoUrl) {
    lines.push(`MEDIA_VIDEO_FILE_URL: ${m.videoFileUrl}`);
  }
  if (m.videoFileName) {
    lines.push(
      `videoFileName=${m.videoFileName}${m.videoMimeType ? ` mime=${m.videoMimeType}` : ""}`,
    );
  }
  if (m.externalVideoUrl) {
    lines.push(`EXTERNAL_OR_NOTEBOOKLM_VIDEO_URL (provenance): ${m.externalVideoUrl}`);
  }
  if (m.imageUrls?.length) {
    lines.push(`MEDIA_IMAGE_URLS: ${m.imageUrls.join(" | ")}`);
  }
  if (m.pdfUrls?.length) {
    lines.push(`MEDIA_PDF_URLS: ${m.pdfUrls.join(" | ")}`);
  }
  if (m.artifactUrls?.length) {
    lines.push(`ARTIFACT_URLS: ${m.artifactUrls.join(" | ")}`);
  }

  const proven = pack.provenance || {};
  lines.push(`provenance.source=${proven.source || "unknown"}`);
  if (proven.hygraphId) lines.push(`provenance.hygraphId=${proven.hygraphId}`);
  for (const note of proven.producedHow || []) {
    lines.push(`provenance.note: ${note}`);
  }
  if (proven.inputs?.length) {
    lines.push(
      `provenance.inputs: ${proven.inputs
        .map((i) => {
          if (i.kind === "tags") return `tags[${(i.tags || []).join(",")}]`;
          if (i.path) return `${i.kind}:${i.path}`;
          if (i.fileName) return `${i.kind}:${i.fileName}`;
          if (i.url) return `${i.kind}:${i.url}`;
          return i.kind;
        })
        .join("; ")}`,
    );
  }

  if (pack.hygraph?.createdAt || pack.hygraph?.publishedAt) {
    lines.push(
      `hygraph.dates createdAt=${pack.hygraph.createdAt || "?"} publishedAt=${pack.hygraph.publishedAt || "?"}`,
    );
  }

  if (pack.excerpt) {
    lines.push(`excerpt: ${pack.excerpt}`);
  } else {
    lines.push("excerpt: (none — do not invent)");
  }
  if (pack.transcriptExcerpt) {
    lines.push(`transcript_or_context_excerpt: ${pack.transcriptExcerpt}`);
  } else {
    lines.push("transcript_or_context_excerpt: (none — do not invent)");
  }
  if (pack.gaps?.length) {
    lines.push(`gaps: ${pack.gaps.join(", ")}`);
  }
  return lines.join("\n");
}

/**
 * Deterministic grounded caption for dry-run when LLM is unavailable.
 * Uses only pack fields — cites media URLs explicitly; invents nothing.
 */
export function groundedDryRunCaption(pack, { platform = "linkedin" } = {}) {
  const title = pack.title || pack.lessonId;
  const video = pack.media?.videoUrl || null;
  const fileName = pack.media?.videoFileName || null;
  const tags = (pack.tags || []).map((t) => `#${String(t).replace(/\s+/g, "")}`);
  const excerpt = pack.excerpt || pack.transcriptExcerpt || "";
  const body = excerpt
    ? excerpt.slice(0, platform === "twitter" ? 180 : 360)
    : null;

  const parts = [];
  if (platform === "twitter") {
    parts.push(`${title}`);
  } else {
    parts.push(`From Zeta Tech / CrisPRO classroom: ${title}`);
  }

  if (body) {
    parts.push(body.endsWith("…") || body.endsWith(".") ? body : `${body}…`);
  } else {
    parts.push(
      "Grounded from available metadata only (no transcript/excerpt on record).",
    );
  }

  if (video) {
    const label = fileName ? `Video (${fileName})` : "Video";
    parts.push(`${label}: ${video}`);
  }
  if (pack.media?.imageUrls?.[0]) {
    parts.push(`Image: ${pack.media.imageUrls[0]}`);
  }

  const provenanceBits = (pack.provenance?.producedHow || []).slice(0, 2);
  if (provenanceBits.length) {
    parts.push(`Source: ${provenanceBits.join("; ")}`);
  }

  if (tags.length) parts.push(tags.join(" "));
  else if (platform !== "twitter") parts.push("#CrisPRO #PrecisionOncology #ZetaTech");

  return parts.join(platform === "twitter" ? "\n" : "\n\n");
}
