'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_FORM: Omit<Anime, 'created_at'> = {
  id: '', title: '', tags: [], synopsis: '', image_url: '', pv_url: '', season: '', total_episodes: 0, official_site: '', copyright: ''
};

export default function AdminPage() {
  const { animeList, upsertAnime, bulkUpsert, deleteAnime, isCloudSynced } = useAnimeData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 手動保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
    alert('保存しました');
  };

  // 編集モード
  const startEdit = (anime: Anime) => {
    setForm({ ...anime });
    setTagInput(anime.tags.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // URL取得
  const handleAutoImport = async () => {
    if (!scrapeUrl) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url: scrapeUrl }) });
      const data = await res.json();
      if (data.animeList?.length > 0) {
        await bulkUpsert(data.animeList);
        alert(`${data.animeList.length}件を追加しました！`);
        setScrapeUrl('');
      }
    } catch { alert('取得に失敗しました'); }
    finally { setIsProcessing(false); }
  };

  // XLSXインポート (キー判定を大幅強化)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = read(bstr, { type: 'binary' });
      const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      
      const newList = data.map(row => {
        // キーの揺らぎに対応
        const getVal = (keys: string[]) => {
          const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
          return foundKey ? row[foundKey] : '';
        };

        return {
          id: Math.random().toString(36).slice(2),
          title: getVal(['タイトル', '作品名', 'title', 'name']),
          tags: (getVal(['タグ', 'カテゴリ', 'tags', 'tag']) || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean),
          synopsis: getVal(['あらすじ', '内容', 'synopsis', 'description', 'story']),
          image_url: getVal(['画像', '画像url', 'image', 'image_url', 'image url', 'cover']),
          pv_url: getVal(['pv', 'pvurl', 'pv_url', 'pv url', 'trailer', 'video']),
          season: getVal(['放送季', 'シーズン', 'season', 'period']),
          total_episodes: parseInt(getVal(['話数', '総話数', 'episodes', 'total episodes'])) || 0,
          official_site: getVal(['公式サイト', 'url', 'official_site', 'official site', 'link']),
          copyright: getVal(['コピーライト', '権利表記', 'copyright', 'copy']),
        };
      }).filter(a => a.title);

      if (newList.length > 0) {
        await bulkUpsert(newList);
        alert(`${newList.length}件のインポートが完了しました！`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <header style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h1 style={{ color: '#d4a843', fontSize: '36px', marginBottom: '10px', fontStyle: 'italic', fontFamily: 'serif' }}>Admin Dashboard</h1>
        <p style={{ color: '#888', fontSize: '14px' }}>作品の登録・一括管理・データベース操作</p>
      </header>

      {/* Cloud Status */}
      <div style={{ 
        padding: '12px 20px', borderRadius: '12px', marginBottom: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(212, 168, 67, 0.05)', border: '1px solid rgba(212, 168, 67, 0.2)', color: '#d4a843'
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4a843', boxShadow: '0 0 10px #d4a843' }} />
        {isCloudSynced ? 'Cloud Database Connected' : 'Local Storage Mode'}
      </div>

      {/* 1. Main Edit Form */}
      <section style={{ background: '#111', padding: '40px', borderRadius: '24px', border: '1px solid #222', marginBottom: '50px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '30px', borderLeft: '4px solid #d4a843', paddingLeft: '15px' }}>
          {form.id ? '作品を編集' : '新規登録'}
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">タイトル</label>
            <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="作品名を入力..." />
          </div>

          <div>
            <label className="label">画像URL</label>
            <input className="input" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
          </div>
          <div>
            <label className="label">放送季 / 年代</label>
            <input className="input" value={form.season} onChange={e => setForm({...form, season: e.target.value})} placeholder="2026 春" />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">あらすじ</label>
            <textarea className="input" rows={4} value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} placeholder="ストーリーの概要..." />
          </div>

          <div>
            <label className="label">PV URL</label>
            <input className="input" value={form.pv_url} onChange={e => setForm({...form, pv_url: e.target.value})} placeholder="YouTube URL等" />
          </div>
          <div>
            <label className="label">総話数</label>
            <input className="input" type="number" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">タグ (カンマ区切り)</label>
            <input className="input" value={tagInput} onChange={e => {
              setTagInput(e.target.value);
              setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
            }} placeholder="ファンタジー, 冒険, 2026..." />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button type="submit" style={{ flex: 2, padding: '16px', background: '#d4a843', color: '#000', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '16px' }}>
              {form.id ? '更新を保存する' : '作品をデータベースに登録'}
            </button>
            {form.id && (
              <button type="button" onClick={() => { setForm(INITIAL_FORM); setTagInput(''); }} style={{ flex: 1, padding: '16px', background: '#222', color: '#fff', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer' }}>キャンセル</button>
            )}
          </div>
        </form>
      </section>

      {/* 2. Advanced Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '60px' }}>
        <div style={{ background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #222' }}>
          <h3 style={{ fontSize: '15px', color: '#d4a843', marginBottom: '15px' }}>URLからインポート</h3>
          <input className="input" style={{ marginBottom: '15px', fontSize: '13px' }} placeholder="アニメイトタイムズのURL..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} />
          <button onClick={handleAutoImport} disabled={isProcessing} className="tool-btn">{isProcessing ? '取得中...' : '自動解析して追加'}</button>
        </div>
        <div style={{ background: '#111', padding: '30px', borderRadius: '20px', border: '1px solid #222' }}>
          <h3 style={{ fontSize: '15px', color: '#d4a843', marginBottom: '15px' }}>XLSXインポート</h3>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>※画像・PV・話数も自動判別して登録されます</p>
          <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ fontSize: '13px', color: '#888' }} />
        </div>
      </div>

      {/* 3. Manage List (1 Column View) */}
      <section>
        <h2 style={{ fontSize: '20px', marginBottom: '25px', color: '#d4a843' }}>登録済み作品一覧 ({animeList.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {animeList.map(a => (
            <div key={a.id} className="list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                <div style={{ width: '40px', height: '56px', borderRadius: '4px', background: '#222', backgroundImage: `url(${a.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{a.season} • {a.total_episodes}話</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(a)} className="action-btn edit">編集</button>
                <button onClick={() => deleteAnime(a.id)} className="action-btn delete">削除</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .label { display: block; font-size: 13px; color: #888; marginBottom: 8px; }
        .input {
          width: 100%; padding: 14px; background: #000; border: 1px solid #222; border-radius: 10px; color: #fff; font-size: 15px; outline: none; transition: border-color 0.2s;
        }
        .input:focus { border-color: #d4a843; }
        .tool-btn {
          width: 100%; padding: 12px; background: #222; color: #d4a843; border: 1px solid #d4a843; border-radius: 10px; cursor: pointer; font-weight: bold; transition: all 0.2s;
        }
        .tool-btn:hover { background: #d4a843; color: #000; }
        .list-item {
          background: #111; padding: 15px 20px; borderRadius: 16px; border: 1px solid #222; display: flex; justify-content: space-between; align-items: center; transition: transform 0.2s;
        }
        .list-item:hover { border-color: #333; transform: translateX(5px); }
        .action-btn {
          padding: 8px 16px; border-radius: 8px; border: none; font-size: 12px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;
        }
        .action-btn.edit { background: #222; color: #fff; }
        .action-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .action-btn:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
