import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url.includes('animatetimes.com')) {
      return NextResponse.json({ error: '現在はアニメイトタイムズのみ対応しています' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error('サイトへのアクセスに失敗しました');
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const animeList: any[] = [];

    // アニメイトタイムズの複数パターンのブロックに対応
    const selectors = [
      'section.c-tag-detail',
      '.tag_details_block',
      '.c-tag-detail',
      'article' // 最終手段
    ];

    let blocks: any = $();
    for (const s of selectors) {
      blocks = $(s);
      if (blocks.length > 0) break;
    }

    blocks.each((_: number, el: any) => {
      // タイトルの取得
      const title = $(el).find('h2, .c-tag-detail__title, .tag_details_block_title').first().text().trim();
      if (!title || title.length < 2) return;

      // 画像の取得
      const image_url = $(el).find('img').first().attr('src') || '';
      
      // あらすじの取得
      const synopsis = $(el).find('.c-tag-detail__description, .tag_details_block_text, p').first().text().trim();
      
      // コピーライト
      const copyright = $(el).find('.c-tag-detail__copy, .c-tag-detail__copyright, .copy').first().text().trim();
      
      // 公式サイト
      const official_site = $(el).find('a:contains("公式サイト"), a[href*="official"]').first().attr('href') || '';

      const pageTitle = $('title').text();
      let season = '';
      const seasonMatch = pageTitle.match(/\d{4}年?\s*[春夏秋冬]/);
      if (seasonMatch) season = seasonMatch[0].replace('年', '');

      animeList.push({
        id: Math.random().toString(36).slice(2),
        title,
        synopsis: synopsis.substring(0, 500), // 長すぎないように制限
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
      return NextResponse.json({ error: '作品を検出できませんでした。URLが正しいか確認してください。' }, { status: 404 });
    }

    return NextResponse.json({ animeList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '予期せぬエラーが発生しました' }, { status: 500 });
  }
}
