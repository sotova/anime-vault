'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';

type SortKey = 'title' | 'season' | 'newest';

function AnimeListContent() {
  const { animeList, loading } = useAnimeData();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // URLパラメータにseasonがあれば初期値としてセットする
  useEffect(() => {
    const seasonQuery = searchParams.get('season');
    if (seasonQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(seasonQuery);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...animeList];
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        (a.season && a.season.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ja');
      if (sortBy === 'season') return (b.season || '').localeCompare(a.season || '');
      if (sortBy === 'newest') return (b.created_at || '').localeCompare(a.created_at || '');
      return 0;
    });

    return list;
  }, [animeList, search, sortBy]);

  if (loading) return <div style={{ padding: '60px', color: '#999', textAlign: 'center' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '40px 5vw' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(24px, 6vw, 42px)', color: '#d4a843', textAlign: 'center', marginBottom: '32px' }}
      >
        Explore Anime
      </motion.h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="タイトル・タグ・年代で検索..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '12px 18px', background: '#111', border: '1px solid #333',
            borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none',
          }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ padding: '12px 18px', background: '#111', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '14px' }}
        >
          <option value="newest">新着順</option>
          <option value="title">名前順</option>
          <option value="season">年代順</option>
        </select>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '16px' }}>
          {filtered.map((a, i) => <AnimeCard key={a.id} anime={a} index={i} />)}
        </div>
      ) : (
        <div style={{ padding: '80px', textAlign: 'center', color: '#666', background: '#111', borderRadius: '16px' }}>
          条件に合う作品が見つかりませんでした。
        </div>
      )}
    </div>
  );
}

export default function AnimeListPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', color: '#999', textAlign: 'center' }}>準備中...</div>}>
      <AnimeListContent />
    </Suspense>
  );
}
