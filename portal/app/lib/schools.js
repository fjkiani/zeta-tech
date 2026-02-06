import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

/**
 * Registry of school types. Each school has its own default source path and optional
 * config for LLM generation (agentic separation by school).
 */
export const SCHOOLS = {
  bronx_medical: {
    key: 'bronx_medical',
    label: 'Bronx HS Medical Science',
    defaultSourcePath: path.join(PROJECT_ROOT, 'Bronx-HS-Medical-Science', 'week0.5-lesson-plan.md'),
    notebookTitlePrefix: 'Bronx Medical',
  },
  aviation: {
    key: 'aviation',
    label: 'Aviation High School',
    defaultSourcePath: path.join(PROJECT_ROOT, 'Aviation-HS', 'syllabus.md'),
    notebookTitlePrefix: 'Aviation',
  },
  bushwick: {
    key: 'bushwick',
    label: 'Bushwick High School',
    defaultSourcePath: path.join(PROJECT_ROOT, 'Bushwick-HS', 'syllabus.md'),
    notebookTitlePrefix: 'Bushwick',
  },
  brooklyn_law: {
    key: 'brooklyn_law',
    label: 'Brooklyn Law',
    defaultSourcePath: path.join(PROJECT_ROOT, 'brooklyn-law', 'week1-lesson-plan.md'),
    notebookTitlePrefix: 'Brooklyn Law',
  },
};

const DEFAULT_SCHOOL_KEY = 'bronx_medical';

export function getSchoolKeys() {
  return Object.keys(SCHOOLS);
}

export function getSchoolConfig(schoolKey) {
  const key = schoolKey && SCHOOLS[schoolKey] ? schoolKey : DEFAULT_SCHOOL_KEY;
  return SCHOOLS[key] || SCHOOLS[DEFAULT_SCHOOL_KEY];
}

export function getDefaultSchoolKey() {
  return DEFAULT_SCHOOL_KEY;
}
