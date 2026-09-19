'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, BookOpen, Settings, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { label: 'ホーム', href: '/', icon: Home },
  { label: '探す', href: '/anime', icon: Search },
  { label: 'ライブラリ', href: '/library', icon: BookOpen },
  { label: '管理', href: '/admin', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return <aside style={{ width: 244, minHeight: '100vh', padding: '28px 16px', background: 'rgba(255,251,255,.86)', borderRight: '1px solid rgba(121,116,126,.18)', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <Link href="/" style={{ textDecoration: 'none', color: '#1d1b20', padding: '12px 14px 32px', display: 'block' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6750a4', fontSize: 13, fontWeight: 800, letterSpacing: '.08em' }}><Sparkles size={16} /> YOUR COLLECTION</span>
      <strong style={{ display: 'block', fontFamily: "Georgia, Times New Roman, serif", fontSize: 29, letterSpacing: '-.06em', marginTop: 8 }}>Anime<br />Vault</strong>
    </Link>
    <nav aria-label="メインナビゲーション" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 999, color: active ? '#21005d' : '#49454f', background: active ? '#e9ddff' : 'transparent', fontWeight: active ? 800 : 600, textDecoration: 'none', transition: 'background .2s' }}><Icon size={19} strokeWidth={active ? 2.6 : 2} />{label}</Link>; })}
    </nav>
    <div style={{ marginTop: 'auto' }}><ThemeToggle /><div style={{ color: 'var(--on-surface-variant)', fontSize: 12, padding: 14, lineHeight: 1.5 }}>見たい物語を、<br />自分だけの棚へ。</div></div>
  </aside>;
}
