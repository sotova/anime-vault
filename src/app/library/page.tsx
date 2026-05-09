'use client';

import { useState, useMemo } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { AnimeStatus } from '@/types/anime';
import { motion } from 'framer-motion';

const TABS: { label: string; value: AnimeStatus | 'すべて' }[] = [
  { label: 'すべて', value: 'すべて' },
  { label: '未視聴', value: '未視聴' },
  { label: '視聴中', value: '視聴中' },
  { label: '完了', value: '完了' },
  { label: '保留', value: '保留' },
  { label: '視聴切り', value: '視聴切り' },
];

type SortKey = 'title' | 'rating' | 'season';

export default function LibraryPage() {
  const { animeList, loading, exportUserData, importUserData } = useAnimeData();
  const [activeTab, setActiveTab] = useState<AnimeStatus | 'すべて'>('すべて');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('title');

  const filtered = useMemo(() => {
    let list = animeList;
    // Tab filter
    if (activeTab !== 'すべて') list = list.filter((a) => (a.userData?.status || '未視聴') === activeTab);
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        (a.userData?.status || '未視聴').includes(q)
      );
    }
    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ja');
      if (sortBy === 'rating') return (b.userData?.rating || 0) - (a.userData?.rating || 0);
      if (sortBy === 'season') return (b.season || '').localeCompare(a.season || '');
      return 0;
    });
    return list;
  }, [animeList, activeTab, search, sortBy]);

  if (loading) return <div style={{ padding: '60px', color: '#999' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '40px 48px' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '48px', color: '#d4a843', textAlign: 'center', marginBottom: '24px' }}
      >
        Library
      </motion.h1>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: '1px solid #555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              background: activeTab === tab.value ? '#666' : 'transparent',
              color: activeTab === tab.value ? '#fff' : '#aaa', transition: 'all 0.2s',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Search + Sort + Export/Import */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="タイトル・タグ・状態で検索..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '10px 14px', background: '#111', border: '1px solid #333',
            borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
          }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ padding: '10px 14px', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
        >
          <option value="title">名前順</option>
          <option value="rating">評価順</option>
          <option value="season">年代順</option>
        </select>
        <button onClick={exportUserData}
          style={{ padding: '10px 16px', background: '#333', border: '1px solid #555', borderRadius: '8px', color: '#ccc', fontSize: '12px', cursor: 'pointer' }}
        >EXPORT</button>
        <label style={{ padding: '10px 16px', background: '#333', border: '1px solid #555', borderRadius: '8px', color: '#ccc', fontSize: '12px', cursor: 'pointer' }}>
          IMPORT
          <input type="file" accept=".json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => importUserData(ev.target?.result as string); r.readAsText(f); } }}
          />
        </label>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '20px' }}>
          {filtered.map((a, i) => <AnimeCard key={a.id} anime={a} showProgress index={i} />)}
        </div>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
          {search ? '検索結果がありません。' : activeTab === 'すべて' ? 'まだ作品が登録されていません。' : `「${activeTab}」の作品はまだありません。`}
        </div>
      )}
    </div>
  );
}
