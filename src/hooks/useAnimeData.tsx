'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Anime, UserAnimeData, HybridAnime } from '@/types/anime';

const LOCAL_DB_NAME = 'AnimeVaultDB';
const STORE_NAME = 'anime_list';
const USER_DATA_KEY = 'anime_vault_user_library';

// Simple IndexedDB Wrapper
async function getIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(list: Anime[]) {
  const db = await getIDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  for (const item of list) store.put(item);
  return new Promise(resolve => tx.oncomplete = resolve);
}

async function loadFromIDB(): Promise<Anime[]> {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  } catch { return []; }
}

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

  // 初回ロード
  useEffect(() => {
    async function init() {
      const idbList = await loadFromIDB();
      if (idbList.length > 0) setAnimeList(idbList);
      
      const localUser = localStorage.getItem(USER_DATA_KEY);
      if (localUser) setUserData(JSON.parse(localUser));
      setLoading(false);
    }
    init();
  }, []);

  const fetchCloud = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setAnimeList(data);
        await saveToIDB(data);
        setIsCloudSynced(true);
      }
    } catch (e) {
      console.error('Cloud sync failed:', e);
      setIsCloudSynced(false);
    }
  }, []);

  useEffect(() => {
    fetchCloud();
  }, [fetchCloud]);

  const upsertAnime = async (anime: Anime): Promise<boolean> => {
    try {
      const newList = [anime, ...animeList.filter(a => a.id !== anime.id)];
      setAnimeList(newList);
      await saveToIDB(newList);

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('anime').upsert([anime]);
        if (error) throw error;
      }
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      alert('保存に失敗しました。容量制限か通信エラーの可能性があります。');
      return false;
    }
  };

  const bulkUpsert = async (list: Anime[]): Promise<boolean> => {
    try {
      const map = new Map(animeList.map(a => [a.id, a]));
      list.forEach(a => map.set(a.id, a));
      const newList = Array.from(map.values());
      setAnimeList(newList);
      await saveToIDB(newList);

      if (isSupabaseConfigured && supabase) {
        // 分割して送信（念のため）
        const chunkSize = 50;
        for (let i = 0; i < list.length; i += chunkSize) {
          const chunk = list.slice(i, i + chunkSize);
          const { error } = await supabase.from('anime').upsert(chunk);
          if (error) throw error;
        }
      }
      return true;
    } catch (e) {
      console.error('Bulk save failed:', e);
      alert('一括保存に失敗しました。');
      return false;
    }
  };

  const deleteAnime = async (id: string) => {
    const newList = animeList.filter(a => a.id !== id);
    setAnimeList(newList);
    await saveToIDB(newList);
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
