import fs from 'fs';
import path from 'path';

const SIDECAR_PATH = path.join(process.cwd(), 'data', 'lesson-notebooklm.json');

function readSidecar() {
  try {
    const raw = fs.readFileSync(SIDECAR_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

function writeSidecar(data) {
  const dir = path.dirname(SIDECAR_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SIDECAR_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getLessonMapping(lessonId) {
  const data = readSidecar();
  return data[lessonId] ?? null;
}

export function setLessonMapping(lessonId, mapping) {
  const data = readSidecar();
  data[lessonId] = {
    ...(data[lessonId] || {}),
    ...mapping,
    updatedAt: new Date().toISOString(),
  };
  writeSidecar(data);
}

export function updateArtifact(lessonId, type, artifactData) {
  const data = readSidecar();
  if (!data[lessonId]) data[lessonId] = { updatedAt: new Date().toISOString() };
  if (!data[lessonId].artifacts) data[lessonId].artifacts = {};
  data[lessonId].artifacts[type] = { ...(data[lessonId].artifacts[type] || {}), ...artifactData };
  data[lessonId].updatedAt = new Date().toISOString();
  writeSidecar(data);
}

export { readSidecar, writeSidecar };
