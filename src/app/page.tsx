'use client';

import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { animeList, loading } = useAnimeData();

  if (loading) return <div style={{ padding: '60px', color: '#999' }}>読み込み中...</div>;

  const watching = animeList.filter((a) => a.userData?.status === '視聴中');
  const seasonal = animeList.filter((a) => a.season).slice(0, 8);
  const recommended = animeList.slice().sort(() => 0.5 - Math.random()).slice(0, 8);

  return (
    <div style={{ padding: '40px 48px' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '48px', color: '#d4a843', textAlign: 'center', marginBottom: '48px' }}
      >
        Anime Manager
      </motion.h1>

      {/* 視聴中 */}
      {watching.length > 0 && (
        <Section title="視聴中の作品">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
            {watching.map((a, i) => <AnimeCard key={a.id} anime={a} showProgress index={i} />)}
          </div>
        </Section>
      )}

      {/* 今季アニメ */}
      <Section title="今季アニメ">
        {seasonal.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
            {seasonal.map((a, i) => <AnimeCard key={a.id} anime={a} index={i} />)}
          </div>
        ) : <EmptyState text="まだ作品が登録されていません。左メニューの「管理」から作品を追加してください。" />}
      </Section>

      {/* おすすめ */}
      <Section title="あなたにおすすめ">
        {recommended.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
            {recommended.map((a, i) => <AnimeCard key={a.id} anime={a} index={i} />)}
          </div>
        ) : <EmptyState text="作品を登録すると、おすすめがここに表示されます。" />}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ marginBottom: '48px' }}
    >
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>{title}</h2>
      {children}
    </motion.section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
      {text}
    </div>
  );
}
