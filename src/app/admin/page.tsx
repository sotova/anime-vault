'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';
import Link from 'next/link';
import { motion } from 'framer-motion';

const INITIAL_FORM: Omit<Anime, 'created_at'> = {
  id: '', title: '', tags: [], synopsis: '', image_url: '', pv_url: '', season: '', total_episodes: 0, official_site: '', copyright: ''
};

export default function AdminPage() {
  const { animeList, upsertAnime, bulkUpsert, deleteAnime, isCloudSynced } = useAnimeData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');

  // 保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
    alert('保存完了しました');
  };

  // 編集開始
  const startEdit = (anime: Anime) => {
    setForm({ ...anime });
    setTagInput(anime.tags.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // XLSXインポート
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
        pv_url: getVal(row, ['pv', 'pvurl']).toString(),
        season: getVal(row, ['放送季', 'シーズン', 'season']).toString(),
        total_episodes: parseInt(getVal(row, ['話数', 'episodes'])) || 0,
        official_site: getVal(row, ['公式サイト', 'url']).toString(),
        copyright: getVal(row, ['コピーライト', 'copyright']).toString(),
      })).filter(a => a.title);

      if (newList.length > 0) {
        await bulkUpsert(newList);
        alert(`${newList.length}件をインポートしました！`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
        <div>
          <h1 style={{ color: '#d4a843', fontSize: '32px', marginBottom: '8px' }}>Management</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>データベース管理と一括操作</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/scraper" className="nav-btn">🌐 自動取得ツール</Link>
          <div style={{ 
            background: isCloudSynced ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isCloudSynced ? '#22c55e' : '#ef4444'}`,
            color: isCloudSynced ? '#22c55e' : '#ef4444',
            padding: '10px 15px', borderRadius: '8px', fontSize: '12px'
          }}>
            {isCloudSynced ? 'Cloud Online' : 'Local Only'}
          </div>
        </div>
      </header>

      {/* 1. Edit Form */}
      <section style={{ background: '#111', padding: '40px', borderRadius: '32px', border: '1px solid #222', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '18px', color: '#d4a843', marginBottom: '30px' }}>{form.id ? '作品を編集' : '新規登録'}</h2>
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="label">タイトル</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="label">放送季 / 年代</label>
                <input className="input" value={form.season} onChange={e => setForm({...form, season: e.target.value})} placeholder="2026 春" />
              </div>
              <div>
                <label className="label">総話数</label>
                <input className="input" type="number" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div>
              <label className="label">あらすじ</label>
              <textarea className="input" rows={6} value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} />
            </div>
            
            <div>
              <label className="label">タグ (カンマ区切り)</label>
              <input className="input" value={tagInput} onChange={e => {
                setTagInput(e.target.value);
                setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label className="label">画像プレビュー (3:4)</label>
            <div style={{ 
              width: '100%', aspectRatio: '3/4', background: '#000', borderRadius: '16px', overflow: 'hidden', 
              border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {form.image_url ? (
                <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', color: '#333' }}>No Image</span>
              )}
            </div>
            <input className="input" style={{ fontSize: '12px' }} placeholder="画像URLをペースト..." value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
            
            <label className="label" style={{ marginTop: '10px' }}>XLSX インポート</label>
            <div className="file-input-wrapper">
              <input type="file" accept=".xlsx" onChange={handleFileUpload} />
              <div className="file-dummy">ファイルをアップロード</div>
            </div>

            <button type="submit" style={{ marginTop: 'auto', padding: '16px', background: '#d4a843', color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              {form.id ? '更新する' : '登録する'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Management List (1 Column) */}
      <section>
        <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '25px' }}>登録作品一覧 ({animeList.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {animeList.map(a => (
            <div key={a.id} className="list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                <div style={{ width: '40px', height: '54px', background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
                  {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{a.season} • {a.total_episodes}話</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(a)} className="action-btn">編集</button>
                <button onClick={() => deleteAnime(a.id)} className="action-btn" style={{ color: '#ef4444' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .label { display: block; font-size: 13px; color: #888; margin-bottom: 8px; }
        .input {
          width: 100%; padding: 15px; background: #000; border: 1px solid #222; border-radius: 12px; color: #fff; font-size: 15px; outline: none; transition: border-color 0.2s;
        }
        .input:focus { border-color: #d4a843; }
        .nav-btn {
          padding: 10px 20px; background: #222; color: #d4a843; border: 1px solid #d4a843; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; transition: all 0.2s;
        }
        .nav-btn:hover { background: #d4a843; color: #000; }
        .list-item {
          background: #111; padding: 15px 25px; border: 1px solid #222; border-radius: 20px; display: flex; align-items: center; transition: all 0.2s;
        }
        .list-item:hover { transform: translateX(5px); border-color: #333; }
        .action-btn {
          padding: 8px 16px; background: #222; color: #fff; border: none; border-radius: 8px; font-size: 12px; cursor: pointer;
        }
        .file-input-wrapper {
          position: relative; overflow: hidden;
        }
        .file-input-wrapper input {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
        }
        .file-dummy {
          padding: 12px; background: #222; border: 1px dashed #444; border-radius: 10px; color: #888; text-align: center; font-size: 12px;
        }
      `}</style>
    </div>
  );
}
