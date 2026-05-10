import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url.includes('animatetimes.com')) {
      return NextResponse.json({ error: '現在はアニメイトタイムズのみ対応しています' }, { status: 400 });
    }

    // ブラウザになりすましてブロックを回避
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const animeList: any[] = [];

    // 最新の構造に対応
    $('section.c-tag-detail').each((_, el) => {
      const title = $(el).find('.c-tag-detail__title').text().trim();
      if (!title) return;

      const image_url = $(el).find('.c-tag-detail__image img').attr('src') || '';
      const synopsis = $(el).find('.c-tag-detail__description').text().trim();
      const copyright = $(el).find('.c-tag-detail__copy').text().trim();
      const official_site = $(el).find('a:contains("公式サイト")').attr('href') || '';

      const pageTitle = $('title').text();
      let season = '';
      const seasonMatch = pageTitle.match(/\d{4}年?\s*[春夏秋冬]/);
      if (seasonMatch) season = seasonMatch[0].replace('年', '');

      animeList.push({
        id: Math.random().toString(36).slice(2),
        title,
        synopsis,
        image_url,
        copyright,
        official_site,
        season,
        tags: [season].filter(Boolean),
        pv_url: '',
        total_episodes: 0
      });
    });

    return NextResponse.json({ animeList });
  } catch (error) {
    return NextResponse.json({ error: 'サイトの読み込みに失敗しました' }, { status: 500 });
  }
}
