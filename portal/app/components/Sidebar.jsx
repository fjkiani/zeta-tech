'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MapPin, TrendingUp, Box, LogIn } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Sidebar() {
    const pathname = usePathname();
    const SANDBOX_URL = process.env.NEXT_PUBLIC_SANDBOX_URL || 'http://localhost:3001';

    const NavItem = ({ href, icon: Icon, label, external }) => {
        const isActive = pathname === href;
        
        const coreStyles = {
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 16px', 
            borderRadius: '12px',
            color: isActive ? '#f8fafc' : '#94a3b8',
            background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
            textDecoration: 'none', 
            fontWeight: 600, 
            fontSize: '15px',
            transition: 'all 0.2s',
            boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
        };

        if (external) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" style={coreStyles} className="sidebar-link">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {label} ↗
                </a>
            );
        }

        return (
            <Link href={href} style={coreStyles} className="sidebar-link">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {label}
            </Link>
        );
    };

    return (
        <aside style={{
            width: '280px',
            height: '100vh',
            background: '#0f172a', // Deep slate Zeta signature
            borderRight: '1px solid #1e293b',
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 16px'
        }}>
            <div>
                {/* Logo / Brand Area */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', padding: '0 8px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '20px',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }}>Z</div>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>ZETA COMMAND</span>
                </Link>

                {/* Primary Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <style>{`
                        .sidebar-link:hover {
                            background: #1e293b !important;
                            color: #f1f5f9 !important;
                        }
                    `}</style>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Directives</div>
                    <NavItem href="/" icon={Home} label="HQ Console" />
                    <NavItem href="/schools" icon={MapPin} label="Sector Map" />
                    <NavItem href="/lessons" icon={Compass} label="Mission Briefs" />
                    <NavItem href="/progress" icon={TrendingUp} label="Cadet Progress" />
                    
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '32px', marginBottom: '8px', paddingLeft: '8px' }}>Labs</div>
                    <NavItem href={SANDBOX_URL} icon={Box} label="Sandbox Terminal" external={true} />
                </nav>
            </div>

            {/* Auth / Profile Area */}
            <div style={{ 
                borderTop: '1px solid #1e293b', 
                paddingTop: '24px',
                paddingLeft: '8px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <SignedIn>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: { width: 36, height: 36, border: '2px solid #3b82f6' }
                                }
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>Active Agent</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Zeta Clearance</span>
                        </div>
                    </div>
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            background: '#3b82f6', color: 'white', border: 'none',
                            padding: '12px', borderRadius: '12px', fontWeight: 600, fontSize: '14px',
                            cursor: 'pointer', width: '100%',
                            transition: 'background 0.2s'
                        }}>
                            <LogIn size={16} /> Authenticate
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </aside>
    );
}
