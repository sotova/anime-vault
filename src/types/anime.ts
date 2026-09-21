export const ANIME_STATUS_STYLES = {
  '見たい': { background: 'var(--primary)', color: 'var(--on-primary)' },
  '視聴中': { background: '#006a6a', color: '#fff' },
  '完了': { background: '#2e7d32', color: '#fff' },
  '保留': { background: '#a15c00', color: '#fff' },
  '視聴切り': { background: '#b3261e', color: '#fff' },
} as const;

export type AnimeStatus = keyof typeof ANIME_STATUS_STYLES;
export const ANIME_STATUS_OPTIONS = Object.keys(ANIME_STATUS_STYLES) as AnimeStatus[];

export interface Anime {
  id: string;
  title: string;
  tags: string[];
  synopsis: string;
  pv_url: string;
  image_url: string;
  season: string;
  total_episodes: number;
  official_site?: string; // 公式サイト
  copyright?: string;    // コピーライト
  created_at?: string;
}

export interface UserAnimeData {
  status: AnimeStatus;
  rating: number; // 0-5
  progress: number;
}

export interface HybridAnime extends Anime {
  userData?: UserAnimeData;
}
