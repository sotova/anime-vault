export type AnimeStatus = '見たい' | '視聴中' | '完了' | '保留' | '視聴切り';

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
