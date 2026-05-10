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
    if (!form.title) return alert('タイトルを入力してください');
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
    alert('保存しました');
  };

  // 一括取得・登録
  const handleAutoImport = async () => {
    if (!scrapeUrl) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url: scrapeUrl }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.animeList?.length > 0) {
        await bulkUpsert(data.animeList);
        alert(`${data.animeList.length}件を追加しました！`);
        setScrapeUrl('');
      }
    } catch (e: any) { alert(e.message); }
    finally { setIsProcessing(false); }
  };

  // XLSXインポート (全件確実に登録)
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
        title: row['タイトル'] || row['作品名'] || row['Title'] || '',
        tags: (row['タグ'] || row['Tags'] || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean),
        synopsis: row['あらすじ'] || row['Synopsis'] || '',
        image_url: row['画像'] || row['Image'] || '',
        pv_url: row['PV'] || '',
        season: row['放送季'] || row['Season'] || '',
        total_episodes: parseInt(row['話数']) || 0,
        official_site: row['公式サイト'] || '',
        copyright: row['コピーライト'] || ''
      })).filter(a => a.title);

      if (newList.length > 0) {
        await bulkUpsert(newList);
        alert(`${newList.length}件をすべて追加しました！`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '40px', background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#d4a843', marginBottom: '40px', fontSize: '28px', fontWeight: 'bold' }}>Anime Manager</h1>

      {/* メインの入力エリア (画像のデザインを完全再現) */}
      <div style={{ 
        background: '#333', padding: '60px 40px', borderRadius: '80px', 
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', 
        maxWidth: '1100px', margin: '0 auto 60px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* 左カラム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <input className="img-input" placeholder="アニメのタイトルを入力" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <input className="img-input" placeholder="放送日を入力(もしくは季を選択)" value={form.season} onChange={e => setForm({...form, season: e.target.value})} />
          <textarea className="img-input" style={{ height: '280px', resize: 'none' }} placeholder="アニメのあらすじを入力" value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} />
          <input className="img-input" placeholder="タグの選択または追加" value={tagInput} onChange={e => {
            setTagInput(e.target.value);
            setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
          }} />
        </div>

        {/* 右カラム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div className="img-box" style={{ height: '280px' }}>
            <textarea placeholder="アニメの画像を挿入" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', color: '#fff', textAlign: 'center', fontSize: '18px', outline: 'none', resize: 'none' }} />
          </div>
          <div className="img-box" style={{ height: '120px' }}>
            <input placeholder="アニメのPVを挿入" value={form.pv_url} onChange={e => setForm({...form, pv_url: e.target.value})} style={{ background: 'transparent', border: 'none', width: '100%', color: '#fff', textAlign: 'center', fontSize: '18px', outline: 'none' }} />
          </div>
          <input className="img-input" style={{ textAlign: 'center' }} placeholder="総話数" type="number" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button onClick={handleSave} style={{ flex: 1, padding: '20px', background: '#000', color: '#fff', borderRadius: '15px', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>登録・保存</button>
            {form.id && <button onClick={() => { setForm(INITIAL_FORM); setTagInput(''); }} style={{ padding: '20px', background: '#444', color: '#fff', borderRadius: '15px', border: 'none', cursor: 'pointer' }}>取消</button>}
          </div>
        </div>
      </div>

      {/* インポート機能エリア (邪魔にならない場所に配置) */}
      <div style={{ maxWidth: '1100px', margin: '0 auto 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#111', padding: '25px', borderRadius: '25px', border: '1px solid #222' }}>
          <div style={{ color: '#d4a843', marginBottom: '15px', fontWeight: 'bold' }}>🌐 URLから自動一括登録</div>
          <input placeholder="アニメイトタイムズのURLを入力..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '10px', color: '#fff', marginBottom: '15px' }} />
          <button onClick={handleAutoImport} disabled={isProcessing} style={{ width: '100%', padding: '12px', background: '#d4a843', color: '#000', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{isProcessing ? '取得・登録中...' : '自動取得して登録'}</button>
        </div>
        <div style={{ background: '#111', padding: '25px', borderRadius: '25px', border: '1px solid #222', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#d4a843', marginBottom: '15px', fontWeight: 'bold' }}>📊 Excelファイル(XLSX)インポート</div>
          <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ color: '#888' }} />
        </div>
      </div>

      {/* 作品管理リスト (確認ダイアログなしで削除) */}
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ color: '#d4a843', marginBottom: '25px' }}>登録済み作品一覧 ({animeList.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {animeList.map(a => (
            <div key={a.id} style={{ background: '#111', padding: '15px', borderRadius: '15px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => { setForm({...a}); setTagInput(a.tags.join(', ')); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>編集</button>
                <button onClick={() => deleteAnime(a.id)} style={{ padding: '6px 12px', background: '#551111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .img-input {
          width: 100%; padding: 20px; background: #000; border: none; border-radius: 20px; color: #fff; font-size: 18px; outline: none; box-sizing: border-box;
        }
        .img-box {
          background: #000; border-radius: 30px; padding: 20px; display: flex; align-items: center; justify-content: center;
        }
        .img-input::placeholder { color: #666; text-align: center; }
        .img-box textarea::placeholder, .img-box input::placeholder { color: #666; }
      `}</style>
    </div>
  );
}
