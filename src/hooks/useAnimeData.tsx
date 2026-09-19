'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, supabaseConfigurationError } from '@/lib/supabase';
import { Anime, UserAnimeData, HybridAnime } from '@/types/anime';

const LOCAL_DB_NAME = 'AnimeVaultDB';
const STORE_NAME = 'anime_list';
const USER_DATA_KEY = 'anime_vault_user_library';
const SUPABASE_PAGE_SIZE = 100;

function normalizeAnime(anime: Anime): Anime {
  return {
    id: String(anime.id || '').trim(),
    title: String(anime.title || '').trim(),
    tags: Array.isArray(anime.tags) ? anime.tags.map(String).map(tag => tag.trim()).filter(Boolean) : [],
    synopsis: String(anime.synopsis || ''),
    pv_url: String(anime.pv_url || ''),
    image_url: String(anime.image_url || ''),
    season: String(anime.season || '').trim(),
    total_episodes: Number.isFinite(Number(anime.total_episodes)) ? Number(anime.total_episodes) : 0,
    official_site: String(anime.official_site || ''),
    copyright: String(anime.copyright || ''),
    ...(anime.created_at ? { created_at: anime.created_at } : {}),
  };
}

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
  cloudSyncError: string | null;
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
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(supabaseConfigurationError);

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
    if (!isSupabaseConfigured || !supabase) {
      setIsCloudSynced(false);
      setCloudSyncError(supabaseConfigurationError);
      return;
    }
    try {
      const allAnime: Anime[] = [];
      let from = 0;

      while (true) {
        const to = from + SUPABASE_PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from('anime')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allAnime.push(...data);
        if (data.length < SUPABASE_PAGE_SIZE) break;
        from += SUPABASE_PAGE_SIZE;
      }

      setAnimeList(allAnime);
      await saveToIDB(allAnime);
      setIsCloudSynced(true);
      setCloudSyncError(null);
    } catch (e) {
      console.error('Cloud sync failed:', e);
      setIsCloudSynced(false);
      setCloudSyncError('クラウドに接続できません。Supabase の Project URL が有効か、プロジェクトが停止していないかを確認してください。');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCloud();
  }, [fetchCloud]);

  const upsertAnime = async (anime: Anime): Promise<boolean> => {
    const previousList = animeList;
    try {
      const normalized = normalizeAnime(anime);
      if (!normalized.id || !normalized.title) throw new Error('作品IDまたはタイトルがありません。');
      const newList = [normalized, ...animeList.filter(a => a.id !== normalized.id)];
      setAnimeList(newList);
      await saveToIDB(newList);

      if (isSupabaseConfigured && supabase) {
        const payload = { ...normalized };
        delete payload.created_at;
        const { error } = await supabase.from('anime').upsert([payload], { onConflict: 'id' });
        if (error) throw error;
        setIsCloudSynced(true);
        setCloudSyncError(null);
      }
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      setAnimeList(previousList);
      await saveToIDB(previousList);
      setIsCloudSynced(false);
      setCloudSyncError(e instanceof Error ? `クラウドへの保存に失敗しました: ${e.message}` : 'クラウドへの保存に失敗しました。');
      return false;
    }
  };

  const bulkUpsert = async (list: Anime[]): Promise<boolean> => {
    const previousList = animeList;
    try {
      const normalizedList = list.map(normalizeAnime);
      if (normalizedList.some(anime => !anime.id || !anime.title)) throw new Error('IDまたはタイトルがない作品が含まれています。');
      const map = new Map(animeList.map(a => [a.id, a]));
      normalizedList.forEach(a => map.set(a.id, a));
      const newList = Array.from(map.values());
      setAnimeList(newList);
      await saveToIDB(newList);

      if (isSupabaseConfigured && supabase) {
        // 分割して送信（念のため）
        const chunkSize = 50;
        for (let i = 0; i < normalizedList.length; i += chunkSize) {
          const chunk = normalizedList.slice(i, i + chunkSize);
          const chunkWithoutCreatedAt = chunk.map((item) => {
            const payload = { ...item };
            delete payload.created_at;
            return payload;
          });
          const { error } = await supabase.from('anime').upsert(chunkWithoutCreatedAt, { onConflict: 'id' });
          if (error) throw error;
        }
        setIsCloudSynced(true);
        setCloudSyncError(null);
      }
      return true;
    } catch (e) {
      console.error('Bulk save failed:', e);
      setAnimeList(previousList);
      await saveToIDB(previousList);
      setIsCloudSynced(false);
      setCloudSyncError(e instanceof Error ? `クラウドへの一括保存に失敗しました: ${e.message}` : 'クラウドへの一括保存に失敗しました。');
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
      cloudSyncError,
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
