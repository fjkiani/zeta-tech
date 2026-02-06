'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const SCHOOL_LIST = [
  { key: 'all', label: 'All programs' },
  { key: 'bronx_medical', label: 'Bronx HS Medical Science' },
  { key: 'aviation', label: 'Aviation HS' },
  { key: 'bushwick', label: 'Bushwick HS' },
  { key: 'brooklyn_law', label: 'Brooklyn Law' },
  { key: 'queens', label: 'Queens' },
];

export default function SchoolSelector({ currentSchool = 'bronx_medical' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setSchool(key) {
    const next = new URLSearchParams(searchParams ?? '');
    next.set('school', key);
    const path = typeof window !== 'undefined' ? window.location.pathname : '/lessons';
    router.push(path + '?' + next.toString());
  }

  return (
    <div style={{ marginBottom: 16 }} role="group" aria-label="School or program">
      <label htmlFor="school-select" style={{ marginRight: 8, fontSize: 14 }}>
        Program:
      </label>
      <select
        id="school-select"
        value={currentSchool}
        onChange={(e) => setSchool(e.target.value)}
        aria-label="Select school or program"
        style={{ padding: '6px 10px', borderRadius: 6, fontSize: 14 }}
      >
        {SCHOOL_LIST.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
