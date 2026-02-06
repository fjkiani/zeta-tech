'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const SCHOOLS = [
  { key: 'bronx_medical', label: 'Bronx HS Medical Science' },
  { key: 'aviation', label: 'Aviation High School' },
  { key: 'bushwick', label: 'Bushwick High School' },
  { key: 'brooklyn_law', label: 'Brooklyn Law' },
];

export default function OnboardingForm() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [school, setSchool] = useState('bronx_medical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await user.update({
        publicMetadata: {
          onboarded: true,
          role,
          school,
        },
      });
      router.push('/lessons');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>I am a</label>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            Student
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="role"
              value="teacher"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            Teacher
          </label>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>School / Program</label>
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 6, fontSize: 16 }}
        >
          {SCHOOLS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
      {error && <p style={{ color: 'crimson', marginBottom: 16 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? 'Saving…' : 'Continue'}
        </button>
        <button type="button" onClick={() => signOut()} style={{ padding: '10px 20px', cursor: 'pointer', background: '#f5f5f5' }}>
          Sign out
        </button>
      </div>
    </form>
  );
}
