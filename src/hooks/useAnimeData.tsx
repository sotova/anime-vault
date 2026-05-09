'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  removeFromLibrary: (animeId: string) => void;
  exportUserData: () => void;
  importUserData: (json: string) => boolean;
  refresh: () => Promise<void>;
}

const AnimeContext = createContext<AnimeContextType | undefined>(undefined);

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    // 空配列や空オブジェクトが保存されている場合も考慮
    return parsed || fallback;
  } catch { return fallback; }
}

export function AnimeProvider({ children }: { children: React.ReactNode }) {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [userData, setUserData] = useState<Record<string, UserAnimeData>>({});
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  // 初回読み込み
  const fetchAnime = useCallback(async () => {
    setLoading(true);
    let initialAnime: Anime[] = loadLocal<Anime[]>(LOCAL_DB_KEY, []);
    let initialUser: Record<string, UserAnimeData> = loadLocal<Record<string, UserAnimeData>>(USER_DATA_KEY, {});

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          initialAnime = data;
        }
      } catch (e) {
        console.error('Supabase fetch failed', e);
      }
    }

    setAnimeList(initialAnime);
    setUserData(initialUser);
    setLoading(false);
    isInitialized.current = true;
    
    // ロード直後に保存して整合性をとる
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(initialAnime));
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(initialUser));
  }, []);

  useEffect(() => {
    fetchAnime();
  }, [fetchAnime]);

  // データが更新されたら即座に保存
  const upsertAnime = async (anime: Anime) => {
    setAnimeList((prev) => {
      const idx = prev.findIndex((a) => a.id === anime.id);
      const newList = idx >= 0 ? prev.map(a => a.id === anime.id ? anime : a) : [anime, ...prev];
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').upsert([anime]);
    }
  };

  const bulkUpsert = async (list: Anime[]) => {
    setAnimeList((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      list.forEach((a) => map.set(a.id, a));
      const newList = Array.from(map.values());
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').upsert(list);
    }
  };

  const deleteAnime = async (id: string) => {
    setAnimeList((prev) => {
      const newList = prev.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
      return newList;
    });
    setUserData((prev) => {
      const c = { ...prev };
      delete c[id];
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(c));
      return c;
    });

    if (isSupabaseConfigured && supabase) {
      await supabase.from('anime').delete().eq('id', id);
    }
  };

  const updateUserData = (animeId: string, updates: Partial<UserAnimeData>) => {
    setUserData((prev) => {
      const newData = {
        ...prev,
        [animeId]: { ...(prev[animeId] || { status: '見たい', rating: 0, progress: 0 }), ...updates },
      };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const removeFromLibrary = (animeId: string) => {
    setUserData((prev) => {
      const c = { ...prev };
      delete c[animeId];
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(c));
      return c;
    });
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
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
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
    removeFromLibrary,
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
