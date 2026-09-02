'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';
import { getBaseTitle } from '@/utils/animeUtils';
import { Anime } from '@/types/anime';

type SortKey = 'title' | 'season' | 'newest';

const PAGE_SIZE = 100;

function AnimeListContent() {
  const { animeList, loading } = useAnimeData();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

    // 同じ作品の別シーズンをグループ化（代表1つだけ表示する）
    const grouped = list.reduce((acc, a) => {
      const base = getBaseTitle(a);
      if (!acc[base]) acc[base] = [];
      acc[base].push(a);
      return acc;
    }, {} as Record<string, Anime[]>);

    // 各グループの中で最も古いシーズン（一番最初のシーズン）を代表として表示、新着順などのソート順は維持する
    const deduplicated = Object.values(grouped).map(group => {
      // 内部的には放送季の古い順（Season 1など）を代表にする
      return group.sort((a, b) => (a.season || '').localeCompare(b.season || ''))[0];
    });

    // 再度外側のソートを適用する（代表作品だけで）
    deduplicated.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ja');
      if (sortBy === 'season') return (b.season || '').localeCompare(a.season || '');
      if (sortBy === 'newest') return (b.created_at || '').localeCompare(a.created_at || '');
      return 0;
    });

    return deduplicated;
  }, [animeList, search, sortBy]);



  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE);
  }, [search, sortBy, animeList.length]);

  const visibleAnime = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  if (loading) return <div style={{ padding: '60px', color: '#999', textAlign: 'center' }}>読み込み中...</div>;

  return (
    <div className="m3-page">
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: "Georgia, Times New Roman, serif", fontSize: 'clamp(34px, 6vw, 54px)', color: '#1d1b20', textAlign: 'left', letterSpacing: '-.04em', marginBottom: '24px' }}
      >
        Explore Anime
      </motion.h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="タイトル・タグ・年代で検索..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '12px 18px', background: '#f3edf7', border: '1px solid #79747e',
            borderRadius: '16px', color: '#1d1b20', fontSize: '15px', outline: 'none',
          }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ padding: '12px 18px', background: '#f3edf7', border: '1px solid #79747e', borderRadius: '16px', color: '#1d1b20', fontSize: '14px' }}
        >
          <option value="newest">新着順</option>
          <option value="title">名前順</option>
          <option value="season">年代順</option>
        </select>
      </div>

      {filtered.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '20px' }}>
            {visibleAnime.map((a, i) => <AnimeCard key={a.id} anime={a} index={i} />)}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                style={{
                  padding: '12px 20px',
                  background: '#6750a4',
                  color: '#fff',
                  border: '1px solid #6750a4',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                さらに100件読み込む ({visibleAnime.length}/{filtered.length})
              </button>
            </div>
          )}
        </>
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
