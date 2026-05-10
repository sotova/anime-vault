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

    const animeList: Record<string, unknown>[] = [];

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
        
        // コピーライト: ©〇〇 or (C)〇〇 パターン
        const copyMatch = fullText.match(/(?:©|(?:\(|（)[Cc](?:\)|）)).{1,150}/);
        const copyright = copyMatch ? copyMatch[0].trim() : '';

        // 話数を取得: 全12話、全13回など
        const episodeMatch = fullText.match(/全(\d+)[話回]/);
        const total_episodes = episodeMatch ? parseInt(episodeMatch[1], 10) : 0;

        // あらすじ: 「作品名〇〇」の前のテキスト部分
        const synopsisMatch = fullText.match(/^([\s\S]*?)作品名/);
        const synopsis = synopsisMatch ? synopsisMatch[1].replace(title, '').trim().substring(0, 500) : '';

        // 公式サイトURL
        let official_site = '';
        $el.find('a').each((_, a) => {
          if ($(a).text().includes('公式サイト')) official_site = $(a).attr('href') || official_site;
        });

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
          total_episodes,
        });
      } catch {
        // block errors ignored
      }
    });

    // .tag_details_block が存在しない場合のフォールバック（別フォーマットの記事用）
    if (animeList.length === 0) {
      $('h2').each((_, el) => {
        const title = $(el).text().trim();
        // 関係ないh2（目次、ランキング、最新記事など）を除外
        if (!title || /目次|一覧|関連|最新記事|ランキング|おすすめ|特集|新着ラジオ|閲覧履歴/i.test(title)) return;

        let contentText = '';
        let image_url = '';
        let official_site = '';
        let nextEl = $(el).next();

        // 次のh2が来るまでテキストとリンク、画像を収集
        while (nextEl.length > 0 && nextEl[0].name !== 'h2' && nextEl[0].name !== 'style' && nextEl[0].name !== 'script') {
          contentText += nextEl.text() + '\n';
          if (!image_url) image_url = nextEl.find('img').attr('src') || '';
          if (!official_site) {
            nextEl.find('a').each((_, a) => {
              if ($(a).text().includes('公式サイト')) official_site = $(a).attr('href') || official_site;
            });
          }
          nextEl = nextEl.next();
        }

        const copyMatch = contentText.match(/(?:©|(?:\(|（)[Cc](?:\)|）)).{1,150}/);
        const copyright = copyMatch ? copyMatch[0].trim() : '';
        const synopsis = contentText.replace(title, '').replace(/[\n\t\r]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500);

        const episodeMatch = contentText.match(/全(\d+)[話回]/);
        const total_episodes = episodeMatch ? parseInt(episodeMatch[1], 10) : 0;

        if (image_url && !image_url.startsWith('http')) image_url = `https://www.animatetimes.com${image_url}`;

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
          total_episodes,
        });
      });
    }

    if (animeList.length === 0) {
      return NextResponse.json({ error: '作品データを取得できませんでした' }, { status: 404 });
    }

    return NextResponse.json({ animeList, count: animeList.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '予期しないエラーが発生しました';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
