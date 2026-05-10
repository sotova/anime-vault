import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('animatetimes.com')) {
      return NextResponse.json({ error: 'アニメイトタイムズのURLを入力してください' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9',
        'Referer': 'https://www.animatetimes.com/',
      },
    });

    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // ページタイトルからシーズンを取得
    const pageTitle = $('title').text();
    let season = '';
    const seasonMatch = pageTitle.match(/(\d{4})年?([春夏秋冬])/);
    if (seasonMatch) season = `${seasonMatch[1]} ${seasonMatch[2]}`;

    const animeList: any[] = [];

    // アニメイトタイムズの各作品ブロック
    // 作品ブロックは .tag_details_contents 内に並ぶ div
    $('.tag_details_contents .tag_details_block').each((_, el) => {
      try {
        const $el = $(el);
        
        // タイトル
        const title = $el.find('.tag_details_block_title a').first().text().trim()
          || $el.find('h2').first().text().trim();
        if (!title) return;

        // 画像URL（絶対URLに変換）
        let image_url = $el.find('img').first().attr('src') || '';
        if (image_url && !image_url.startsWith('http')) {
          image_url = `https://www.animatetimes.com${image_url}`;
        }

        // 全テキストからコピーライト・あらすじを抽出
        const fullText = $el.text();
        
        // コピーライト: (C)〇〇 or ©〇〇 パターン
        const copyMatch = fullText.match(/[\(（]?[Cc©][\)）]?.{1,200}/);
        const copyright = copyMatch ? copyMatch[0].trim().substring(0, 150) : '';

        // あらすじ: 「作品名〇〇」の前のテキスト部分
        const synopsisMatch = fullText.match(/^([\s\S]*?)作品名/);
        const synopsis = synopsisMatch ? synopsisMatch[1].replace(title, '').trim().substring(0, 500) : '';

        // 公式サイトURL
        const official_site = $el.find('a:contains("公式サイト")').attr('href') || '';

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
          total_episodes: 0,
        });
      } catch (_) {}
    });

    // .tag_details_block が存在しない場合のフォールバック
    if (animeList.length === 0) {
      // タイトル一覧からリンクを取得
      const titleLinks: string[] = [];
      $('a[href*="#"]').each((_, a) => {
        const text = $(a).text().trim();
        const href = $(a).attr('href') || '';
        if (text && href.includes(url.split('?')[1]) && !titleLinks.includes(text)) {
          titleLinks.push(text);
        }
      });

      // 一意のタイトルをリスト化（重複除外）
      const uniqueTitles = [...new Set(titleLinks)];
      uniqueTitles.forEach(title => {
        animeList.push({
          id: Math.random().toString(36).slice(2),
          title,
          synopsis: '',
          image_url: '',
          copyright: '',
          official_site: '',
          season,
          tags: [season].filter(Boolean),
          pv_url: '',
          total_episodes: 0,
        });
      });
    }

    if (animeList.length === 0) {
      return NextResponse.json({ error: '作品データを取得できませんでした' }, { status: 404 });
    }

    return NextResponse.json({ animeList, count: animeList.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '予期しないエラーが発生しました' }, { status: 500 });
  }
}
