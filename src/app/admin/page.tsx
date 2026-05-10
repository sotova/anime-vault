'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';
import Link from 'next/link';

const INITIAL_FORM: Omit<Anime, 'created_at'> = {
  id: '', title: '', tags: [], synopsis: '', image_url: '', pv_url: '', season: '', total_episodes: 0, official_site: '', copyright: ''
};

export default function AdminPage() {
  const { animeList, upsertAnime, bulkUpsert, deleteAnime, isCloudSynced } = useAnimeData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
    alert('作品を保存しました');
  };

  const startEdit = (anime: Anime) => {
    setForm({ ...anime });
    setTagInput(anime.tags.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = read(bstr, { type: 'binary' });
      const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      
      const getVal = (row: any, keys: string[]) => {
        const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
        return foundKey ? row[foundKey] : '';
      };

      const newList = data.map(row => ({
        id: Math.random().toString(36).slice(2),
        title: getVal(row, ['タイトル', '作品名', 'title']).toString(),
        tags: (getVal(row, ['タグ', 'tags']) || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean),
        synopsis: getVal(row, ['あらすじ', '内容', 'synopsis']).toString(),
        image_url: getVal(row, ['画像', '画像url', 'image']).toString(),
        pv_url: getVal(row, ['pv', 'pvurl', 'pv_url']).toString(),
        season: getVal(row, ['放送季', 'シーズン', 'season']).toString(),
        total_episodes: parseInt(getVal(row, ['話数', 'episodes'])) || 0,
        official_site: getVal(row, ['公式サイト', 'url']).toString(),
        copyright: getVal(row, ['コピーライト', 'copyright']).toString(),
      })).filter(a => a.title);

      if (newList.length > 0) {
        await bulkUpsert(newList);
        alert(`${newList.length}件をインポート完了しました`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '60px 40px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ 
            fontFamily: 'Georgia, serif', 
            fontStyle: 'italic', 
            fontSize: '48px', 
            color: '#d4a843', 
            marginBottom: '4px',
            textShadow: '0 4px 20px rgba(212,168,67,0.2)' 
          }}>
            Management
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginLeft: '4px' }}>データベース管理と一括操作</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link href="/admin/scraper" className="nav-btn">🌐 自動取得ツール</Link>
          <div style={{ 
            background: isCloudSynced ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isCloudSynced ? '#22c55e' : '#ef4444'}`,
            color: isCloudSynced ? '#22c55e' : '#ef4444',
            padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
          }}>
            {isCloudSynced ? 'CLOUD ONLINE' : 'LOCAL ONLY'}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ background: '#111', padding: '50px', borderRadius: '40px', border: '1px solid #222', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '18px', color: '#d4a843', marginBottom: '35px', fontWeight: 'bold', borderLeft: '4px solid #d4a843', paddingLeft: '15px' }}>
          新規登録 / 編集
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '50px' }}>
          
          {/* 左カラム */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="form-group">
              <label>タイトル</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="アニメのタイトルを入力" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div className="form-group">
                <label>放送季 / 年代</label>
                <input className="input" value={form.season} onChange={e => setForm({...form, season: e.target.value})} placeholder="2026 春" />
              </div>
              <div className="form-group">
                <label>総話数</label>
                <input className="input" type="number" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} placeholder="0" />
              </div>
            </div>

            <div className="form-group">
              <label>あらすじ</label>
              <textarea className="input" rows={6} value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} placeholder="ストーリーの概要..." />
            </div>

            <div className="form-group">
              <label>PV URL</label>
              <input className="input" value={form.pv_url} onChange={e => setForm({...form, pv_url: e.target.value})} placeholder="YouTube URL 等" />
            </div>
            
            <div className="form-group">
              <label>タグ (カンマ区切り)</label>
              <input className="input" value={tagInput} onChange={e => {
                setTagInput(e.target.value);
                setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
              }} placeholder="ファンタジー, 冒険, 2026..." />
            </div>
          </div>

          {/* 右カラム */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="form-group">
              <label>画像プレビュー (3:4)</label>
              <div style={{ 
                width: '100%', aspectRatio: '3/4', background: '#000', borderRadius: '20px', overflow: 'hidden', 
                border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
              }}>
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '14px', color: '#222', fontWeight: 'bold' }}>NO IMAGE</span>
                )}
              </div>
              <input className="input" style={{ marginTop: '10px', fontSize: '13px' }} placeholder="画像URLをペースト..." value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
            </div>
            
            <div className="form-group" style={{ marginTop: 'auto' }}>
              <label>XLSX インポート</label>
              <div className="file-wrapper">
                <input type="file" accept=".xlsx" onChange={handleFileUpload} />
                <div className="file-btn">ファイルをアップロード</div>
              </div>
            </div>

            <button type="submit" className="save-btn">
              {form.id ? '更新を保存する' : 'この内容で登録する'}
            </button>
            {form.id && (
              <button type="button" onClick={() => { setForm(INITIAL_FORM); setTagInput(''); }} className="cancel-btn">
                編集をキャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Area */}
      <section>
        <h2 style={{ fontSize: '22px', color: '#d4a843', marginBottom: '30px', fontWeight: 'bold' }}>作品リスト ({animeList.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {animeList.map(a => (
            <div key={a.id} className="list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '25px', flex: 1 }}>
                <div style={{ width: '44px', height: '60px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid #222' }}>
                  {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{a.season} • {a.total_episodes}話</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => startEdit(a)} className="action-btn edit">編集</button>
                <button onClick={() => deleteAnime(a.id)} className="action-btn delete">削除</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .form-group { display: flex; flex-direction: column; gap: 10px; }
        .label { font-size: 13px; color: #666; font-weight: bold; }
        .input {
          width: 100%; padding: 16px; background: #000; border: 1px solid #222; border-radius: 14px; color: #fff; font-size: 15px; outline: none; box-sizing: border-box; transition: all 0.2s;
        }
        .input:focus { border-color: #d4a843; box-shadow: 0 0 15px rgba(212,168,67,0.1); }
        .save-btn {
          padding: 20px; background: #d4a843; color: #000; border-radius: 16px; border: none; font-size: 18px; font-weight: bold; cursor: pointer; transition: all 0.2s;
        }
        .save-btn:hover { background: #f0c15a; transform: translateY(-2px); }
        .cancel-btn {
          padding: 12px; background: #222; color: #fff; border: none; border-radius: 12px; font-size: 14px; cursor: pointer; margin-top: 5px;
        }
        .nav-btn {
          padding: 12px 24px; background: #111; color: #d4a843; border: 1px solid #d4a843; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold; transition: all 0.2s;
        }
        .nav-btn:hover { background: #d4a843; color: #000; }
        .list-item {
          background: #111; padding: 18px 30px; border: 1px solid #222; border-radius: 20px; display: flex; align-items: center; transition: all 0.2s;
        }
        .list-item:hover { border-color: #d4a84333; background: #151515; transform: translateX(5px); }
        .action-btn {
          padding: 10px 20px; border-radius: 10px; border: none; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.2s;
        }
        .action-btn.edit { background: #222; color: #fff; }
        .action-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .action-btn:hover { opacity: 0.8; }
        .file-wrapper { position: relative; overflow: hidden; }
        .file-wrapper input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .file-btn { padding: 15px; background: #1a1a1a; border: 2px dashed #333; border-radius: 14px; color: #666; text-align: center; font-size: 14px; }
      `}</style>
    </div>
  );
}
