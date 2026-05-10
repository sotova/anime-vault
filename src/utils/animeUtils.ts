import { Anime } from '@/types/anime';

export function getBaseTitle(anime: Anime | string): string {
  const title = typeof anime === 'string' ? anime : anime.title;
  
  if (typeof anime !== 'string' && anime.tags) {
    const seriesTag = anime.tags.find(t => t.startsWith('series:'));
    if (seriesTag) return seriesTag.replace('series:', '');
  }

  if (!title) return '';
  return title
    .replace(/第?\d+[期巻章]/g, '')
    .replace(/シーズン\s*\d+/g, '')
    .replace(/Season\s*\d+/ig, '')
    .replace(/\s+\d+$/, '') // " 2"
    .replace(/[\s\-]+(?:II|III|IV|V|VI|VII|VIII|IX|X)$/, '') // " II"
    .replace(/（[^）]*）$/, '') // "（再放送）" etc.
    .replace(/\([^)]*\)$/, '')  // "(TVアニメ)" etc.
    .trim();
}

