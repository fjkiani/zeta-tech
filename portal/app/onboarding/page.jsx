import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import OnboardingForm from './OnboardingForm';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }
  const metadata = user.publicMetadata || {};
  if (metadata.onboarded) {
    redirect('/lessons');
  }
  return (
    <main style={{ maxWidth: 480, margin: '48px auto', padding: 24, background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h1 style={{ margin: '0 0 8px' }}>Complete your profile</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Tell us about yourself so we can personalize your experience.</p>
      <OnboardingForm />
    </main>
  );
}
