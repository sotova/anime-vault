'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'ホーム', href: '/' },
  { label: 'アニメ一覧', href: '/anime' },
  { label: 'ライブラリ', href: '/library' },
  { label: '管理', href: '/admin' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '160px',
      minHeight: '100vh',
      background: '#111',
      borderRight: '1px solid #333',
      padding: '24px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 50,
    }}>
      <div style={{
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: '22px',
        color: '#d4a843',
        marginBottom: '32px',
        lineHeight: '1.2',
        textAlign: 'center',
      }}>
        Anime<br />Manager
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '12px 8px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: isActive ? '#000' : '#d4a843',
              background: isActive ? '#888' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              textAlign: 'center',
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
