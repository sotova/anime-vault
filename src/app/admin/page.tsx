'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';

const INITIAL_FORM: Omit<Anime, 'created_at'> = {
  id: '',
  title: '',
  tags: [],
  synopsis: '',
  image_url: '',
  pv_url: '',
  season: '',
  total_episodes: 0,
  official_site: '',
  copyright: ''
};

export default function AdminPage() {
  const { animeList, upsertAnime, deleteAnime, isCloudSynced } = useAnimeData();
  
  // フォーム・編集用
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // インポート用
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // 手動保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return alert('タイトルを入力してください');
    
    const finalData = { 
      ...form, 
      id: form.id || Math.random().toString(36).slice(2) 
    };
    
    await upsertAnime(finalData);
    alert(isEditing ? '更新しました' : '登録しました');
    setForm(INITIAL_FORM);
    setTagInput('');
    setIsEditing(false);
  };

  // 編集開始
  const startEdit = (anime: Anime) => {
    setForm({ ...anime });
    setTagInput(anime.tags.join(', '));
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // URLから自動取得
  const handleAutoImport = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    setImportError(null);

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
          if (animeList.some(a => a.title === anime.title)) continue;
          await upsertAnime(anime);
          count++;
        }
        alert(`${count} 件の作品を自動登録しました！`);
        setScrapeUrl('');
      } else {
        alert('作品が見つかりませんでした。サイトの構造が変更された可能性があります。');
      }
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  // XLSXインポート
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = utils.sheet_to_json(ws) as any[];

      let count = 0;
      for (const row of data) {
        const title = row['タイトル'] || row['作品名'] || row['Title'];
        if (!title || animeList.some(a => a.title === title)) continue;

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
        await upsertAnime(newAnime);
        count++;
      }
      alert(`${count}件をインポートしました！`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ color: '#d4a843', marginBottom: '32px', fontSize: '32px' }}>管理パネル</h1>

      {/* Cloud Status */}
      <div style={{ 
        padding: '12px 20px', borderRadius: '8px', marginBottom: '32px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
        background: isCloudSynced ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isCloudSynced ? '#22c55e' : '#ef4444'}`,
        color: isCloudSynced ? '#22c55e' : '#ef4444',
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
        {isCloudSynced ? 'クラウド同期中（正常）' : 'クラウド未接続（環境変数を確認してください）'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* LEFT: Manual Form */}
        <section style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #222' }}>
          <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '24px' }}>
            {isEditing ? '作品を編集' : '新しい作品を追加'}
          </h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>タイトル *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>画像URL</label>
              <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
            </div>
            <div className="form-group">
              <label>放送季 (例: 2026 春)</label>
              <input value={form.season} onChange={e => setForm({...form, season: e.target.value})} />
            </div>
            <div className="form-group">
              <label>話数</label>
              <input type="number" value={form.total_episodes} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
            </div>
            <div className="form-group">
              <label>あらすじ</label>
              <textarea rows={4} value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} />
            </div>
            <div className="form-group">
              <label>タグ (カンマ区切り)</label>
              <input value={tagInput} onChange={e => {
                setTagInput(e.target.value);
                setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
              }} />
            </div>
            <div className="form-group">
              <label>公式サイト URL</label>
              <input value={form.official_site} onChange={e => setForm({...form, official_site: e.target.value})} />
            </div>
            <div className="form-group">
              <label>コピーライト</label>
              <input value={form.copyright} onChange={e => setForm({...form, copyright: e.target.value})} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '14px', background: '#d4a843', color: '#000', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                {isEditing ? '更新内容を保存' : '作品を登録'}
              </button>
              {isEditing && (
                <button type="button" onClick={() => { setForm(INITIAL_FORM); setTagInput(''); setIsEditing(false); }} style={{ padding: '14px', background: '#333', color: '#fff', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
                  キャンセル
                </button>
              )}
            </div>
          </form>
        </section>

        {/* RIGHT: Batch Import */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* URL Scraper */}
          <div style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '16px' }}>URLから自動取得</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>アニメイトタイムズのURLを入力すると、全作品を自動で解析して保存します。</p>
            <input
              placeholder="https://www.animatetimes.com/tag/details.php?id=..."
              value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff', marginBottom: '16px' }}
            />
            {importError && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{importError}</div>}
            <button onClick={handleAutoImport} disabled={isScraping || !scrapeUrl} style={{ width: '100%', padding: '14px', background: isScraping ? '#444' : '#d4a843', color: '#000', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              {isScraping ? '取得中...' : 'データを自動取得して一括登録'}
            </button>
          </div>

          {/* XLSX Import */}
          <div style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '16px' }}>Excel (XLSX) インポート</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>エクセルファイルから一括登録します。</p>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ width: '100%', padding: '20px', border: '2px dashed #333', borderRadius: '12px', color: '#888' }} />
          </div>

        </section>
      </div>

      {/* Bottom: Manage List */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '24px', color: '#d4a843', marginBottom: '24px' }}>作品リストの管理 ({animeList.length} 件)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {animeList.map(a => (
            <div key={a.id} style={{ background: '#111', padding: '16px', borderRadius: '12px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{a.season}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                <button onClick={() => startEdit(a)} style={{ padding: '6px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>編集</button>
                <button onClick={() => { if(confirm('本当に削除しますか？')) deleteAnime(a.id); }} style={{ padding: '6px 12px', background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 13px; color: #888; }
        .form-group input, .form-group textarea {
          padding: 12px; background: #000; border: 1px solid #333; border-radius: 8px; color: #fff; outline: none; transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: #d4a843; }
      `}</style>
    </div>
  );
}
