'use client';

import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AnimeProvider } from "@/hooks/useAnimeData";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Search, BookOpen, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_ITEMS = [
  { label: 'ホーム', href: '/', icon: Home },
  { label: '一覧', href: '/anime', icon: Search },
  { label: '書庫', href: '/library', icon: BookOpen },
  { label: '管理', href: '/admin', icon: Settings },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <title>Anime Vault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        <AnimeProvider>
          <div className="app-shell">
            
            {/* Desktop Sidebar */}
            {!isMobile && (
              <div style={{ width: '244px', flexShrink: 0, position: 'fixed', height: '100vh', zIndex: 100 }}>
                <Sidebar />
              </div>
            )}

            <main style={{ 
              flex: 1, 
              minHeight: '100vh',
              marginLeft: isMobile ? 0 : '244px',
              width: isMobile ? '100%' : 'calc(100% - 244px)'
            }}>
              {isMobile && <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 250 }}><ThemeToggle /></div>}
              {children}
            </main>

            {/* Mobile Bottom Nav */}
            {isMobile && (
              <nav style={{ 
                position: 'fixed', bottom: 0, left: 0, right: 0, 
                height: '76px', background: 'var(--surface-container)', borderTop: '1px solid var(--outline)', boxShadow: '0 -8px 24px rgba(49,45,65,.08)',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom)'
              }}>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      textDecoration: 'none', color: isActive ? 'var(--accent-text)' : 'var(--on-surface-variant)',
                      flex: 1
                    }}>
                      <Icon size={20} strokeWidth={2} />
                      <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: isActive ? 'bold' : 'normal' }}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        </AnimeProvider>
      </body>
    </html>
  );
}
