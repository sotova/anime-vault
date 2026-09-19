'use client';

import { HybridAnime } from '@/types/anime';
import { StarRating } from './StarRating';
import { RemoteImage } from './RemoteImage';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface AnimeCardProps { anime: HybridAnime; showProgress?: boolean; index?: number; onNavigate?: () => void; }
const statusColors: Record<string, string> = { '見たい': 'var(--primary)', '視聴中': '#006a6a', '完了': '#2e7d32', '保留': '#a15c00', '視聴切り': '#b3261e' };

export function AnimeCard({ anime, showProgress = false, index = 0, onNavigate }: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = anime.userData?.status; const progress = anime.userData?.progress || 0; const total = anime.total_episodes || 0; const rating = anime.userData?.rating || 0;
  return <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .36, delay: Math.min(index * .025, .35) }}>
    <Link href={`/anime/${anime.id}`} onClick={onNavigate} style={{ textDecoration: 'none' }} aria-label={`${anime.title}の詳細を見る`}>
      <motion.article onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} whileHover={{ y: -6, scale: 1.015 }} transition={{ type: 'spring', stiffness: 360, damping: 23 }} style={{ overflow: 'hidden', position: 'relative', aspectRatio: '3 / 4', borderRadius: 22, background: 'var(--surface-variant)', boxShadow: '0 8px 20px rgba(49,45,65,.16)', border: '1px solid color-mix(in srgb, var(--outline) 30%, transparent)' }}>
        <RemoteImage src={anime.image_url} alt={anime.title} sizes="(max-width: 768px) 42vw, (max-width: 1200px) 20vw, 240px" />
        {status && <span style={{ position: 'absolute', top: 10, right: 10, background: statusColors[status] || '#49454f', color: status === '見たい' ? 'var(--on-primary)' : '#fff', padding: '5px 9px', borderRadius: 999, fontSize: 10, fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,.22)' }}>{status}</span>}
        <div style={{ position: 'absolute', inset: '35% 0 0', background: 'linear-gradient(transparent, rgba(29,27,32,.93))' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 13px', minHeight: '58%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(transparent, rgba(20, 16, 8, .96) 18%)', color: '#fff', opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity .2s ease, transform .2s ease', pointerEvents: 'none', zIndex: 3 }}>
          <strong className="anime-card-title" style={{ fontSize: 14, lineHeight: 1.35 }}>{anime.title}</strong>
          <span style={{ marginTop: 5, fontSize: 10, opacity: .9 }}>{anime.season || '作品情報'}</span>
          <p className="anime-card-synopsis" style={{ margin: '7px 0 0', fontSize: 11, lineHeight: 1.5, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{anime.synopsis || 'あらすじはまだ登録されていません。'}</p>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 13, color: '#fff', opacity: isHovered ? 0 : 1, transition: 'opacity .2s ease', zIndex: 2 }}>
          <div className="anime-card-title" style={{ fontSize: 13, lineHeight: 1.35, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{anime.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7, minHeight: 14 }}>{rating > 0 ? <StarRating value={rating} size={10} readonly /> : <span style={{ fontSize: 10, opacity: .82 }}>{anime.season || '作品情報'}</span>}{showProgress && status === '視聴中' && total > 0 && <span style={{ fontSize: 10, fontWeight: 800 }}>{progress}/{total}話</span>}</div>
          {showProgress && status === '視聴中' && total > 0 && <div style={{ height: 4, marginTop: 8, borderRadius: 999, background: 'rgba(255,255,255,.32)', overflow: 'hidden' }}><div style={{ width: `${Math.min(Math.max(progress / total * 100, 0), 100)}%`, height: '100%', borderRadius: 99, background: '#e9ddff' }} /></div>}
        </div>
      </motion.article>
    </Link>
  </motion.div>;
}
