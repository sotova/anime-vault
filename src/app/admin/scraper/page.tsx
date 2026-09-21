'use client';

import { useState } from 'react';
import { utils, writeFileXLSX } from 'xlsx';
import Link from 'next/link';
import { Anime } from '@/types/anime';

export default function ScraperPage() {
  const [mode, setMode] = useState<'url' | 'paste'>('url');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState<'list' | 'single'>('list');
  const [pasteText, setPasteText] = useState('');
  const [pasteItems, setPasteItems] = useState<{ title: string; tags: string[] }[]>([]);

  const normalizeWhitespace = (text: string) => text.replace(/\r\n?/g, '\n');
  const cleanTitle = (text: string) => text.replace(/\*+/g, '').replace(/#+/g, '').replace(/ロゴ\s*$/, '').trim();
  const seasonPattern = /^\d{4}年(春|夏|秋|冬|未定)$/;
  const stopLabels = ['作品名', '通名', '略称', '原作者', '監督', '制作会社', '制作年', '製作', 'キャスト', 'スタッフ', '放送時期', '放送', 'コメント', '公式サイト', '話数', '評価', 'マイリスト', '編集', 'コピーライト', 'カテゴリー', 'menu', '登録'];

  const parseListText = (rawText: string) => {
    const lines = normalizeWhitespace(rawText).split('\n').map(line => line.trim()).filter(Boolean);
    const results: { title: string; tags: string[] }[] = [];
    let index = 0;
    while (index < lines.length) {
      const isTripleTitle = index + 2 < lines.length && lines[index] === lines[index + 1] && lines[index] === lines[index + 2];
      if (!isTripleTitle) { index += 1; continue; }
      const title = lines[index];
      let next = index + 3;
      if (/^\d+$/.test(lines[next] || '')) next += 1;
      if (lines[next] === title) next += 1;
      while (seasonPattern.test(lines[next] || '')) next += 1;
      const tags: string[] = [];
      while (next < lines.length) {
        const nextIsTripleTitle = next + 2 < lines.length && lines[next] === lines[next + 1] && lines[next] === lines[next + 2];
        if (nextIsTripleTitle) break;
        if (!seasonPattern.test(lines[next])) tags.push(lines[next]);
        next += 1;
      }
      results.push({ title, tags: Array.from(new Set(tags)) });
      index = next;
    }
    return results;
  };

  const parseSingleText = (rawText: string) => {
    const text = normalizeWhitespace(rawText);
    const titleMatch = text.match(/作品名\s*[:：]?\s*\*{0,2}\s*([^\n]+)/) || text.match(/^([^\n]{1,40})\s*ロゴ\s*$/m);
    const firstLine = text.split('\n').map(line => line.trim()).find(Boolean) || '';
    const title = cleanTitle(titleMatch?.[1] || firstLine);
    const tagLabel = /タグ\s*[:：]?\s*/;
    const tagIndex = text.search(tagLabel);
    if (tagIndex < 0) return { title, tags: [] };
    const labelMatch = text.slice(tagIndex).match(tagLabel);
    const rest = text.slice(tagIndex + (labelMatch?.[0].length || 0));
    const cutIndex = stopLabels.reduce((current, label) => {
      const match = rest.match(new RegExp(`(^|\\n)\\s*\\*{0,2}${label}\\s*[:：\\*]`));
      return match?.index !== undefined ? Math.min(current, match.index) : current;
    }, rest.length);
    const tags = rest.slice(0, cutIndex).split(/[\n、,，\/#]+/).map(tag => tag.replace(/\*+/g, '').trim()).filter(tag => tag && tag.length <= 20 && !/^https?:\/\//.test(tag));
    return { title, tags: Array.from(new Set(tags)) };
  };

  const parsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = pasteMode === 'list' ? parseListText(pasteText) : [parseSingleText(pasteText)];
    setPasteItems(current => [...current, ...parsed.filter(item => item.title)]);
    setPasteText('');
  };

  const downloadPasteXlsx = () => {
    if (pasteItems.length === 0) return;
    const rows = pasteItems.map(item => ({ タイトル: item.title, タグ: item.tags.join(',') }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'neoapo_tags');
    writeFileXLSX(wb, `neoapo_tags_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleScrapeToExcel = async () => {
    if (!scrapeUrl) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.animeList?.length > 0) {
        const excelData = data.animeList.map((a: Anime) => ({
          'タイトル': a.title,
          '放送季': a.season,
          '話数': a.total_episodes,
          'あらすじ': a.synopsis,
          '画像URL': a.image_url,
          '公式サイト': a.official_site,
          'コピーライト': a.copyright,
          'タグ': Array.isArray(a.tags) ? a.tags.join(', ') : ''
        }));

        const ws = utils.json_to_sheet(excelData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "ScrapedData");
        const seasonName = data.animeList[0]?.season ? (data.animeList[0].season + 'アニメ') : ('Anime_Export_' + new Date().getTime());
        writeFileXLSX(wb, `${seasonName}.xlsx`);
        setScrapeUrl('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: '#1d1b20' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/admin" style={{ color: '#6750a4', textDecoration: 'none', fontSize: '14px' }}>← 管理画面に戻る</Link>
        <h1 style={{ color: '#1d1b20', fontSize: '32px', marginTop: '20px' }}>🌐 自動取得ツール</h1>
        <p style={{ color: '#49454f', marginTop: '10px' }}>アニメイトタイムズのURLから全作品を抽出し、エクセル(XLSX)を生成します。</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button type="button" onClick={() => setMode('url')} style={{ flex: 1, padding: '10px', background: mode === 'url' ? 'var(--primary)' : 'var(--surface-container)', color: mode === 'url' ? 'var(--on-primary)' : 'var(--on-surface-variant)', border: '1px solid var(--outline)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>URLから取得</button>
        <button type="button" onClick={() => setMode('paste')} style={{ flex: 1, padding: '10px', background: mode === 'paste' ? 'var(--primary)' : 'var(--surface-container)', color: mode === 'paste' ? 'var(--on-primary)' : 'var(--on-surface-variant)', border: '1px solid var(--outline)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>貼り付けから抽出</button>
      </div>

      <div style={{ background: '#fffbff', padding: '40px', borderRadius: '24px', border: '1px solid #cac4d0' }}>
        {mode === 'paste' ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setPasteMode('list')} style={{ flex: 1, padding: '8px', background: pasteMode === 'list' ? 'var(--primary)' : 'var(--surface-container)', color: pasteMode === 'list' ? 'var(--on-primary)' : 'var(--on-surface-variant)', border: '1px solid var(--outline)', borderRadius: '8px', cursor: 'pointer' }}>一覧ページ</button>
              <button type="button" onClick={() => setPasteMode('single')} style={{ flex: 1, padding: '8px', background: pasteMode === 'single' ? 'var(--primary)' : 'var(--surface-container)', color: pasteMode === 'single' ? 'var(--on-primary)' : 'var(--on-surface-variant)', border: '1px solid var(--outline)', borderRadius: '8px', cursor: 'pointer' }}>詳細ページ</button>
            </div>
            <label style={{ display: 'block', color: '#49454f', fontSize: '13px', marginBottom: '10px' }}>サイト本文を貼り付け</label>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="neoapoのページ本文を貼り付けてください..." style={{ width: '100%', minHeight: '180px', padding: '14px', background: '#f3edf7', border: '1px solid #79747e', borderRadius: '12px', color: '#1d1b20', resize: 'vertical', font: 'inherit' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button type="button" onClick={parsePaste} disabled={!pasteText.trim()} style={{ padding: '12px 18px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>解析して追加</button>
              <button type="button" onClick={() => setPasteText('')} style={{ padding: '12px 18px', background: 'transparent', color: 'var(--on-surface-variant)', border: '1px solid var(--outline)', borderRadius: '10px', cursor: 'pointer' }}>貼り付け欄をクリア</button>
              <button type="button" onClick={downloadPasteXlsx} disabled={!pasteItems.length} style={{ padding: '12px 18px', background: 'var(--primary-container)', color: 'var(--on-primary-container)', border: '1px solid var(--primary-container)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>XLSXダウンロード ({pasteItems.length}件)</button>
            </div>
            {pasteItems.length > 0 && <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto', background: 'var(--surface-container)', borderRadius: '10px', padding: '12px' }}>{pasteItems.map((item, index) => <div key={`${item.title}-${index}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--outline)' }}><strong>{item.title}</strong><div style={{ color: 'var(--on-surface-variant)', fontSize: '12px', marginTop: '4px' }}>{item.tags.length ? item.tags.join(' / ') : 'タグなし'}</div></div>)}</div>}
          </>
        ) : (
          <>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', color: '#49454f', fontSize: '13px', marginBottom: '10px' }}>対象のまとめURL</label>
          <input
            className="input"
            placeholder="https://www.animatetimes.com/tag/details.php?id=..."
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            style={{ width: '100%', padding: '16px', background: '#f3edf7', border: '1px solid #79747e', borderRadius: '12px', color: '#1d1b20', outline: 'none' }}
          />
        </div>

        {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '25px', fontSize: '14px' }}>⚠️ {error}</div>}

        <button
          onClick={handleScrapeToExcel}
          disabled={isProcessing || !scrapeUrl}
          style={{
            width: '100%', padding: '18px', background: isProcessing ? '#79747e' : '#6750a4',
            color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
          }}
        >
          {isProcessing ? 'サイトを解析中...' : '解析してエクセルをダウンロード'}
        </button>

        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(212, 168, 67, 0.05)', borderRadius: '12px', border: '1px solid rgba(212, 168, 67, 0.2)' }}>
          <h3 style={{ fontSize: '14px', color: '#6750a4', marginBottom: '10px' }}>💡 使い方</h3>
          <ul style={{ fontSize: '13px', color: '#49454f', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>解析が終わると自動で XLSX ファイルがダウンロードされます。</li>
            <li>ダウンロードしたファイルを Excel 等で開き、内容を確認・修正してください。</li>
            <li>管理画面の「インポート」からそのファイルを読み込めば一括登録完了です。</li>
          </ul>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
