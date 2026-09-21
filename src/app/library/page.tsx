'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { ANIME_STATUS_OPTIONS, AnimeStatus } from '@/types/anime';
import { AnimatePresence, motion } from 'framer-motion';
import { compareSeasons } from '@/utils/animeUtils';

const TABS: { label: string; value: AnimeStatus | 'すべて' }[] = [
  { label: 'すべて', value: 'すべて' },
  ...ANIME_STATUS_OPTIONS.map((status) => ({ label: status, value: status })),
];

type SortKey = 'title' | 'rating' | 'season';
const libraryStateKey = 'anime-vault-library-state';

function getSavedLibraryState() {
  if (typeof window === 'undefined') return {};
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === 'reload') {
    sessionStorage.removeItem(libraryStateKey);
    return {};
  }
  try {
    return JSON.parse(sessionStorage.getItem(libraryStateKey) || '{}') as { activeTab?: AnimeStatus | 'すべて'; search?: string; sortBy?: SortKey; scrollY?: number };
  } catch {
    return {};
  }
}

export default function LibraryPage() {
  const { animeList, loading, exportUserData, importUserData } = useAnimeData();
  const [activeTab, setActiveTab] = useState<AnimeStatus | 'すべて'>(() => getSavedLibraryState().activeTab || 'すべて');
  const [search, setSearch] = useState(() => getSavedLibraryState().search || '');
  const [sortBy, setSortBy] = useState<SortKey>(() => getSavedLibraryState().sortBy || 'title');

  useEffect(() => {
    if (loading) return;
    const { scrollY } = getSavedLibraryState();
    requestAnimationFrame(() => window.scrollTo(0, scrollY || 0));
  }, [loading]);

  const saveLibraryState = () => {
    sessionStorage.setItem(libraryStateKey, JSON.stringify({ activeTab, search, sortBy, scrollY: window.scrollY }));
  };

  // ライブラリに追加された作品（userDataがあるもの）のみを対象にする
  const myLibrary = useMemo(() => animeList.filter(a => a.userData), [animeList]);
  const statusCounts = useMemo(() => ANIME_STATUS_OPTIONS.reduce<Record<AnimeStatus, number>>((counts, status) => {
    counts[status] = myLibrary.filter(anime => anime.userData?.status === status).length;
    return counts;
  }, {} as Record<AnimeStatus, number>), [myLibrary]);

  const filtered = useMemo(() => {
    let list = myLibrary;
    // Tab filter
    if (activeTab !== 'すべて') list = list.filter((a) => a.userData?.status === activeTab);
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        (a.userData?.status || '').includes(q)
      );
    }
    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ja');
      if (sortBy === 'rating') return (b.userData?.rating || 0) - (a.userData?.rating || 0);
      if (sortBy === 'season') return compareSeasons(a.season, b.season, false);
      return 0;
    });
    return list;
  }, [myLibrary, activeTab, search, sortBy]);

  if (loading) return <div style={{ padding: '60px', color: '#999' }}>読み込み中...</div>;

  return (
    <div className="m3-page">
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: "Georgia, Times New Roman, serif", fontSize: 'clamp(34px, 6vw, 54px)', color: '#1d1b20', textAlign: 'left', letterSpacing: '-.04em', marginBottom: '24px' }}
      >
        My Library
      </motion.h1>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            style={{
              padding: '8px 20px', borderRadius: '6px', border: '1px solid #79747e', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
              background: activeTab === tab.value ? '#e9ddff' : 'transparent',
              color: activeTab === tab.value ? '#21005d' : '#49454f', transition: 'transform .3s ease, opacity .3s ease',
            }}
          >{tab.label}({tab.value === 'すべて' ? myLibrary.length : statusCounts[tab.value]})</button>
        ))}
      </div>

      {/* Search + Sort + Export/Import */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="ライブラリ内を検索..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', padding: '10px 14px', background: '#f3edf7', border: '1px solid #79747e',
            borderRadius: '16px', color: '#1d1b20', fontSize: '13px', outline: 'none',
          }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ padding: '10px 14px', background: '#f3edf7', border: '1px solid #79747e', borderRadius: '16px', color: '#1d1b20', fontSize: '13px' }}
        >
          <option value="title">名前順</option>
          <option value="rating">評価順</option>
          <option value="season">年代順</option>
        </select>
        <button onClick={exportUserData}
          style={{ padding: '10px 16px', background: '#e9ddff', border: '1px solid #e9ddff', borderRadius: '999px', color: '#21005d', fontSize: '12px', cursor: 'pointer' }}
        >EXPORT</button>
        <label style={{ padding: '10px 16px', background: '#e9ddff', border: '1px solid #e9ddff', borderRadius: '999px', color: '#21005d', fontSize: '12px', cursor: 'pointer' }}>
          IMPORT
          <input type="file" accept=".json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => importUserData(ev.target?.result as string); r.readAsText(f); } }}
          />
        </label>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '20px' }}>
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((a, i) => <AnimeCard key={a.id} anime={a} showProgress index={i} onNavigate={saveLibraryState} />)}
          </AnimatePresence>
        </div>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', color: '#666', background: '#f3edf7', border: '1px solid #e7e0ec', borderRadius: '24px' }}>
          {search ? '検索結果がありません。' : activeTab === 'すべて' ? 'ライブラリは空です。作品詳細から「ライブラリに追加」してください。' : `「${activeTab}」の作品はまだありません。`}
        </div>
      )}
    </div>
  );
}
