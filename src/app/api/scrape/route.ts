import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url.includes('animatetimes.com')) {
      return NextResponse.json({ error: '現在はアニメイトタイムズのみ対応しています' }, { status: 400 });
    }

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const animeList: any[] = [];

    // アニメイトタイムズの作品ブロックを解析
    // セレクタは実際のHTML構造に合わせて調整
    $('.tag_details_block').each((_, el) => {
      const title = $(el).find('h2').text().trim();
      if (!title) return;

      const image_url = $(el).find('img').attr('src') || '';
      
      // あらすじ・スタッフ・キャストなどが含まれるテキスト
      const fullText = $(el).find('.tag_details_block_text').text();
      
      // あらすじの抽出 (作品名〜放送形態の間などを抜粋)
      let synopsis = '';
      const synopMatch = fullText.match(/([\s\S]*?)作品名/);
      if (synopMatch) synopsis = synopMatch[1].trim();

      // コピーライトの抽出
      let copyright = '';
      const copyMatch = fullText.match(/\(C\).*|©.*/);
      if (copyMatch) copyright = copyMatch[0].trim();

      // 公式サイト
      const official_site = $(el).find('a[href*="official"]').attr('href') || 
                            $(el).find('a:contains("公式サイト")').attr('href') || '';

      // シーズンの抽出 (タイトルやパンくずから判定)
      const seasonTitle = $('h1').text();
      let season = '';
      const seasonMatch = seasonTitle.match(/\d{4}年?\s*[春夏秋冬]/);
      if (seasonMatch) {
        season = seasonMatch[0].replace('年', ''); // 「2026 春」形式に
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

    return NextResponse.json({ animeList });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'サイトの読み込みに失敗しました' }, { status: 500 });
  }
}
