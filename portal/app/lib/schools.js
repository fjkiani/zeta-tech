import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

/**
 * Registry of school types. Each school has its own default source path and optional
 * config for LLM generation (agentic separation by school).
 */
export const SCHOOLS = {
  bronx_medical: {
    key: 'bronx_medical',
    label: 'Bronx HS of Science',
    description: 'Research at the speed of AI. Analyze biological data and hack the human body.',
    cta: 'Enter Lab',
    color: '#10b981', // Emerald
    iconName: 'Beaker',
    features: ['Medical Imaging AI', 'Genomics Analysis', 'Diagnosis Logic'],
    defaultSourcePath: path.join(PROJECT_ROOT, 'Bronx-HS-Medical-Science', 'week0.5-lesson-plan.md'),
    notebookTitlePrefix: 'Bronx Medical',
  },
  aviation: {
    key: 'aviation',
    label: 'Aviation High School',
    description: 'Master the Airframe. Ace the A&P. The ultimate copilot for FAA certification.',
    cta: 'Start Engine',
    color: '#f59e0b', // Amber
    iconName: 'Plane',
    features: ['A&P Test Prep', 'Maintenance Logs', 'Schematic Decoder'],
    defaultSourcePath: path.join(PROJECT_ROOT, 'Aviation-HS', 'syllabus.md'),
    notebookTitlePrefix: 'Aviation',
  },
  bushwick: {
    key: 'bushwick',
    label: 'Bushwick Leaders',
    description: 'Build the tools that change the system. Python mastery for real-world impact.',
    cta: 'Open Terminal',
    color: '#3b82f6', // Blue
    iconName: 'Terminal',
    features: ['Python Scripting', 'System Architecture', 'Data Pipelines'],
    defaultSourcePath: path.join(PROJECT_ROOT, 'Bushwick-HS', 'syllabus.md'),
    notebookTitlePrefix: 'Bushwick',
  },
  brooklyn_law: {
    key: 'brooklyn_law',
    label: 'Brooklyn Law & Tech',
    description: 'Predict the verdict. Hack the law. Legal reasoning augmented by intelligence.',
    cta: 'Review Case',
    color: '#8b5cf6', // Violet
    iconName: 'Scale',
    features: ['Case Analysis', 'Legal Research', 'Argument Builder'],
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
