'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', background: '#111', border: '1px solid #333',
  borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
};

export default function AdminPage() {
  const { rawAnimeList, upsertAnime, bulkUpsert, deleteAnime } = useAnimeData();
  const [form, setForm] = useState({ id: '', title: '', season: '', synopsis: '', image_url: '', pv_url: '', tags: [] as string[], total_episodes: 0 });
  const [tagInput, setTagInput] = useState('');
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const resetForm = () => { setForm({ id: '', title: '', season: '', synopsis: '', image_url: '', pv_url: '', tags: [], total_episodes: 0 }); setTagInput(''); setEditId(null); };

  const handleSave = async () => {
    if (!form.title.trim()) { setMsg('タイトルを入力してください。'); return; }
    const anime: Anime = { ...form, id: form.id || genId(), created_at: new Date().toISOString() };
    await upsertAnime(anime);
    setMsg(editId ? '更新しました！' : '追加しました！');
    resetForm();
    setTimeout(() => setMsg(''), 3000);
  };

  const handleEdit = (a: Anime) => {
    setForm({ id: a.id, title: a.title, season: a.season, synopsis: a.synopsis, image_url: a.image_url, pv_url: a.pv_url, tags: a.tags, total_episodes: a.total_episodes });
    setEditId(a.id);
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    // ダイアログなしで即座に削除
    deleteAnime(id);
    setMsg('削除しました。');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);
      const animes: Anime[] = rows.map((row) => ({
        id: genId(),
        title: String(row['タイトル'] || row['title'] || row['Title'] || Object.values(row)[0] || ''),
        season: String(row['放送季'] || row['season'] || row['Season'] || ''),
        synopsis: String(row['あらすじ'] || row['synopsis'] || ''),
        image_url: String(row['画像'] || row['image_url'] || ''),
        pv_url: String(row['PV'] || row['pv_url'] || ''),
        tags: (row['タグ'] || row['tags'] || '').toString().split(',').map((t: string) => t.trim()).filter(Boolean),
        total_episodes: parseInt(row['話数'] || row['total_episodes'] || '0') || 0,
        created_at: new Date().toISOString(),
      })).filter((a) => a.title);
      if (animes.length > 0) {
        await bulkUpsert(animes);
        setMsg(`${animes.length} 件の作品を追加しました！`);
      } else {
        setMsg('読み取れるデータが見つかりませんでした。');
      }
      setTimeout(() => setMsg(''), 3000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: '40px 48px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ background: '#2a2a2a', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}
      >
        <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '20px' }}>
          {editId ? '✏️ 作品を編集' : '＋ 新規追加'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input style={inputStyle} placeholder="アニメのタイトルを入力" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input style={inputStyle} placeholder="放送季 (例: 2025年 春)" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
            <textarea style={{ ...inputStyle, minHeight: '110px', resize: 'vertical' }} placeholder="アニメのあらすじを入力" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} />
            <input style={inputStyle} placeholder="タグ (Enterで追加)" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); setForm({ ...form, tags: [...form.tags, tagInput.trim()] }); setTagInput(''); } }} />
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {form.tags.map((t, i) => (
                  <span key={i} style={{ background: '#444', color: '#eee', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    #{t} <button onClick={() => setForm({ ...form, tags: form.tags.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '10px', aspectRatio: '3/4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.image_url ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>アニメの画像を<br />挿入</span>}
            </div>
            <input style={inputStyle} placeholder="画像URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <input style={inputStyle} placeholder="PV URL (YouTube等)" value={form.pv_url} onChange={(e) => setForm({ ...form, pv_url: e.target.value })} />
            <input style={inputStyle} type="number" placeholder="総話数" value={form.total_episodes || ''} onChange={(e) => setForm({ ...form, total_episodes: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleSave} style={{ padding: '12px 36px', background: '#d4a843', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
            {editId ? '更新する' : '追加する'}
          </button>
          {editId && <button onClick={resetForm} style={{ padding: '12px 24px', background: '#444', color: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>キャンセル</button>}
          <label style={{ padding: '12px 24px', background: '#333', border: '1px solid #555', borderRadius: '8px', color: '#ccc', fontSize: '13px', cursor: 'pointer' }}>
            📄 XLSXインポート
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleXlsx} />
          </label>
          {msg && <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold' }}>{msg}</span>}
        </div>
      </motion.div>

      <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#d4a843' }}>登録済み作品 ({rawAnimeList.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {rawAnimeList.map((a) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}
            >
              {a.image_url && <img src={a.image_url} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#777' }}>{a.season} | {a.total_episodes}話</div>
              </div>
              <button onClick={() => handleEdit(a)} style={{ padding: '6px 16px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: '#d4a843', fontSize: '12px', cursor: 'pointer' }}>編集</button>
              <button onClick={() => handleDelete(a.id)} style={{ padding: '6px 16px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>削除</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
