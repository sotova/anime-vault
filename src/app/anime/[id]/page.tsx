'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { StarRating } from '@/components/StarRating';
import { AnimeStatus } from '@/types/anime';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

// YouTubeのURLを正規化するユーティリティ
function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  // すでに埋め込みURLの場合はそのまま
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(new URL(url).search);
    videoId = urlParams.get('v') || '';
  } else if (url.includes('youtube.com/v/')) {
    videoId = url.split('youtube.com/v/')[1].split(/[?#]/)[0];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0` : url;
}

export default function AnimeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { animeList, updateUserData } = useAnimeData();
  const anime = animeList.find((a) => a.id === id);

  const status = anime?.userData?.status || '見たい';
  const rating = anime?.userData?.rating || 0;
  const progress = anime?.userData?.progress || 0;

  // 類似作品の選出（同じタグを1つでも持っているものを抽出、自分以外）
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

  const embedUrl = getYouTubeEmbedUrl(anime.pv_url);

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>
        {/* Left: Info */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>{anime.title}</h1>
          {anime.season && <div style={{ fontSize: '14px', color: '#d4a843', marginBottom: '16px' }}>{anime.season}</div>}

          <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.8', marginBottom: '24px' }}>
            {anime.synopsis || 'あらすじはまだ登録されていません。'}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {anime.tags.map((tag) => (
              <span key={tag} style={{ padding: '6px 16px', border: '1px solid #555', borderRadius: '6px', fontSize: '13px', color: '#ccc' }}>#{tag}</span>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>あなたの評価</div>
            <StarRating value={rating} size={28} onChange={(v) => updateUserData(anime.id, { rating: v })} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>視聴状態</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['見たい', '視聴中', '完了', '保留', '視聴切り'] as AnimeStatus[]).map((s) => (
                <button key={s} onClick={() => updateUserData(anime.id, { status: s })}
                  style={{
                    padding: '7px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                    background: anime.userData?.status === s ? '#d4a843' : '#333', color: anime.userData?.status === s ? '#000' : '#ccc',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>

          {anime.userData?.status === '視聴中' && anime.total_episodes > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>進行状況</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" value={progress}
                  onChange={(e) => updateUserData(anime.id, { progress: parseInt(e.target.value) || 0 })}
                  style={{ width: '60px', padding: '6px', background: '#222', border: '1px solid #444', borderRadius: '4px', color: '#fff', fontSize: '14px', textAlign: 'center' }}
                />
                <span style={{ color: '#666', fontSize: '13px' }}>/ {anime.total_episodes} 話</span>
              </div>
            </div>
          )}

          {!anime.userData && (
            <button onClick={() => updateUserData(anime.id, { status: '見たい', rating: 0, progress: 0 })}
              style={{ width: '100%', padding: '14px', background: '#d4a843', color: '#000', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >＋ライブラリに追加</button>
          )}
        </motion.div>

        {/* Right: Media */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative' }}>
            {anime.pv_url ? (
              <ReactPlayer
                url={embedUrl}
                playing
                muted
                loop
                controls
                width="100%"
                height="100%"
                config={{
                  youtube: {
                    playerVars: { autoplay: 1, mute: 1, rel: 0 }
                  }
                }}
              />
            ) : anime.image_url ? (
              <img src={anime.image_url} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                PV / 画像なし
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Similar Anime Section */}
      {similar.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#d4a843' }}>
            類似のアニメ（この作品を見た人におすすめ）
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
            {similar.map((a, i) => (
              <AnimeCard key={a.id} anime={a} index={i} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
