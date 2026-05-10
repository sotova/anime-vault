'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Anime, UserAnimeData, HybridAnime } from '@/types/anime';

const LOCAL_DB_KEY = 'anime_vault_global_db';
const USER_DATA_KEY = 'anime_vault_user_library';

interface AnimeContextType {
  animeList: HybridAnime[];
  rawAnimeList: Anime[];
  loading: boolean;
  isCloudSynced: boolean;
  upsertAnime: (anime: Anime) => Promise<boolean>;
  bulkUpsert: (list: Anime[]) => Promise<boolean>;
  deleteAnime: (id: string) => Promise<void>;
  updateUserData: (animeId: string, updates: Partial<UserAnimeData>) => void;
  removeFromLibrary: (animeId: string) => void;
  exportUserData: () => void;
  importUserData: (json: string) => boolean;
  refresh: () => Promise<void>;
}

const AnimeContext = createContext<AnimeContextType | undefined>(undefined);

export function AnimeProvider({ children }: { children: React.ReactNode }) {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [userData, setUserData] = useState<Record<string, UserAnimeData>>({});
  const [loading, setLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  useEffect(() => {
    const localAnimes = localStorage.getItem(LOCAL_DB_KEY);
    const localUser = localStorage.getItem(USER_DATA_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localAnimes) setAnimeList(JSON.parse(localAnimes));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localUser) setUserData(JSON.parse(localUser));
  }, []);

  const fetchCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setAnimeList(data);
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
        setIsCloudSynced(true);
      }
    } catch (e) {
      console.error('Cloud sync failed:', e);
      setIsCloudSynced(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCloud();
  }, [fetchCloud]);

  const upsertAnime = async (anime: Anime): Promise<boolean> => {
    const newList = [anime, ...animeList.filter(a => a.id !== anime.id)];
    setAnimeList(newList);
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('anime').upsert([anime]);
      return !error;
    }
    return false;
  };

  const bulkUpsert = async (list: Anime[]): Promise<boolean> => {
    const map = new Map(animeList.map(a => [a.id, a]));
    list.forEach(a => map.set(a.id, a));
    const newList = Array.from(map.values());
    setAnimeList(newList);
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('anime').upsert(list);
      return !error;
    }
    return false;
  };

  const deleteAnime = async (id: string) => {
    const newList = animeList.filter(a => a.id !== id);
    setAnimeList(newList);
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newList));
    if (isSupabaseConfigured && supabase) await supabase.from('anime').delete().eq('id', id);
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

  return (
    <AnimeContext.Provider value={{
      animeList: hybridData,
      rawAnimeList: animeList,
      loading,
      isCloudSynced,
      upsertAnime,
      bulkUpsert,
      deleteAnime,
      updateUserData,
      removeFromLibrary,
      exportUserData,
      importUserData,
      refresh: fetchCloud
    }}>
      {children}
    </AnimeContext.Provider>
  );
}

export const useAnimeData = () => {
  const context = useContext(AnimeContext);
  if (!context) throw new Error('useAnimeData error');
  return context;
};
