'use client';

import { useState } from 'react';
import { useAnimeData } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { read, utils, writeFileXLSX } from 'xlsx';

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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const finalData = { ...form, id: form.id || Math.random().toString(36).slice(2) };
    await upsertAnime(finalData);
    setForm(INITIAL_FORM);
    setTagInput('');
    alert('作品を保存しました');
  };

  // サイトを読み取ってXLSXを生成・ダウンロード
  const handleScrapeToExcel = async () => {
    if (!scrapeUrl) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/scrape', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }) 
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.animeList?.length > 0) {
        // エクセル用データに変換
        const excelData = data.animeList.map((a: any) => ({
          '作品名': a.title,
          '放送季': a.season,
          'あらすじ': a.synopsis,
          '画像URL': a.image_url,
          '公式サイト': a.official_site,
          'コピーライト': a.copyright,
          'タグ': a.tags.join(', ')
        }));

        const ws = utils.json_to_sheet(excelData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "AnimeData");
        writeFileXLSX(wb, `Anime_Export_${new Date().getTime()}.xlsx`);
        alert('データを取得し、エクセルファイルを生成しました！ダウンロードを確認してください。');
      }
    } catch (err: any) {
      alert(`取得失敗: ${err.message}`);
    } finally {
      setIsProcessing(false);
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
      const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      
      const getVal = (row: any, keys: string[]) => {
        const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
        return foundKey ? row[foundKey] : '';
      };

      const newList = data.map(row => ({
        id: Math.random().toString(36).slice(2),
        title: getVal(row, ['タイトル', '作品名', 'title', 'name']),
        tags: (getVal(row, ['タグ', 'カテゴリ', 'tags', 'tag']) || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean),
        synopsis: getVal(row, ['あらすじ', '内容', 'synopsis', 'description']),
        image_url: getVal(row, ['画像', '画像url', 'image', 'image_url', 'image url']),
        pv_url: getVal(row, ['pv', 'pvurl', 'pv_url', 'pv url', 'trailer']),
        season: getVal(row, ['放送季', 'シーズン', 'season']),
        total_episodes: parseInt(getVal(row, ['話数', '総話数', 'episodes'])) || 0,
        official_site: getVal(row, ['公式サイト', 'url', 'official_site']),
        copyright: getVal(row, ['コピーライト', 'copyright']),
      })).filter(a => a.title);

      if (newList.length > 0) {
        await bulkUpsert(newList);
        alert(`${newList.length}件をすべてインポートしました！`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <header style={{ marginBottom: '50px', textAlign: 'left' }}>
        <h1 style={{ color: '#d4a843', fontSize: '32px', marginBottom: '10px' }}>Anime Management</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>作品データの編集と一括管理</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', alignItems: 'start', marginBottom: '60px' }}>
        
        {/* 左: 手動入力フォーム */}
        <section style={{ background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222' }}>
          <h2 style={{ fontSize: '18px', color: '#d4a843', marginBottom: '25px' }}>作品詳細を入力</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label>タイトル</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>画像URL</label>
                <input className="input" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
              </div>
              <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', height: '140px', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.image_url ? <img src={form.image_url} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '12px', color: '#333' }}>Preview</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>放送季</label>
                <input className="input" value={form.season} onChange={e => setForm({...form, season: e.target.value})} placeholder="2026 春" />
              </div>
              <div className="form-group">
                <label>総話数</label>
                <input className="input" type="number" value={form.total_episodes || ''} onChange={e => setForm({...form, total_episodes: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div className="form-group">
              <label>あらすじ</label>
              <textarea className="input" rows={4} value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>PV URL</label>
                <input className="input" value={form.pv_url} onChange={e => setForm({...form, pv_url: e.target.value})} />
              </div>
              <div className="form-group">
                <label>タグ (カンマ区切り)</label>
                <input className="input" value={tagInput} onChange={e => {
                  setTagInput(e.target.value);
                  setForm({...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});
                }} />
              </div>
            </div>

            <button type="submit" style={{ padding: '16px', background: '#d4a843', color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
              {form.id ? '更新を保存する' : '作品をデータベースに登録'}
            </button>
            {form.id && <button type="button" onClick={() => { setForm(INITIAL_FORM); setTagInput(''); }} style={{ background: '#222', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>編集をキャンセル</button>}
          </form>
        </section>

        {/* 右: インポートツール */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '16px', color: '#d4a843', marginBottom: '20px' }}>サイトからXLSXを生成</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>指定URLから情報を取得し、Excel形式でダウンロードします。</p>
            <input className="input" placeholder="アニメイトタイムズのURL..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} style={{ marginBottom: '15px' }} />
            <button onClick={handleScrapeToExcel} disabled={isProcessing} className="btn-secondary">
              {isProcessing ? '取得中...' : 'XLSXファイルを生成・保存'}
            </button>
          </div>

          <div style={{ background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '16px', color: '#d4a843', marginBottom: '20px' }}>XLSXからインポート</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>ファイルをアップロードしてクラウドに一括保存します。</p>
            <div className="file-drop-zone">
              <input type="file" accept=".xlsx" onChange={handleFileUpload} />
              <div style={{ fontSize: '13px', color: '#444' }}>ここにファイルをドロップするか選択</div>
            </div>
          </div>

        </section>
      </div>

      {/* 登録済みリスト (1列) */}
      <section>
        <h2 style={{ fontSize: '20px', color: '#d4a843', marginBottom: '25px' }}>登録済み作品 ({animeList.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {animeList.map(a => (
            <div key={a.id} className="list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                <div style={{ width: '40px', height: '56px', background: '#000', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                  {a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{a.season} • {a.total_episodes}話</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setForm({...a}); setTagInput(a.tags.join(', ')); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="action-btn">編集</button>
                <button onClick={() => deleteAnime(a.id)} className="action-btn" style={{ color: '#ef4444' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 13px; color: #888; }
        .input {
          width: 100%; padding: 14px; background: #000; border: 1px solid #222; border-radius: 12px; color: #fff; font-size: 15px; outline: none; box-sizing: border-box; transition: border-color 0.2s;
        }
        .input:focus { border-color: #d4a843; }
        .btn-secondary {
          width: 100%; padding: 14px; background: transparent; color: #d4a843; border: 1px solid #d4a843; border-radius: 12px; cursor: pointer; font-weight: bold; transition: all 0.2s;
        }
        .btn-secondary:hover { background: #d4a843; color: #000; }
        .file-drop-zone {
          position: relative; padding: 40px; border: 2px dashed #222; border-radius: 15px; text-align: center; cursor: pointer;
        }
        .file-drop-zone input {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
        }
        .list-item {
          background: #111; padding: 12px 20px; border: 1px solid #222; border-radius: 16px; display: flex; align-items: center; gap: 20px; transition: transform 0.2s;
        }
        .list-item:hover { transform: translateX(5px); border-color: #333; }
        .action-btn {
          padding: 8px 16px; background: #222; color: #fff; border: none; border-radius: 8px; font-size: 12px; cursor: pointer;
        }
        .action-btn:hover { background: #333; }
      `}</style>
    </div>
  );
}
