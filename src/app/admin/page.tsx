'use client';

import { useState, useMemo } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { isSupabaseConfigured } from '@/lib/supabase';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', background: '#111', border: '1px solid #333',
  borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
};

export default function AdminPage() {
  const { rawAnimeList, upsertAnime, bulkUpsert, deleteAnime } = useAnimeData();
  const [form, setForm] = useState<Partial<Anime>>({ 
    id: '', title: '', season: '', synopsis: '', image_url: '', pv_url: '', 
    tags: [], total_episodes: 0, official_site: '', copyright: '' 
  });
  const [tagInput, setTagInput] = useState('');
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  const resetForm = () => { 
    setForm({ 
      id: '', title: '', season: '', synopsis: '', image_url: '', pv_url: '', 
      tags: [], total_episodes: 0, official_site: '', copyright: '' 
    }); 
    setTagInput(''); setEditId(null); 
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { setMsg('タイトルを入力してください。'); return; }
    const anime: Anime = { 
      ...form, 
      id: form.id || genId(), 
      tags: form.tags || [],
      total_episodes: form.total_episodes || 0,
      created_at: new Date().toISOString() 
    } as Anime;
    
    try {
      await upsertAnime(anime);
      setMsg(editId ? 'クラウドに更新しました！' : 'クラウドに保存しました！');
      resetForm();
    } catch (e: any) {
      alert('保存に失敗しました: ' + e.message);
    }
    setTimeout(() => setMsg(''), 4000);
  };

  const handleEdit = (a: Anime) => {
    setForm({ ...a });
    setEditId(a.id);
    setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    deleteAnime(id);
    setMsg('削除しました。');
    setTimeout(() => setMsg(''), 3000);
  };

  const filteredList = useMemo(() => {
    if (!adminSearch.trim()) return rawAnimeList;
    const q = adminSearch.toLowerCase();
    return rawAnimeList.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [rawAnimeList, adminSearch]);

  const handleXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);
      
      const animes: Anime[] = rows.map((row) => {
        const getVal = (keys: string[]) => {
          for (const key of keys) {
            // 列名をトリミングして、大文字小文字を無視して比較
            const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return String(row[foundKey]);
          }
          return '';
        };

        return {
          id: genId(),
          title: getVal(['タイトル', 'title', 'Title', '名前', 'name']),
          season: getVal(['放送季', 'season', 'Season', '時期', '年代', '放送時期']),
          synopsis: getVal(['あらすじ', 'synopsis', 'Synopsis', '概要', '説明', 'description']),
          image_url: getVal(['画像', 'image_url', 'image', 'Image', '画像URL', 'ポスター', 'イメージ', 'url_image', 'poster', '画像リンク']),
          pv_url: getVal(['PV', 'pv_url', 'PV URL', 'youtube', 'YouTube', '動画', 'pv_link']),
          official_site: getVal(['公式サイト', 'url', 'site', 'website', 'official']),
          copyright: getVal(['コピーライト', 'copyright', '©', 'rights']),
          tags: getVal(['タグ', 'tags', 'Tags', 'ジャンル', 'category']).split(/[、,，\n]/).map((t) => t.trim()).filter(Boolean),
          total_episodes: parseInt(getVal(['話数', 'total_episodes', 'episodes', '話', 'episode_count'])) || 0,
          created_at: new Date().toISOString(),
        };
      }).filter((a) => a.title);

      if (animes.length > 0) {
        try {
          await bulkUpsert(animes);
          setMsg(`${animes.length} 件をクラウドに一括登録しました！`);
        } catch (e: any) {
          alert('一括保存に失敗しました: ' + e.message);
        }
      } else {
        setMsg('タイトル列が見つかりませんでした。');
      }
      setTimeout(() => setMsg(''), 3000);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* 接続デバッグ情報 */}
      {!isSupabaseConfigured && (
        <div style={{ background: '#450a0a', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', color: '#fecaca', fontSize: '14px' }}>
          ⚠️ <strong>クラウド（Supabase）が設定されていません。</strong><br />
          この端末にしか保存されず、他の端末とは共有されません。README の「ステップ 7」を確認してください。
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ background: '#2a2a2a', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}
      >
        <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '20px' }}>
          {editId ? '✏️ 作品を編集' : '＋ 新規登録'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input style={inputStyle} placeholder="アニメのタイトルを入力" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={inputStyle} placeholder="放送季 (例: 2025年 春)" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
              <input style={{ ...inputStyle, width: '120px' }} type="number" placeholder="総話数" value={form.total_episodes || ''} onChange={(e) => setForm({ ...form, total_episodes: parseInt(e.target.value) || 0 })} />
            </div>
            <textarea style={{ ...inputStyle, minHeight: '110px', resize: 'vertical' }} placeholder="アニメのあらすじを入力" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} />
            <div style={{ display: 'flex', gap: '10px' }}>
               <input style={inputStyle} placeholder="公式サイト URL" value={form.official_site} onChange={(e) => setForm({ ...form, official_site: e.target.value })} />
               <input style={inputStyle} placeholder="コピーライト (© 委員会など)" value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} />
            </div>
            <input style={inputStyle} placeholder="タグ (Enterで追加)" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] }); setTagInput(''); } }} />
            {(form.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {form.tags!.map((t, i) => (
                  <span key={i} style={{ background: '#444', color: '#eee', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    #{t} <button onClick={() => setForm({ ...form, tags: form.tags!.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '10px', aspectRatio: '3/4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.image_url ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>プレビュー</span>}
            </div>
            <input style={inputStyle} placeholder="画像 URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <input style={inputStyle} placeholder="PV URL (YouTube)" value={form.pv_url} onChange={(e) => setForm({ ...form, pv_url: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleSave} style={{ padding: '12px 36px', background: '#d4a843', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
            {editId ? 'クラウドを更新' : 'クラウドに保存'}
          </button>
          {editId && <button onClick={resetForm} style={{ padding: '12px 24px', background: '#444', color: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>キャンセル</button>}
          <label style={{ padding: '12px 24px', background: '#333', border: '1px solid #555', borderRadius: '8px', color: '#ccc', fontSize: '13px', cursor: 'pointer' }}>
            📄 XLSX 一括登録
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleXlsx} />
          </label>
          {msg && <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold' }}>{msg}</span>}
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', color: '#d4a843' }}>クラウド登録済み作品 ({rawAnimeList.length})</h2>
        <input 
          style={{ ...inputStyle, width: '300px', padding: '8px 12px' }} 
          placeholder="作品を検索..." 
          value={adminSearch} 
          onChange={(e) => setAdminSearch(e.target.value)} 
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence>
          {filteredList.map((a) => (
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
