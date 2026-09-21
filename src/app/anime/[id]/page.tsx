'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { RemoteImage } from '@/components/RemoteImage';
import { StarRating } from '@/components/StarRating';
import { ANIME_STATUS_OPTIONS, ANIME_STATUS_STYLES } from '@/types/anime';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { compareSeasons, getBaseTitle } from '@/utils/animeUtils';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

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
  const reducedMotion = useReducedMotion();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleBack = () => {
    if (reducedMotion) {
      router.back();
      return;
    }
    setIsLeaving(true);
    window.setTimeout(() => router.back(), 300);
  };


  const rating = anime?.userData?.rating || 0;
  const progress = anime?.userData?.progress || 0;

  const similar = useMemo(() => {
    if (!anime) return [];
    const base = getBaseTitle(anime);
    return animeList
      .filter((a) => a.id !== anime.id && getBaseTitle(a) !== base && a.tags.some((t) => anime.tags.includes(t)))
      .slice(0, 6);
  }, [anime, animeList]);

  // 同じシリーズの別シーズンを取得
  const otherSeasons = useMemo(() => {
    if (!anime) return [];
    const base = getBaseTitle(anime);
    return animeList
      .filter((a) => getBaseTitle(a) === base)
      .sort((a, b) => compareSeasons(a.season, b.season));
  }, [anime, animeList]);

  if (!anime) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#49454f' }}>
        作品が見つかりません。
        <br /><button onClick={() => router.push('/')} style={{ marginTop: '16px', padding: '8px 24px', background: '#6750a4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>ホームに戻る</button>
      </div>
    );
  }

  const videoId = getYouTubeId(anime.pv_url);

  return (
    <motion.div className="m3-page" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: isLeaving ? 0 : 1, y: isLeaving ? -8 : 0 }} transition={{ duration: reducedMotion ? 0 : .3, ease: 'easeOut' }}>
      <button type="button" onClick={handleBack} style={{ marginBottom: '24px', padding: '9px 14px', background: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid var(--outline)', borderRadius: '999px', cursor: 'pointer', fontWeight: 'bold' }}>← 一覧に戻る</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, .9fr)', gap: '48px', marginBottom: '48px' }}>
        {/* Left: Info */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .3, ease: 'easeOut' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>{anime.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {anime.season && <div style={{ fontSize: '16px', color: '#6750a4', fontWeight: 'bold' }}>{anime.season}</div>}
            <button
              onClick={() => router.push(`/admin?editId=${anime.id}`)}
              style={{ padding: '6px 12px', background: '#e7e0ec', color: '#49454f', border: '1px solid #79747e', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Pencil size={14} />編集</span>
            </button>
          </div>

          {otherSeasons.length > 1 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#49454f', marginBottom: '8px' }}>シリーズ・シーズン切り替え</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {otherSeasons.map(s => {
                  let suffix = s.title.replace(getBaseTitle(s.title), '').trim();
                  if (!suffix) suffix = '第1期';
                  return (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/anime/${s.id}`)}
                      style={{
                        padding: '8px 16px', background: s.id === anime.id ? '#6750a4' : '#f7f2fa',
                        color: s.id === anime.id ? '#fff' : '#1d1b20', border: s.id === anime.id ? 'none' : '1px solid #79747e',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform .3s ease, opacity .3s ease'
                      }}
                    >
                      {s.season ? `${s.season} ` : ''}({suffix})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: '15px', color: '#1d1b20', lineHeight: '1.8', marginBottom: '24px' }}>
            {anime.synopsis || 'あらすじはまだ登録されていません。'}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {anime.tags.map((tag) => (
              <Link
                key={tag}
                href={`/anime?tag=${encodeURIComponent(tag)}`}
                aria-label={`${tag}タグで作品を検索`}
                style={{ padding: '6px 16px', border: '1px solid #79747e', borderRadius: '20px', fontSize: '13px', color: '#49454f', background: '#f7f2fa', textDecoration: 'none' }}
              >#{tag}</Link>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#49454f', marginBottom: '8px' }}>あなたの評価</div>
            <StarRating value={rating} size={32} onChange={(v) => updateUserData(anime.id, { rating: v })} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#49454f', marginBottom: '8px' }}>視聴状態</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ANIME_STATUS_OPTIONS.map((s) => {
                const statusStyle = ANIME_STATUS_STYLES[s];
                const isActive = anime.userData?.status === s;
                return (
                  <motion.button key={s} onClick={() => updateUserData(anime.id, { status: s })} animate={{ scale: isActive ? 1.03 : 1 }} transition={{ duration: reducedMotion ? 0 : .3, ease: 'easeOut' }}
                    style={{
                      position: 'relative', overflow: 'hidden', isolation: 'isolate', padding: '8px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                      background: '#e7e0ec',
                      color: isActive ? statusStyle.color : '#1d1b20',
                    }}
                  ><span className="status-choice-color" style={{ position: 'absolute', inset: 0, zIndex: -1, background: statusStyle.background, opacity: isActive ? 1 : 0, transition: reducedMotion ? 'none' : 'opacity .3s ease' }} /><span style={{ position: 'relative', zIndex: 1 }}>{s}</span></motion.button>
                );
              })}
            </div>
          </div>

          {anime.userData?.status === '視聴中' && anime.total_episodes > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#49454f', marginBottom: '8px' }}>進行状況</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="number" value={progress}
                  onChange={(e) => updateUserData(anime.id, { progress: parseInt(e.target.value) || 0 })}
                  style={{ width: '70px', padding: '8px', background: '#f7f2fa', border: '1px solid #79747e', borderRadius: '6px', color: '#1d1b20', fontSize: '16px', textAlign: 'center' }}
                />
                <span style={{ color: '#49454f', fontSize: '14px' }}>/ {anime.total_episodes} 話</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {!anime.userData ? (
              <button onClick={() => updateUserData(anime.id, { status: '見たい', rating: 0, progress: 0 })}
                style={{ flex: 1, padding: '16px', background: '#6750a4', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >＋ライブラリに追加</button>
            ) : (
              <button onClick={() => { if(confirm('ライブラリから削除しますか？')) removeFromLibrary(anime.id); }}
                style={{ flex: 1, padding: '16px', background: '#79747e', color: '#f87171', border: '1px solid #79747e', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              >ライブラリから削除</button>
            )}
          </div>
        </motion.div>

        {/* Right: Media */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .3, ease: 'easeOut' }}>
          <div style={{ aspectRatio: '16/9', background: '#f3edf7', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
            {videoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&controls=1`}
                title={anime.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <RemoteImage src={anime.image_url} alt={anime.title} placeholder="映像なし" sizes="(max-width: 768px) 100vw, 50vw" />
            )}
          </div>

          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '0 8px' }}>
             <div><div style={{ fontSize: '11px', color: '#49454f', marginBottom: '4px' }}>放送時期</div><div style={{ fontSize: '14px', color: '#1d1b20' }}>{anime.season || '不明'}</div></div>
             <div><div style={{ fontSize: '11px', color: '#49454f', marginBottom: '4px' }}>話数</div><div style={{ fontSize: '14px', color: '#1d1b20' }}>{anime.total_episodes > 0 ? `全${anime.total_episodes}話` : '話数不明'}</div></div>

             {anime.official_site && (
               <div style={{ gridColumn: 'span 2' }}>
                 <div style={{ fontSize: '11px', color: '#49454f', marginBottom: '4px' }}>公式サイト</div>
                 <a href={anime.official_site} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#6750a4', textDecoration: 'none' }}>
                   {anime.official_site}
                 </a>
               </div>
             )}

             {anime.copyright && (
               <div style={{ gridColumn: 'span 2' }}>
                 <div style={{ fontSize: '10px', color: '#49454f' }}>{anime.copyright}</div>
               </div>
             )}
          </div>
        </motion.div>
      </div>

      {similar.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .3, ease: 'easeOut', delay: reducedMotion ? 0 : .3 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#6750a4', paddingBottom: '8px', borderBottom: '1px solid #cac4d0' }}>
            この作品を見た人におすすめ
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
            {similar.map((a, i) => (
              <AnimeCard key={a.id} anime={a} index={i} />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
