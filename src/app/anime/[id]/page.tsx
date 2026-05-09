'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { StarRating } from '@/components/StarRating';
import { AnimeStatus } from '@/types/anime';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

// YouTubeのIDを抽出するユーティリティ
function getYouTubeId(url: string) {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(new URL(url).search);
    videoId = urlParams.get('v') || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
  }
  return videoId;
}

export default function AnimeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { animeList, updateUserData, removeFromLibrary } = useAnimeData();
  const anime = animeList.find((a) => a.id === id);

  const status = anime?.userData?.status || '見たい';
  const rating = anime?.userData?.rating || 0;
  const progress = anime?.userData?.progress || 0;

  const similar = useMemo(() => {
    if (!anime) return [];
    return animeList
      .filter((a) => a.id !== anime.id && a.tags.some((t) => anime.tags.includes(t)))
      .slice(0, 6);
  }, [anime, animeList]);

  if (!anime) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>
        作品が見つかりません。
        <br /><button onClick={() => router.push('/')} style={{ marginTop: '16px', padding: '8px 24px', background: '#d4a843', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>ホームに戻る</button>
      </div>
    );
  }

  const videoId = getYouTubeId(anime.pv_url);

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>
        {/* Left: Info */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>{anime.title}</h1>
          {anime.season && <div style={{ fontSize: '16px', color: '#d4a843', marginBottom: '16px', fontWeight: 'bold' }}>{anime.season}</div>}

          <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.8', marginBottom: '24px' }}>
            {anime.synopsis || 'あらすじはまだ登録されていません。'}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {anime.tags.map((tag) => (
              <span key={tag} style={{ padding: '6px 16px', border: '1px solid #444', borderRadius: '20px', fontSize: '13px', color: '#aaa', background: '#111' }}>#{tag}</span>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>あなたの評価</div>
            <StarRating value={rating} size={32} onChange={(v) => updateUserData(anime.id, { rating: v })} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>視聴状態</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['見たい', '視聴中', '完了', '保留', '視聴切り'] as AnimeStatus[]).map((s) => (
                <button key={s} onClick={() => updateUserData(anime.id, { status: s })}
                  style={{
                    padding: '8px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                    background: anime.userData?.status === s ? '#d4a843' : '#222', color: anime.userData?.status === s ? '#000' : '#ccc',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>

          {anime.userData?.status === '視聴中' && anime.total_episodes > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>進行状況</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="number" value={progress}
                  onChange={(e) => updateUserData(anime.id, { progress: parseInt(e.target.value) || 0 })}
                  style={{ width: '70px', padding: '8px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '16px', textAlign: 'center' }}
                />
                <span style={{ color: '#666', fontSize: '14px' }}>/ {anime.total_episodes} 話</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {!anime.userData ? (
              <button onClick={() => updateUserData(anime.id, { status: '見たい', rating: 0, progress: 0 })}
                style={{ flex: 1, padding: '16px', background: '#d4a843', color: '#000', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >＋ライブラリに追加</button>
            ) : (
              <button onClick={() => { if(confirm('ライブラリから削除しますか？')) removeFromLibrary(anime.id); }}
                style={{ flex: 1, padding: '16px', background: '#333', color: '#f87171', border: '1px solid #444', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              >ライブラリから削除</button>
            )}
          </div>
        </motion.div>

        {/* Right: Video / Poster */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', position: 'relative' }}>
            {videoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&controls=1&modestbranding=1`}
                title={anime.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : anime.image_url ? (
              <img src={anime.image_url} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                映像なし
              </div>
            )}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '32px', padding: '0 8px' }}>
             <div><div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>放送時期</div><div style={{ fontSize: '15px', color: '#eee' }}>{anime.season || '不明'}</div></div>
             <div><div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>話数</div><div style={{ fontSize: '15px', color: '#eee' }}>全 {anime.total_episodes || '??'} 話</div></div>
          </div>
        </motion.div>
      </div>

      {similar.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#d4a843', paddingBottom: '8px', borderBottom: '1px solid #222' }}>
            この作品を見た人におすすめ
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {similar.map((a, i) => (
              <AnimeCard key={a.id} anime={a} index={i} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
