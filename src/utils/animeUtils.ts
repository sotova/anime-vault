import { Anime } from '@/types/anime';

export function getBaseTitle(anime: Anime | string): string {
  const title = typeof anime === 'string' ? anime : anime.title;
  
  if (typeof anime !== 'string' && anime.tags) {
    const seriesTag = anime.tags.find(t => t.startsWith('series:'));
    if (seriesTag) return seriesTag.replace('series:', '');
  }

  if (!title) return '';

  // サブタイトルや期数を除去するためのより強力な正規表現
  let base = title
    .replace(/[（(].*?[)）]$/, '') // 末尾のカッコを除去
    .replace(/\s*(?:第?\d+[期回巻章]|シーズン\s*\d+|Season\s*\d+|Part\s*\d+|後編|前編|完結編|総集編|劇場版|Final|SPECIAL|OAD|OVA|TVアニメ).*$/gi, '')
    .replace(/\s+\d+$/, '') // 末尾の数字
    .replace(/[\s\-]+(?:II|III|IV|V|VI|VII|VIII|IX|X)$/, '') // 末尾のローマ数字
    .trim();

  // 「呪術廻戦 死滅回游」などのケースに対応するため、
  // スペースが含まれる場合は最初の単語をベースとする（ただし短すぎる場合は除く）
  const parts = base.split(/\s+/);
  if (parts.length > 1 && parts[0].length >= 2) {
    // 最初の単語が「Re:」などの特殊なケースは除外
    if (!/^(?:Re:)$/i.test(parts[0])) {
      return parts[0];
    }
  }

  return base;
}

