'use client';

import { useState, useMemo } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', background: '#111', border: '1px solid #333',
  borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
};

export default function AdminPage() {
  const { rawAnimeList, upsertAnime, bulkUpsert, deleteAnime, isCloudSynced } = useAnimeData();
  const [form, setForm] = useState<Partial<Anime>>({ 
    id: '', title: '', season: '', synopsis: '', image_url: '', pv_url: '', 
    tags: [], total_episodes: 0, official_site: '', copyright: '' 
  });
  const [tagInput, setTagInput] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  const handleSave = async () => {
    if (!form.title?.trim()) return;
    const anime = { ...form, id: form.id || genId(), created_at: new Date().toISOString() } as Anime;
    
    // 直接エラーをキャッチして表示
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('anime').upsert([anime]);
      if (error) {
        alert('クラウド保存エラー: ' + error.message + '\n\n詳細: ' + error.details);
        setMsg({ text: '保存失敗', type: 'error' });
        return;
      }
    }

    await upsertAnime(anime);
    setMsg({ text: 'クラウドに保存しました', type: 'success' });
    setForm({ id: '', title: '', season: '', synopsis: '', image_url: '', pv_url: '', tags: [], total_episodes: 0, official_site: '', copyright: '' });
    setEditId(null);
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      
      const animes: Anime[] = rows.map((row) => {
        const findVal = (patterns: string[]) => {
          const key = Object.keys(row).find(k => patterns.some(p => k.toLowerCase().includes(p.toLowerCase())));
          return key ? String(row[key]) : '';
        };

        return {
          id: genId(),
          title: findVal(['タイトル', 'title', '名前', 'name']),
          season: findVal(['放送季', 'season', '時期', '年代']),
          synopsis: findVal(['あらすじ', 'synopsis', '概要', 'description']),
          image_url: findVal(['画像', 'image', 'url', 'ポスター', 'poster', 'link']),
          pv_url: findVal(['PV', 'pv_url', 'youtube', '動画', 'pv_link']),
          official_site: findVal(['公式サイト', 'site', 'website']),
          copyright: findVal(['コピーライト', 'copyright', '©']),
          tags: findVal(['タグ', 'tags', 'ジャンル']).split(/[、,，\n]/).map(t => t.trim()).filter(Boolean),
          total_episodes: parseInt(findVal(['話数', 'episodes', '話'])) || 0,
          created_at: new Date().toISOString(),
        };
      }).filter(a => a.title);

      if (animes.length > 0) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from('anime').upsert(animes);
          if (error) {
            alert('一括保存エラー: ' + error.message);
            return;
          }
        }
        await bulkUpsert(animes);
        setMsg({ text: `${animes.length}件を保存しました`, type: 'success' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filtered = rawAnimeList.filter(a => a.title.toLowerCase().includes(adminSearch.toLowerCase()));

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: isCloudSynced ? '#064e3b' : '#450a0a', color: '#fff', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{isCloudSynced ? '✅ クラウド同期中' : '⚠️ クラウド未接続 (設定を確認してください)'}</span>
        <button onClick={() => window.location.reload()} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}>再接続</button>
      </div>

      <div style={{ background: '#222', padding: '32px', borderRadius: '16px', marginBottom: '40px' }}>
        <h2 style={{ color: '#d4a843', marginBottom: '20px' }}>{editId ? '作品編集' : '新規登録'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input style={inputStyle} placeholder="タイトル" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={inputStyle} placeholder="放送季" value={form.season} onChange={e => setForm({...form, season: e.target.value})} />
              <input style={{...inputStyle, width: '100px'}} type="number" placeholder="話数" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
            </div>
            <textarea style={{...inputStyle, height: '100px'}} placeholder="あらすじ" value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={inputStyle} placeholder="公式サイト URL" value={form.official_site} onChange={e => setForm({...form, official_site: e.target.value})} />
              <input style={inputStyle} placeholder="コピーライト" value={form.copyright} onChange={e => setForm({...form, copyright: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ background: '#111', borderRadius: '10px', aspectRatio: '3/4', overflow: 'hidden' }}>
               {form.image_url && <img src={form.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
             </div>
             <input style={inputStyle} placeholder="画像 URL" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
             <input style={inputStyle} placeholder="PV URL" value={form.pv_url} onChange={e => setForm({...form, pv_url: e.target.value})} />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleSave} style={{ padding: '12px 32px', background: '#d4a843', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>保存する</button>
          <label style={{ padding: '12px 24px', background: '#333', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
             XLSXインポート <input type="file" style={{ display: 'none' }} onChange={handleXlsx} />
          </label>
          {msg.text && <span style={{ color: msg.type === 'success' ? '#22c55e' : '#ef4444' }}>{msg.text}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ color: '#d4a843' }}>作品リスト ({rawAnimeList.length})</h3>
        <input style={{...inputStyle, width: '250px', padding: '8px 12px'}} placeholder="リストを検索..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <img src={a.image_url} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
            <div style={{ flex: 1 }}>{a.title}</div>
            <button onClick={() => { setForm(a); setEditId(a.id); window.scrollTo(0,0); }} style={{ padding: '6px 12px', background: '#333', border: 'none', borderRadius: '4px', color: '#d4a843', cursor: 'pointer' }}>編集</button>
            <button onClick={() => deleteAnime(a.id)} style={{ padding: '6px 12px', background: '#333', border: 'none', borderRadius: '4px', color: '#ef4444', cursor: 'pointer' }}>削除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
