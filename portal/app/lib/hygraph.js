
import fetch from 'node-fetch'; // Ensure fetch is available in Node scripts

// ISO-8601: Logic to load Env Vars if running in standalone script (not Next.js)
if (typeof process !== 'undefined') {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.resolve(process.cwd(), '.env.local'); // Assuming run from portal root
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
          const val = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (!key.startsWith('#')) {
            process.env[key.trim()] = val;
          }
        }
      });
      console.log("   ✅ [.env.local] Loaded successfully into script context.");
    }
  } catch (e) {
    // Ignore errors (browser env)
  }
}

const HYGRAPH_URL = process.env.NEXT_PUBLIC_HYGRAPH_URL;
const HYGRAPH_TOKEN = process.env.NEXT_PUBLIC_HYGRAPH_TOKEN;

/** Safe fields: no lessonDate/schools (schema migration pending). */
const FIELDS_SAFE = `
  id
  title
  slug
  excerpt
  videoUrl
  tags
  description { raw }
  pdfDeck { url fileName }
  onePager { url fileName }
  videoFile { url fileName }
`;

/** Same as FIELDS_SAFE + lessonPlan (raw markdown). Use when schema has lessonPlan field. */
const FIELDS_WITH_LESSON_PLAN = `${FIELDS_SAFE}
  lessonPlan
`;

/** Map Hygraph enum value → canonical school key (for grouping in LessonsList) */
const ENUM_TO_SCHOOL = {
  BRONX_MEDICAL: 'bronx_medical',
  AVIATION: 'aviation',
  BUSHWICK: 'bushwick',
  BROOKLYN_LAW: 'brooklyn_law',
  BK_LAW_TECH: 'brooklyn_law',
  BROOKLYN_LAW_TECH: 'brooklyn_law',
  QUEENS: 'queens',
  // Add new schools here when you add enum values in Hygraph
};

/** Map canonical school key → array of Hygraph enum values (for filtering) */
const SCHOOL_TO_ENUMS = {
  bronx_medical: ['BRONX_MEDICAL'],
  aviation: ['AVIATION'],
  bushwick: ['BUSHWICK'],
  brooklyn_law: ['BROOKLYN_LAW', 'BK_LAW_TECH', 'BROOKLYN_LAW_TECH'],
  queens: ['QUEENS'],
};

function buildMediaItemsWhere(schoolKey) {
  const base = { type: 'VIDEO' };
  if (schoolKey && schoolKey !== 'all') {
    const enumVals = SCHOOL_TO_ENUMS[schoolKey];
    if (enumVals?.length) {
      base.schools = { contains_some: enumVals };
    }
  }
  return base;
}

const MEDIA_ITEM_BY_ID_QUERY = (fields) => `
  query GetMediaItemById($id: ID!) {
    mediaItem(stage: PUBLISHED, where: { id: $id }) {
      ${fields}
    }
  }
`;

const MEDIA_ITEM_BY_SLUG_QUERY = (fields) => `
  query GetMediaItemBySlug($slug: String!) {
    mediaItems(stage: PUBLISHED, where: { slug: $slug, type: VIDEO }, first: 1) {
      ${fields}
    }
  }
`;

export async function fetchLessons(schoolKey = 'all') {
  if (!HYGRAPH_URL) {
    return [];
  }
  // Schema migration for lessonDate/schools is pending (HYGRAPH-SCHEMA-MIGRATION.md).
  // Using tag-based filtering until migration is applied.
  return fetchLessonsWithTags(schoolKey);
}

async function fetchLessonsWithTags(schoolKey) {
  const query = `
    query GetMediaItemsFallback {
      mediaItems(stage: PUBLISHED, where: { type: VIDEO }, orderBy: createdAt_DESC) {
        ${FIELDS_SAFE}
      }
    }
  `;
  try {
    const res = await fetch(HYGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HYGRAPH_TOKEN && { Authorization: `Bearer ${HYGRAPH_TOKEN}` }),
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 },
    });
    const json = await res.json();
    if (json.errors) {
      console.error('Hygraph fetch errors:', json.errors);
      return [];
    }
    const items = json?.data?.mediaItems || [];
    return items
      .map(normalizeLesson)
      .filter((l) => schoolKey === 'all' || l.schoolKey === schoolKey);
  } catch (err) {
    console.error('Hygraph fetch error:', err);
    return [];
  }
}

export async function fetchLessonById(id) {
  return fetchLessonByIdOrSlug({ id });
}


export async function createLesson(data) {
  if (!HYGRAPH_URL || !HYGRAPH_TOKEN) {
    console.error('Missing Hygraph credentials');
    return null;
  }

  const mutation = `
    mutation CreateLesson($title: String!, $slug: String!, $videoUrl: String, $tags: [String!], $description: String) {
      createMediaItem(data: {
        title: $title,
        slug: $slug,
        type: VIDEO,
        videoUrl: $videoUrl,
        tags: $tags,
        description: { children: [{ type: "paragraph", children: [{ text: $description }] }] }
      }) {
        id
        slug
      }
    }
  `;

  try {
    const res = await fetch(HYGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          title: data.title,
          slug: data.slug,
          videoUrl: data.videoUrl,
          tags: data.tags || [],
          description: data.description || ""
        }
      }),
    });

    const json = await res.json();
    if (json.errors) {
      console.error('Hygraph mutation errors:', json.errors);
      return null;
    }
    return json.data?.createMediaItem;
  } catch (err) {
    console.error('Hygraph create error:', err);
    return null;
  }
}

export async function publishLesson(id) {
  if (!HYGRAPH_URL || !HYGRAPH_TOKEN) return null;

  const mutation = `
      mutation PublishLesson($id: ID!) {
        publishMediaItem(where: { id: $id }, to: PUBLISHED) {
          id
        }
      }
    `;

  try {
    const res = await fetch(HYGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({ query: mutation, variables: { id } }),
    });
    const json = await res.json();
    return json.data?.publishMediaItem;
  } catch (err) {
    console.error('Hygraph publish error:', err);
    return null;
  }
}


export async function updateLesson(id, data) {
  if (!HYGRAPH_URL || !HYGRAPH_TOKEN) return null;

  const mutation = `
    mutation UpdateLesson($id: ID!, $tags: [String!], $description: String, $videoUrl: String) {
      updateMediaItem(
        where: { id: $id }
        data: {
          tags: $tags
          videoUrl: $videoUrl
          description: { children: [{ type: "paragraph", children: [{ text: $description }] }] }
        }
      ) {
        id
        slug
        tags
        videoUrl
      }
    }
  `;

  try {
    const res = await fetch(HYGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          id: id,
          tags: data.tags || [],
          videoUrl: data.videoUrl, // Pass URL if present
          description: data.description || ""
        }
      }),
    });

    const json = await res.json();
    if (json.errors) {
      console.error('Hygraph update errors:', json.errors);
      return null;
    }
    return json.data?.updateMediaItem;
  } catch (err) {
    console.error('Hygraph update error:', err);
    return null;
  }
}

export async function fetchLessonBySlug(slug) {
  return fetchLessonByIdOrSlug({ slug });
}

/** Fetches lesson by id or slug. Tries lessonPlan field first, falls back to FIELDS_SAFE if schema lacks it. */
async function fetchLessonByIdOrSlug({ id, slug }) {
  if (!HYGRAPH_URL || (!id && !slug)) return null;
  const vars = id ? { id } : { slug };
  const query = id ? MEDIA_ITEM_BY_ID_QUERY : MEDIA_ITEM_BY_SLUG_QUERY;

  for (const fields of [FIELDS_WITH_LESSON_PLAN, FIELDS_SAFE]) {
    try {
      const res = await fetch(HYGRAPH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(HYGRAPH_TOKEN && { Authorization: `Bearer ${HYGRAPH_TOKEN}` }),
        },
        body: JSON.stringify({ query: query(fields), variables: vars }),
        next: { revalidate: 60 },
      });
      const json = await res.json();
      if (json.errors) {
        const msg = json.errors.map((e) => e.message || '').join(' ');
        if (/lessonPlan/.test(msg) && fields === FIELDS_WITH_LESSON_PLAN) continue;
        console.error('Hygraph fetch errors:', json.errors);
        return null;
      }
      const item = id ? json?.data?.mediaItem : json?.data?.mediaItems?.[0];
      return item ? normalizeLesson(item) : null;
    } catch (err) {
      if (fields === FIELDS_WITH_LESSON_PLAN) continue;
      console.error('Hygraph fetch error:', err);
      return null;
    }
  }
  return null;
}

function normalizeLesson(item) {
  // Prefer schools enum, fallback to tags
  // Map legacy/alternative tags to canonical school keys (LessonsList groups by these)
  const TAG_MAP = {
    bronx_medical: 'bronx_medical',
    aviation: 'aviation',
    bushwick: 'bushwick',
    brooklyn_law: 'brooklyn_law',
    queens: 'queens',
    'bk-law-tech': 'brooklyn_law',
    'brooklyn-law': 'brooklyn_law',
    'brooklyn_law_tech': 'brooklyn_law',
  };

  const rawTag = item.tags?.find((t) => Object.keys(TAG_MAP).includes(t));
  const foundSchool =
    item.schools?.[0] && ENUM_TO_SCHOOL[item.schools[0]]
      ? ENUM_TO_SCHOOL[item.schools[0]]
      : (rawTag ? TAG_MAP[rawTag] : undefined);

  let finalUrl = item.videoUrl;
  if (item.videoUrl) {
    if (item.videoUrl.includes('drive.google.com')) {
      // Convert view -> preview for embedding
      finalUrl = item.videoUrl.replace('/view', '/preview');
    } else if (!item.videoUrl.includes('embed')) {
      // Assume YouTube and try to extract ID
      const ytId = extractYouTubeId(item.videoUrl);
      if (ytId) {
        finalUrl = `https://www.youtube.com/embed/${ytId}`;
      }
    }
  }

  // Extract Markdown Text from Rich Text AST (if description was saved as wrapped markdown)
  let lessonPlan = "";
  if (item.description?.raw?.children) {
    // Basic extraction: join all text nodes. 
    // This assumes the description was uploaded as a "blob" of keys or just paragraphs.
    try {
      lessonPlan = item.description.raw.children
        .map(block => block.children?.map(span => span.text).join('') || '')
        .join('\n\n');
    } catch (e) {
      console.error("Error parsing description AST", e);
    }
  }

  return {
    ...item,
    lessonPlan, // <-- New Field
    schoolKey: foundSchool || 'bronx_medical', // Default fallback
    videoUrl: finalUrl
  };
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? match[1] : null;
}
