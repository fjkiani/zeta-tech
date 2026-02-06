import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main style={{ maxWidth: 400, margin: '48px auto', textAlign: 'center' }}>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/onboarding"
        redirectUrl="/onboarding"
      />
    </main>
  );
}
