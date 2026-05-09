'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Anime, UserAnimeData, HybridAnime } from '@/types/anime';

const LOCAL_DB_KEY = 'anime_db';
const USER_DATA_KEY = 'anime_user_data';

interface AnimeContextType {
  animeList: HybridAnime[];
  rawAnimeList: Anime[];
  loading: boolean;
  upsertAnime: (anime: Anime) => Promise<void>;
  bulkUpsert: (list: Anime[]) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
  updateUserData: (animeId: string, updates: Partial<UserAnimeData>) => void;
  exportUserData: () => void;
  importUserData: (json: string) => boolean;
  refresh: () => Promise<void>;
}

const AnimeContext = createContext<AnimeContextType | undefined>(undefined);

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
}

export function AnimeProvider({ children }: { children: React.ReactNode }) {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [userData, setUserData] = useState<Record<string, UserAnimeData>>({});
  const [loading, setLoading] = useState(true);

  const fetchAnime = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setAnimeList(data);
          localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Supabase fetch failed, falling back to local', e);
      }
    }
    setAnimeList(loadLocal<Anime[]>(LOCAL_DB_KEY, []));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnime();
    setUserData(loadLocal<Record<string, UserAnimeData>>(USER_DATA_KEY, {}));
  }, [fetchAnime]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  }, [userData, loading]);

  const upsertAnime = async (anime: Anime) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('anime').upsert([anime]);
      if (error) console.error('Supabase upsert error:', error);
    }
    setAnimeList((prev) => {
      const idx = prev.findIndex((a) => a.id === anime.id);
      let newList;
      if (idx >= 0) {
        newList = [...prev];
        newList[idx] = anime;
      } else {
        newList = [anime, ...prev];
      }
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
      return newList;
    });
  };

  const bulkUpsert = async (list: Anime[]) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').upsert(list);
    }
    setAnimeList((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      list.forEach((a) => map.set(a.id, a));
      const newList = Array.from(map.values());
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
      return newList;
    });
  };

  const deleteAnime = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').delete().eq('id', id);
    }
    setAnimeList((prev) => {
      const newList = prev.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
      return newList;
    });
    setUserData((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
  };

  const updateUserData = (animeId: string, updates: Partial<UserAnimeData>) => {
    setUserData((prev) => ({
      ...prev,
      [animeId]: { ...(prev[animeId] || { status: '未視聴', rating: 0, progress: 0 }), ...updates },
    }));
  };

  const exportUserData = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'anime_user_data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importUserData = (json: string) => {
    try {
      const data = JSON.parse(json);
      setUserData(data);
      return true;
    } catch { return false; }
  };

  const hybridData: HybridAnime[] = animeList.map((a) => ({ ...a, userData: userData[a.id] }));

  const value = {
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

  return <AnimeContext.Provider value={value}>{children}</AnimeContext.Provider>;
}

export function useAnimeData() {
  const context = useContext(AnimeContext);
  if (context === undefined) {
    throw new Error('useAnimeData must be used within an AnimeProvider');
  }
  return context;
}
