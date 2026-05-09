'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AnimeProvider } from "@/hooks/useAnimeData";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ["latin"] });

const NAV_ITEMS = [
  { label: 'ホーム', href: '/', icon: '🏠' },
  { label: '一覧', href: '/anime', icon: '🔍' },
  { label: '書庫', href: '/library', icon: '📚' },
  { label: '管理', href: '/admin', icon: '⚙️' },
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
    <html lang="ja">
      <head>
        <title>Anime Vault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={inter.className} style={{ background: '#0a0a0a', color: '#fff', margin: 0, padding: 0 }}>
        <AnimeProvider>
          <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            
            {/* Desktop Sidebar */}
            {!isMobile && (
              <div style={{ width: '160px', flexShrink: 0, position: 'fixed', height: '100vh', borderRight: '1px solid #222', zIndex: 100 }}>
                <Sidebar />
              </div>
            )}

            <main style={{ 
              flex: 1, 
              marginLeft: isMobile ? 0 : '160px',
              width: isMobile ? '100%' : 'calc(100% - 160px)',
              minHeight: '100vh',
              paddingBottom: isMobile ? '80px' : '0'
            }}>
              {children}
            </main>

            {/* Mobile Bottom Nav */}
            {isMobile && (
              <nav style={{ 
                position: 'fixed', bottom: 0, left: 0, right: 0, 
                height: '70px', background: '#111', borderTop: '1px solid #333',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom)'
              }}>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      textDecoration: 'none', color: isActive ? '#d4a843' : '#888',
                      flex: 1
                    }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
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
