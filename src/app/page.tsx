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
    <div style={{ padding: '40px 0', width: '100%', overflowX: 'hidden' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '48px', color: '#d4a843', textAlign: 'center', marginBottom: '48px' }}
      >
        Anime Manager
      </motion.h1>

      <div style={{ width: '100%' }}>
        {watching.length > 0 && (
          <Section title="視聴中の作品" href="/library">
            <Row>
              {watching.map((a, i) => <CardWrapper key={a.id}><AnimeCard anime={a} showProgress index={i} /></CardWrapper>)}
            </Row>
          </Section>
        )}

        <Section title="今季アニメ" href="/anime">
          {seasonal.length > 0 ? (
            <Row>
              {seasonal.map((a, i) => <CardWrapper key={a.id}><AnimeCard anime={a} index={i} /></CardWrapper>)}
            </Row>
          ) : <EmptyState text="登録済み作品がありません" />}
        </Section>

        <Section title="あなたにおすすめ" href="/anime">
          {recommended.length > 0 ? (
            <Row>
              {recommended.map((a, i) => <CardWrapper key={a.id}><AnimeCard anime={a} index={i} /></CardWrapper>)}
            </Row>
          ) : <EmptyState text="作品を登録してください" />}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <div style={{ marginBottom: '40px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 48px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{title}</h2>
        {href && <Link href={href} style={{ fontSize: '13px', color: '#d4a843', textDecoration: 'none' }}>すべて表示 →</Link>}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ 
        display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 48px 30px',
        scrollbarWidth: 'none', msOverflowStyle: 'none'
      }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {children}
      </div>
    </div>
  );
}

function CardWrapper({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '160px', flexShrink: 0 }}>{children}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ margin: '0 48px', padding: '40px', textAlign: 'center', color: '#444', background: '#111', borderRadius: '12px' }}>{text}</div>;
}
