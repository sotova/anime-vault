import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url.includes('animatetimes.com')) {
      return NextResponse.json({ error: '現在はアニメイトタイムズのみ対応しています' }, { status: 400 });
    }

    // ブロック回避のためのヘッダー設定
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    });

    if (!response.ok) throw new Error('アクセスが拒否されました');
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const animeList: any[] = [];

    // アニメイトタイムズの作品ブロック (tag_details_block もしくは c-tag-detail)
    // 複数のパターンに対応
    const blocks = $('.tag_details_block, section.c-tag-detail');

    blocks.each((_, el) => {
      const title = $(el).find('h2, .c-tag-detail__title').first().text().trim();
      if (!title) return;

      const image_url = $(el).find('img').first().attr('src') || '';
      const synopsis = $(el).find('.tag_details_block_text, .c-tag-detail__description').first().text().trim();
      const copyright = $(el).find('.c-tag-detail__copy, .c-tag-detail__copyright').first().text().trim();
      const official_site = $(el).find('a:contains("公式サイト")').first().attr('href') || '';

      const pageTitle = $('title').text();
      let season = '';
      const seasonMatch = pageTitle.match(/\d{4}年?\s*[春夏秋冬]/);
      if (seasonMatch) {
        season = seasonMatch[0].replace('年', '');
      }

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

    if (animeList.length === 0) {
      return NextResponse.json({ error: '作品が見つかりませんでした。サイト構造を確認してください。' }, { status: 404 });
    }

    return NextResponse.json({ animeList });
  } catch (error: any) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: error.message || '取得失敗' }, { status: 500 });
  }
}
