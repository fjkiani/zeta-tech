import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main style={{ maxWidth: 400, margin: '48px auto', textAlign: 'center' }}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/onboarding"
        redirectUrl="/onboarding"
      />
    </main>
  );
}
