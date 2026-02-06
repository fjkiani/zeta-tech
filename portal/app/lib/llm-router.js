import { getSchoolConfig } from './schools.js';

/**
 * Routes LLM/generation config by school type so the system is not a monolith:
 * each school can have different source content and (later) model/prompt settings.
 */
export function getConfigForSchool(schoolKey) {
  return getSchoolConfig(schoolKey);
}

/**
 * Returns the source path to use for NotebookLM for this lesson and school.
 * Later: map lessonId/slug to school-specific lesson file (e.g. week1-lesson-plan.md).
 */
const path = require('path');
const fs = require('fs');

export function getSourcePathForLesson(lessonId, schoolKey) {
  const config = getConfigForSchool(schoolKey);

  // CONTEXT OVERRIDE: Check for dynamic teacher context
  const dynamicContextPath = path.join(process.cwd(), 'data', 'lessons', lessonId, 'context.md');
  if (fs.existsSync(dynamicContextPath)) {
    return dynamicContextPath;
  }

  // Legacy hardcoded fallback (can remove later if desired)
  if (lessonId === 'python-intro') {
    return path.resolve(process.cwd(), '../Bushwick-HS/context/python-datatypes.md');
  }

  return config.defaultSourcePath;
}

/**
 * Notebook title for this lesson and school (for NotebookLM).
 */
export function getNotebookTitleForLesson(lessonId, schoolKey) {
  const config = getConfigForSchool(schoolKey);
  return `${config.notebookTitlePrefix} Lesson ${lessonId}`;
}
