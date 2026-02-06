'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Box, User, LogIn } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function NavBar() {
    const pathname = usePathname();
    const SANDBOX_URL = process.env.NEXT_PUBLIC_SANDBOX_URL || 'http://localhost:3001';

    const NavItem = ({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderRadius: '8px',
                    color: isActive ? '#0f172a' : '#64748b',
                    background: isActive ? '#f1f5f9' : 'transparent',
                    textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                    transition: 'all 0.2s'
                }}
            >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {label}
            </Link>
        );
    };

    return (
        <nav style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
            position: 'sticky', top: 0, zIndex: 100,
            padding: '12px 24px',
            marginBottom: '32px'
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Logo Area */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '18px'
                    }}>Z</div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>ZETA ACADEMY</span>
                </Link>

                {/* Center Nav */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <NavItem href="/" icon={Home} label="Command" />
                    <NavItem href="/lessons" icon={Compass} label="Missions" />
                    <a
                        href={SANDBOX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 12px', borderRadius: '8px',
                            color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '14px'
                        }}
                    >
                        <Box size={18} /> Sandbox ↗
                    </a>
                </div>

                {/* Auth / Right Side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: { width: 32, height: 32 }
                                }
                            }}
                        />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#0f172a', color: 'white', border: 'none',
                                padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                                cursor: 'pointer'
                            }}>
                                <LogIn size={14} /> Cadet Login
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>

            </div>
        </nav>
    );
}
