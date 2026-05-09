'use client';

import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  const { animeList, loading } = useAnimeData();

  if (loading) return <div style={{ padding: '60px', color: '#999' }}>読み込み中...</div>;

  const watching = animeList.filter((a) => a.userData?.status === '視聴中');
  const seasonal = animeList.filter((a) => a.season).slice(0, 15);
  const recommended = animeList.slice().sort(() => 0.5 - Math.random()).slice(0, 15);

  return (
    <div style={{ padding: '40px 0', overflowX: 'hidden' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '48px', color: '#d4a843', textAlign: 'center', marginBottom: '48px' }}
      >
        Anime Manager
      </motion.h1>

      {/* 視聴中 */}
      {watching.length > 0 && (
        <Section title="視聴中の作品" href="/library">
          <HorizontalScroll>
            {watching.map((a, i) => (
              <div key={a.id} style={{ width: '170px', flexShrink: 0 }}>
                <AnimeCard anime={a} showProgress index={i} />
              </div>
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {/* 今季アニメ */}
      <Section title="今季アニメ" href="/anime">
        {seasonal.length > 0 ? (
          <HorizontalScroll>
            {seasonal.map((a, i) => (
              <div key={a.id} style={{ width: '170px', flexShrink: 0 }}>
                <AnimeCard anime={a} index={i} />
              </div>
            ))}
          </HorizontalScroll>
        ) : <EmptyState text="まだ作品が登録されていません。「管理」から追加してください。" />}
      </Section>

      {/* おすすめ */}
      <Section title="あなたにおすすめ" href="/anime">
        {recommended.length > 0 ? (
          <HorizontalScroll>
            {recommended.map((a, i) => (
              <div key={a.id} style={{ width: '170px', flexShrink: 0 }}>
                <AnimeCard anime={a} index={i} />
              </div>
            ))}
          </HorizontalScroll>
        ) : <EmptyState text="作品を登録すると、おすすめがここに表示されます。" />}
      </Section>
    </div>
  );
}

function Section({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ marginBottom: '48px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 48px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>{title}</h2>
        {href && (
          <Link href={href} style={{ fontSize: '13px', color: '#d4a843', textDecoration: 'none', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', background: 'rgba(212,168,67,0.1)' }}>
            すべて表示 →
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      overflowX: 'auto', 
      padding: '10px 48px 30px', 
      scrollbarWidth: 'none', 
      msOverflowStyle: 'none',
      scrollBehavior: 'smooth',
      cursor: 'grab'
    }}
    onWheel={(e) => {
      // マウスホイールでの横スクロールを補助
      if (e.deltaY !== 0) {
        e.currentTarget.scrollLeft += e.deltaY;
      }
    }}
    >
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ margin: '0 48px', padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
      {text}
    </div>
  );
}
