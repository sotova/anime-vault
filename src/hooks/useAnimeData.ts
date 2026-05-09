'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Anime, UserAnimeData, HybridAnime } from '@/types/anime';

const LOCAL_DB_KEY = 'anime_db';
const USER_DATA_KEY = 'anime_user_data';

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

export function useAnimeData() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [userData, setUserData] = useState<Record<string, UserAnimeData>>({});
  const [loading, setLoading] = useState(true);

  // --- Load ---
  const fetchAnime = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
        if (!error && data) { setAnimeList(data); setLoading(false); return; }
      } catch {}
    }
    setAnimeList(loadLocal<Anime[]>(LOCAL_DB_KEY, []));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnime(); }, [fetchAnime]);
  useEffect(() => { setUserData(loadLocal<Record<string, UserAnimeData>>(USER_DATA_KEY, {})); }, []);

  // --- Persist user data ---
  useEffect(() => { if (!loading) localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData)); }, [userData, loading]);
  // --- Persist local anime db as backup ---
  useEffect(() => { if (!loading) localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(animeList)); }, [animeList, loading]);

  // --- Merged data ---
  const hybridData: HybridAnime[] = animeList.map((a) => ({ ...a, userData: userData[a.id] }));

  // --- Upsert anime ---
  const upsertAnime = async (anime: Anime) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('anime').upsert([anime]);
      if (error) { console.error('Supabase upsert error:', error); }
    }
    setAnimeList((prev) => {
      const idx = prev.findIndex((a) => a.id === anime.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = anime; return u; }
      return [anime, ...prev];
    });
  };

  // --- Bulk upsert (XLSX) ---
  const bulkUpsert = async (list: Anime[]) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').upsert(list);
    }
    setAnimeList((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      list.forEach((a) => map.set(a.id, a));
      return Array.from(map.values());
    });
  };

  // --- Delete anime ---
  const deleteAnime = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').delete().eq('id', id);
    }
    setAnimeList((prev) => prev.filter((a) => a.id !== id));
    setUserData((prev) => { const c = { ...prev }; delete c[id]; return c; });
  };

  // --- Update user data ---
  const updateUserData = (animeId: string, updates: Partial<UserAnimeData>) => {
    setUserData((prev) => ({
      ...prev,
      [animeId]: { ...(prev[animeId] || { status: '未視聴', rating: 0, progress: 0 }), ...updates },
    }));
  };

  // --- Export user data ---
  const exportUserData = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'anime_user_data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // --- Import user data ---
  const importUserData = (json: string) => {
    try { setUserData(JSON.parse(json)); return true; } catch { return false; }
  };

  return {
    animeList: hybridData,
    rawAnimeList: animeList,
    loading,
    upsertAnime,
    bulkUpsert,
    deleteAnime,
    updateUserData,
    exportUserData,
    importUserData,
    refresh: fetchAnime,
  };
}
