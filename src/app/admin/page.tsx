'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';

const INITIAL_FORM: Omit<Anime, 'created_at'> = {
  id: '', title: '', tags: [], synopsis: '', image_url: '', pv_url: '', season: '', total_episodes: 0, official_site: '', copyright: ''
};

export default function AdminPage() {
  const { animeList, upsertAnime, bulkUpsert, deleteAnime } = useAnimeData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 手動保存
  const handleSave = async () => {
    if (!form.title) return;
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
  };

  // URLから自動取得
  const handleAutoImport = async () => {
    if (!scrapeUrl) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url: scrapeUrl }) });
      const data = await res.json();
      if (data.animeList?.length > 0) {
        await bulkUpsert(data.animeList);
        alert(`${data.animeList.length}件を自動追加しました！`);
        setScrapeUrl('');
      } else { alert('作品が見つかりませんでした。'); }
    } catch { alert('取得失敗'); }
    finally { setIsProcessing(false); }
  };

  // XLSX一括インポート
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = read(bstr, { type: 'binary' });
      const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      const newList = data.map(row => ({
        id: Math.random().toString(36).slice(2),
        title: row['タイトル'] || row['作品名'] || row['Title'],
        tags: (row['タグ'] || row['Tags'] || '').split(',').map((s: any) => s.trim()).filter(Boolean),
        synopsis: row['あらすじ'] || row['Synopsis'] || '',
        image_url: row['画像'] || row['Image'] || '',
        pv_url: row['PV'] || '',
        season: row['放送季'] || row['Season'] || '',
        total_episodes: parseInt(row['話数']) || 0,
        official_site: row['公式サイト'] || '',
        copyright: row['コピーライト'] || ''
      })).filter(a => a.title);
      await bulkUpsert(newList);
      alert(`${newList.length}件をすべて追加しました！`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '40px', background: '#000', minHeight: '100vh', color: '#fff' }}>
      
      {/* 1. Mockup Design UI */}
      <div style={{ 
        background: '#444', padding: '40px', borderRadius: '60px', 
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', 
        maxWidth: '1000px', margin: '0 auto 40px' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input className="mock-input" placeholder="アニメのタイトルを入力" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <input className="mock-input" placeholder="放送日を入力(もしくは季を選択)" value={form.season} onChange={e => setForm({...form, season: e.target.value})} />
          <textarea className="mock-input" style={{ height: '200px' }} placeholder="アニメのあらすじを入力" value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} />
          <input className="mock-input" placeholder="タグの選択または追加" value={tagInput} onChange={e => {
            setTagInput(e.target.value);
            setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="mock-box" style={{ height: '200px' }}>
            <textarea placeholder="アニメの画像を挿入" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
          </div>
          <div className="mock-box" style={{ height: '100px' }}>
            <input placeholder="アニメのPVを挿入" value={form.pv_url} onChange={e => setForm({...form, pv_url: e.target.value})} />
          </div>
          <input className="mock-input" style={{ textAlign: 'center' }} placeholder="総話数" type="number" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
          <button onClick={handleSave} style={{ marginTop: 'auto', padding: '15px', background: '#d4a843', color: '#000', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>保存</button>
        </div>
      </div>

      {/* 2. Import Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '1000px', margin: '0 auto 40px' }}>
        <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #333' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', color: '#d4a843' }}>URLから一括取得 (アニメイトタイムズ)</div>
          <input placeholder="URLを入力..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #444', borderRadius: '8px', color: '#fff', marginBottom: '10px' }} />
          <button onClick={handleAutoImport} disabled={isProcessing} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{isProcessing ? '取得中...' : '自動取得して登録'}</button>
        </div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #333' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px', color: '#d4a843' }}>XLSXファイルから一括登録</div>
          <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ color: '#888', fontSize: '12px' }} />
        </div>
      </div>

      {/* 3. Manage List */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ fontSize: '20px', marginBottom: '20px', color: '#d4a843' }}>登録済み作品 ({animeList.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
          {animeList.map(a => (
            <div key={a.id} style={{ background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => { setForm({...a}); setTagInput(a.tags.join(', ')); }} style={{ padding: '4px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>編集</button>
                <button onClick={() => deleteAnime(a.id)} style={{ padding: '4px 8px', background: '#551111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .mock-input {
          width: 100%; padding: 15px; background: #000; border: none; border-radius: 12px; color: #fff; font-size: 16px; outline: none; box-sizing: border-box;
        }
        .mock-box {
          background: #000; border-radius: 24px; padding: 15px; display: flex; flex-direction: column;
        }
        .mock-box textarea {
          width: 100%; height: 100%; background: transparent; border: none; color: #fff; resize: none; outline: none; font-size: 16px;
        }
        ::placeholder { color: #aaa; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; }
      `}</style>
    </div>
  );
}
