'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils } from 'xlsx';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getBaseTitle } from '@/utils/animeUtils';

const INITIAL_FORM: Omit<Anime, 'created_at'> = {
  id: '', title: '', tags: [], synopsis: '', image_url: '', pv_url: '',
  season: '', total_episodes: 0, official_site: '', copyright: ''
};

// キーの柔軟マッチング（大文字小文字・空白を無視して含むかチェック）
function getVal(row: Record<string, unknown>, candidates: string[]): string {
  for (const key of Object.keys(row)) {
    const normalized = key.toLowerCase().replace(/[\s_\-]/g, '');
    for (const c of candidates) {
      if (normalized.includes(c.toLowerCase().replace(/[\s_\-]/g, ''))) {
        return String(row[key] ?? '');
      }
    }
  }
  return '';
}

function AdminContent() {
  const { animeList, upsertAnime, bulkUpsert, deleteAnime, isCloudSynced } = useAnimeData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [emptyFilter, setEmptyFilter] = useState('');
  
  const [activeTab, setActiveTab] = useState<'edit' | 'merge'>('edit');
  const [baseAnimeId, setBaseAnimeId] = useState('');
  const [targetAnimeIds, setTargetAnimeIds] = useState<string[]>([]);
  const [mergeSearch, setMergeSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const startEdit = (anime: Anime) => {
    setForm({ ...anime });
    setTagInput(anime.tags.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (editId && animeList.length > 0) {
      const target = animeList.find(a => a.id === editId);
      if (target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab('edit');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startEdit(target);
      }
    }
  }, [editId, animeList]);

  const uniqueSeasons = Array.from(new Set(animeList.map(a => a.season))).filter(Boolean).sort().reverse();

  const filteredList = animeList.filter(a => {
    if (seasonFilter && a.season !== seasonFilter) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (emptyFilter) {
      if (emptyFilter === 'tags' && a.tags.length > 0) return false;
      if (emptyFilter === 'synopsis' && a.synopsis) return false;
      if (emptyFilter === 'image_url' && a.image_url) return false;
      if (emptyFilter === 'pv_url' && a.pv_url) return false;
      if (emptyFilter === 'official_site' && a.official_site) return false;
    }
    return true;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
    alert('保存しました');
  };



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = read(bstr, { type: 'binary' });
      const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as Record<string, unknown>[];

      const newList = data.map(row => ({
        id: Math.random().toString(36).slice(2),
        title: getVal(row, ['タイトル', '作品名', 'title', 'name']),
        tags: (getVal(row, ['タグ', 'tags', 'tag', 'カテゴリ']) || '')
          .split(',').map(s => s.trim()).filter(Boolean),
        synopsis:   getVal(row, ['あらすじ', 'synopsis', '内容', 'story', 'description']),
        image_url:  getVal(row, ['画像', '画像URL', 'imageurl', 'image', 'cover', 'thumbnail']),
        pv_url:     getVal(row, ['PV', 'PVURL', 'pv_url', 'pvurl', 'trailer', 'video', 'youtube']),
        season:     getVal(row, ['放送季', 'シーズン', 'season', 'period', '年代']),
        total_episodes: parseInt(getVal(row, ['話数', '総話数', 'episodes', 'episode'])) || 0,
        official_site: getVal(row, ['公式サイト', 'officialsite', 'website']),
        copyright:  getVal(row, ['コピーライト', 'copyright', '権利表記', '©']),
      })).filter(a => a.title);

      if (newList.length > 0) {
        await bulkUpsert(newList);
        alert(`${newList.length}件をインポートしました！`);
      } else {
        alert('タイトルのある作品が見つかりませんでした。列名を確認してください。');
      }
    };
    reader.readAsBinaryString(file);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', background: '#0a0a0a',
    border: '1px solid #2a2a2a', borderRadius: '12px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', color: '#666',
    fontWeight: '600', marginBottom: '8px', letterSpacing: '0.05em',
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '20px 32px', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* 固定エリア: ヘッダー + フォーム/結合 + フィルター */}
      <div style={{ flexShrink: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{
              fontFamily: 'Georgia, "游明朝", serif', fontStyle: 'italic',
              fontSize: 'clamp(24px, 4vw, 36px)', color: '#d4a843',
              textShadow: '0 4px 20px rgba(212,168,67,0.2)', margin: 0
            }}>
              Management
            </h1>
            <p style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>データベース管理 · 一括操作</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/admin/scraper" style={{
              padding: '8px 16px', background: 'transparent', color: '#d4a843',
              border: '1px solid #d4a84366', borderRadius: '10px', textDecoration: 'none',
              fontSize: '12px', transition: 'all 0.2s'
            }}>
              🌐 自動取得ツール
            </Link>
            <div style={{
              padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
              background: isCloudSynced ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isCloudSynced ? '#22c55e44' : '#ef444444'}`,
              color: isCloudSynced ? '#22c55e' : '#ef4444',
            }}>
              {isCloudSynced ? '● Cloud Online' : '○ Local Only'}
            </div>
          </div>
        </header>

        {/* フォーム / シリーズ結合エリア */}
        <div style={{
          background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '24px',
          padding: '24px', marginBottom: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}>
          {/* タブ切り替え */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
            <button onClick={() => setActiveTab('edit')} style={{
              background: 'transparent', border: 'none', color: activeTab === 'edit' ? '#d4a843' : '#666',
              fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'edit' ? '2px solid #d4a843' : 'none', paddingBottom: '8px'
            }}>新規登録 / 編集</button>
            <button onClick={() => setActiveTab('merge')} style={{
              background: 'transparent', border: 'none', color: activeTab === 'merge' ? '#d4a843' : '#666',
              fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'merge' ? '2px solid #d4a843' : 'none', paddingBottom: '8px'
            }}>シリーズ結合</button>
          </div>

          {activeTab === 'edit' ? (
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px 200px', gap: '20px' }}>
                {/* 基本情報 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input style={inputStyle} value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })} placeholder="タイトル *" />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input style={inputStyle} value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} placeholder="放送季 (例: 2026 春)" />
                    <input style={{...inputStyle, width: '100px'}} type="number" value={form.total_episodes || ''} onChange={e => setForm({ ...form, total_episodes: parseInt(e.target.value) || 0 })} placeholder="話数" />
                  </div>
                  <input style={inputStyle} value={tagInput} onChange={e => { setTagInput(e.target.value); setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }); }} placeholder="タグ (カンマ区切り)" />
                </div>

                {/* あらすじ */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <textarea style={{...inputStyle, height: '100%', minHeight: '120px', resize: 'none'}} value={form.synopsis} onChange={e => setForm({ ...form, synopsis: e.target.value })} placeholder="あらすじ..." />
                </div>

                {/* 画像プレビュー */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ width: '100%', height: '100px', background: '#050505', borderRadius: '8px', overflow: 'hidden', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.image_url ? <img src={form.image_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#333', fontSize:'10px'}}>No Image</span>}
                  </div>
                  <input style={{...inputStyle, fontSize: '11px', padding: '8px'}} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="画像 URL" />
                </div>

                {/* その他 & ボタン */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                  <input style={{...inputStyle, padding: '8px 12px', fontSize: '12px'}} value={form.pv_url} onChange={e => setForm({ ...form, pv_url: e.target.value })} placeholder="PV URL (YouTube)" />
                  <input style={{...inputStyle, padding: '8px 12px', fontSize: '12px'}} value={form.official_site} onChange={e => setForm({ ...form, official_site: e.target.value })} placeholder="公式サイト URL" />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="submit" style={{ flex: 1, padding: '10px', background: '#d4a843', color: '#000', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      {form.id ? '更新' : '保存'}
                    </button>
                    {form.id && <button type="button" onClick={() => { setForm(INITIAL_FORM); setTagInput(''); }} style={{ padding: '10px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' }}>×中止</button>}
                  </div>
                  <label style={{ display: 'block', padding: '6px', textAlign: 'center', background: '#0a0a0a', border: '1px dashed #333', borderRadius: '8px', color: '#555', fontSize: '10px', cursor: 'pointer' }}>
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                    📂 XLSX インポート
                  </label>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: '20px' }}>
              <div>
                <label style={labelStyle}>親作品を選択</label>
                <input style={{...inputStyle, marginBottom: '8px', fontSize: '12px', padding: '8px'}} placeholder="親作品を検索..." value={mergeSearch} onChange={e => setMergeSearch(e.target.value)} />
                <select style={inputStyle} value={baseAnimeId} onChange={e => setBaseAnimeId(e.target.value)}>
                  <option value="">選択してください...</option>
                  {animeList.filter(a => a.title.toLowerCase().includes(mergeSearch.toLowerCase())).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>結合する作品を選択 (複数可)</label>
                <input style={{...inputStyle, marginBottom: '8px', fontSize: '12px', padding: '8px'}} placeholder="結合先を検索..." value={targetSearch} onChange={e => setTargetSearch(e.target.value)} />
                <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#050505', border: '1px solid #222', borderRadius: '8px', padding: '8px' }}>
                  {animeList.filter(a => a.id !== baseAnimeId && a.title.toLowerCase().includes(targetSearch.toLowerCase())).map(a => (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={targetAnimeIds.includes(a.id)} onChange={e => { if (e.target.checked) setTargetAnimeIds([...targetAnimeIds, a.id]); else setTargetAnimeIds(targetAnimeIds.filter(id => id !== a.id)); }} />
                      {a.title}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  onClick={async () => {
                    if (!baseAnimeId || targetAnimeIds.length === 0) return alert('親作品と結合先を選んでください');
                    const baseAnime = animeList.find(a => a.id === baseAnimeId);
                    if (!baseAnime) return;
                    const baseTitleStr = getBaseTitle(baseAnime);
                    const updates = targetAnimeIds.map(id => {
                      const target = animeList.find(a => a.id === id);
                      if (!target) return null;
                      const newTags = target.tags.filter(t => !t.startsWith('series:'));
                      newTags.push(`series:${baseTitleStr}`);
                      return { ...target, tags: newTags };
                    }).filter((x): x is Anime => x !== null);
                    const newBaseTags = baseAnime.tags.filter(t => !t.startsWith('series:'));
                    if (!newBaseTags.some(t => t === `series:${baseTitleStr}`)) {
                      newBaseTags.push(`series:${baseTitleStr}`);
                      updates.push({ ...baseAnime, tags: newBaseTags });
                    }
                    await bulkUpsert(updates);
                    alert('シリーズを結合しました！');
                    setTargetAnimeIds([]);
                  }}
                  disabled={!baseAnimeId || targetAnimeIds.length === 0}
                  style={{ width: '100%', padding: '12px', background: (!baseAnimeId || targetAnimeIds.length === 0) ? '#333' : '#d4a843', color: '#000', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  結合を実行
                </button>
              </div>
            </div>
          )}
        </div>

        {/* フィルター / 検索バー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#0a0a0a', padding: '12px 20px', borderRadius: '16px', border: '1px solid #1a1a1a' }}>
          <h2 style={{ fontSize: '14px', color: '#d4a843', margin: 0 }}>
            作品リスト <span style={{ color: '#444', fontSize: '12px', fontWeight: 'normal' }}>({filteredList.length} / {animeList.length})</span>
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input style={{ ...inputStyle, padding: '8px 12px', width: '180px', fontSize: '13px' }} placeholder="タイトル検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select style={{ ...inputStyle, padding: '8px 12px', width: '130px', fontSize: '13px' }} value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}>
              <option value="">全放送季</option>
              {uniqueSeasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={{ ...inputStyle, padding: '8px 12px', width: '140px', fontSize: '13px' }} value={emptyFilter} onChange={e => setEmptyFilter(e.target.value)}>
              <option value="">未入力フィルタなし</option>
              <option value="tags">タグ未入力</option>
              <option value="synopsis">あらすじ未入力</option>
              <option value="pv_url">PV未入力</option>
              <option value="image_url">画像未入力</option>
              <option value="official_site">公式サイト未入力</option>
            </select>
          </div>
        </div>
      </div>

      {/* スクロール可能なリストエリア */}
      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '10px', scrollbarWidth: 'thin' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '40px' }}>
          {filteredList.map(a => (
            <div key={a.id} style={{
              background: '#0d0d0d', padding: '14px 24px', border: '1px solid #1e1e1e',
              borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a84333')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
            >
              <div style={{ width: '38px', height: '52px', borderRadius: '6px', background: '#111', overflow: 'hidden', flexShrink: 0 }}>
                {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>
                  {[a.season, a.total_episodes ? `${a.total_episodes}話` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => startEdit(a)} style={{ padding: '7px 16px', background: '#1a1a1a', color: '#ccc', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>編集</button>
                <button onClick={() => deleteAnime(a.id)} style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', color: '#999', textAlign: 'center' }}>Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
}
