import Link from 'next/link';
import NavBar from './components/NavBar';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export const metadata = {
  title: 'High School Portal',
  description: 'Lesson videos and resources',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
};

const SANDBOX_URL = process.env.NEXT_PUBLIC_SANDBOX_URL || 'http://localhost:3001';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ fontFamily: 'system-ui', margin: 0, padding: 24, background: '#f5f5f5' }}>
          <NavBar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
