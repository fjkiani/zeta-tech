import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'Zeta Command',
  description: 'AI-Powered Education Portal',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0, background: '#f8fafc', display: 'flex' }}>
          
          {/* Zeta Navigation Command Center */}
          <Sidebar />

          {/* Zeta Battlefield (Main Content) */}
          <div style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
            <main style={{ padding: '32px' }}>
              {children}
            </main>
          </div>

        </body>
      </html>
    </ClerkProvider>
  );
}
