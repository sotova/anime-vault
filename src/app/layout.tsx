'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AnimeProvider } from "@/hooks/useAnimeData";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

const NAV_ITEMS = [
  { label: 'ホーム', href: '/', icon: '🏠' },
  { label: '一覧', href: '/anime', icon: '🔍' },
  { label: '書庫', href: '/library', icon: '📚' },
  { label: '管理', href: '/admin', icon: '⚙️' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="ja">
      <body className={inter.className} style={{ background: '#0a0a0a', color: '#fff', margin: 0 }}>
        <AnimeProvider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Desktop Sidebar */}
            <div className="desktop-sidebar">
              <Sidebar />
            </div>

            <main style={{ flex: 1, paddingLeft: 'var(--sidebar-width)', transition: 'padding 0.3s' }}>
              <div className="main-content-inner">
                {children}
              </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ fontSize: '10px', marginTop: '2px' }}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <style jsx global>{`
            :root {
              --sidebar-width: 160px;
            }
            .desktop-sidebar { display: block; }
            .mobile-nav { display: none; }
            
            @media (max-width: 768px) {
              :root { --sidebar-width: 0px; }
              .desktop-sidebar { display: none; }
              .mobile-nav { 
                display: flex; 
                position: fixed; 
                bottom: 0; 
                left: 0; 
                right: 0; 
                background: #111; 
                border-top: 1px solid #333; 
                padding: 10px 0; 
                justify-content: space-around; 
                z-index: 100;
                padding-bottom: env(safe-area-inset-bottom);
              }
              .main-content-inner { padding-bottom: 80px; }
              main { padding-left: 0 !important; }
            }
            
            .mobile-nav-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              color: #888;
              text-decoration: none;
              flex: 1;
            }
            .mobile-nav-item.active {
              color: #d4a843;
            }
          `}</style>
        </AnimeProvider>
      </body>
    </html>
  );
}
