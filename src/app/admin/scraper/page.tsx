'use client';

import { useState } from 'react';
import { utils, writeFileXLSX } from 'xlsx';
import Link from 'next/link';

export default function ScraperPage() {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const excelData = data.animeList.map((a: Record<string, unknown>) => ({
          'タイトル': a.title,
          '放送季': a.season,
          'あらすじ': a.synopsis,
          '画像URL': a.image_url,
          '公式サイト': a.official_site,
          'コピーライト': a.copyright,
          'タグ': a.tags.join(', ')
        }));

        const ws = utils.json_to_sheet(excelData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "ScrapedData");
        writeFileXLSX(wb, `Anime_Export_${new Date().getTime()}.xlsx`);
        setScrapeUrl('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/admin" style={{ color: '#d4a843', textDecoration: 'none', fontSize: '14px' }}>← 管理画面に戻る</Link>
        <h1 style={{ color: '#fff', fontSize: '32px', marginTop: '20px' }}>🌐 自動取得ツール</h1>
        <p style={{ color: '#888', marginTop: '10px' }}>アニメイトタイムズのURLから全作品を抽出し、エクセル(XLSX)を生成します。</p>
      </div>

      <div style={{ background: '#111', padding: '40px', borderRadius: '24px', border: '1px solid #222', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '10px' }}>対象のまとめURL</label>
          <input
            className="input"
            placeholder="https://www.animatetimes.com/tag/details.php?id=..."
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            style={{ width: '100%', padding: '16px', background: '#000', border: '1px solid #222', borderRadius: '12px', color: '#fff', outline: 'none' }}
          />
        </div>

        {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '25px', fontSize: '14px' }}>⚠️ {error}</div>}

        <button
          onClick={handleScrapeToExcel}
          disabled={isProcessing || !scrapeUrl}
          style={{
            width: '100%', padding: '18px', background: isProcessing ? '#333' : '#d4a843', 
            color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
          }}
        >
          {isProcessing ? 'サイトを解析中...' : '解析してエクセルをダウンロード'}
        </button>

        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(212, 168, 67, 0.05)', borderRadius: '12px', border: '1px solid rgba(212, 168, 67, 0.2)' }}>
          <h3 style={{ fontSize: '14px', color: '#d4a843', marginBottom: '10px' }}>💡 使い方</h3>
          <ul style={{ fontSize: '13px', color: '#aaa', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>解析が終わると自動で XLSX ファイルがダウンロードされます。</li>
            <li>ダウンロードしたファイルを Excel 等で開き、内容を確認・修正してください。</li>
            <li>管理画面の「インポート」からそのファイルを読み込めば一括登録完了です。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
