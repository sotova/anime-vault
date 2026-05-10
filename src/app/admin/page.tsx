'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';

export default function AdminPage() {
  const { animeList, addAnime, supabaseStatus } = useAnimeData();
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URLから自動取得して登録
  const handleAutoImport = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    setError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.animeList && data.animeList.length > 0) {
        let count = 0;
        for (const anime of data.animeList) {
          // すでに同じタイトルの作品があればスキップ
          if (animeList.some(a => a.title === anime.title)) continue;
          await addAnime(anime);
          count++;
        }
        alert(`${count} 件の作品を自動登録しました！`);
        setScrapeUrl('');
      } else {
        alert('作品が見つかりませんでした。');
      }
    } catch (err: any) {
      setError(err.message || '取得に失敗しました。');
    } finally {
      setIsScraping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = utils.sheet_to_json(ws) as any[];

      let count = 0;
      for (const row of data) {
        const title = row['タイトル'] || row['作品名'] || row['Title'];
        if (!title) continue;

        // 重複チェック
        if (animeList.some(a => a.title === title)) continue;

        const newAnime: Omit<Anime, 'created_at'> = {
          id: Math.random().toString(36).slice(2),
          title: title,
          tags: (row['タグ'] || row['Tags'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          synopsis: row['あらすじ'] || row['内容'] || row['Synopsis'] || '',
          image_url: row['画像'] || row['画像URL'] || row['Image'] || '',
          pv_url: row['PV'] || row['PVURL'] || '',
          season: row['放送季'] || row['年代'] || row['Season'] || '',
          total_episodes: parseInt(row['話数'] || row['Episodes']) || 0,
          official_site: row['公式サイト'] || row['URL'] || '',
          copyright: row['コピーライト'] || row['権利表記'] || '',
        };

        await addAnime(newAnime);
        count++;
      }
      alert(`${count}件のアニメをインポートしました！`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#d4a843', marginBottom: '32px' }}>管理パネル</h1>

      {/* Supabase Status Bar */}
      <div style={{ 
        padding: '10px 20px', 
        borderRadius: '8px', 
        background: supabaseStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${supabaseStatus === 'connected' ? '#22c55e' : '#ef4444'}`,
        color: supabaseStatus === 'connected' ? '#22c55e' : '#ef4444',
        marginBottom: '32px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
        {supabaseStatus === 'connected' ? 'クラウド同期中（正常）' : 'クラウド未接続（環境変数を確認してください）'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* URL Auto Import Section */}
        <div style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #222' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>URLから自動一括登録</h2>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
            アニメイトタイムズの「まとめ一覧」URLを入力すると、全作品を自動で解析してクラウドに保存します。
          </p>
          
          <input
            type="text"
            placeholder="https://www.animatetimes.com/tag/details.php?id=..."
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            style={{ 
              width: '100%', padding: '12px', background: '#000', border: '1px solid #333', 
              borderRadius: '8px', color: '#fff', marginBottom: '16px', outline: 'none'
            }}
          />
          
          {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <button
            onClick={handleAutoImport}
            disabled={isScraping || !scrapeUrl}
            style={{
              width: '100%', padding: '14px', background: isScraping ? '#444' : '#d4a843', 
              color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', 
              cursor: isScraping ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}
          >
            {isScraping ? '解析・登録中...' : '作品データを自動取得して登録'}
          </button>
        </div>

        {/* Excel Import Section */}
        <div style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #222' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Excel/XLSX インポート</h2>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
            既存のリストがある場合は、XLSXファイルをアップロードして一括登録できます。
          </p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{ 
              width: '100%', padding: '40px 20px', border: '2px dashed #333', 
              borderRadius: '12px', color: '#888', textAlign: 'center', cursor: 'pointer'
            }}
          />
        </div>

      </div>

      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>現在の登録数: {animeList.length} 件</h2>
        <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #222' }}>
          {animeList.map((a) => (
            <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' }}>
              <span>{a.title}</span>
              <span style={{ color: '#666', fontSize: '12px' }}>{a.season}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
