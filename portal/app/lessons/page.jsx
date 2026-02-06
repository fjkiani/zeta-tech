import Link from 'next/link';
import { fetchLessons } from '../lib/hygraph';
import LessonsListWithProgress from '../components/LessonsListWithProgress';

export const dynamic = 'force-dynamic';

export default async function LessonsPage({ searchParams }) {
  const currentSchool = (searchParams?.school ?? 'bronx_medical').toString();
  const lessons = await fetchLessons(currentSchool);

  return (
    <main>
      <LessonsListWithProgress lessons={lessons} currentSchool={currentSchool} />
    </main>
  );
}
