'use client';

import { HybridAnime } from '@/types/anime';
import { StarRating } from './StarRating';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AnimeCardProps {
  anime: HybridAnime;
  showProgress?: boolean;
  index?: number;
}

const statusColors: Record<string, string> = {
  '視聴中': '#3b82f6',
  '完了': '#22c55e',
  '保留': '#f59e0b',
  '視聴切り': '#ef4444',
};

export function AnimeCard({ anime, showProgress = false, index = 0 }: AnimeCardProps) {
  const status = anime.userData?.status;
  const progress = anime.userData?.progress || 0;
  const total = anime.total_episodes || 0;
  const rating = anime.userData?.rating || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/anime/${anime.id}`} style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(212,168,67,0.25)' }}
          transition={{ duration: 0.2 }}
          style={{
            background: '#f0f0f0',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {/* Status Badge */}
          {status && status !== '未視聴' && (
            <div style={{
              position: 'absolute', top: '8px', right: '8px', zIndex: 2,
              background: statusColors[status] || '#666',
              color: '#fff', fontSize: '10px', fontWeight: 'bold',
              padding: '2px 8px', borderRadius: '4px',
            }}>
              {status}
            </div>
          )}

          {/* Image - fixed aspect ratio */}
          <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: '#ddd' }}>
            {anime.image_url ? (
              <img src={anime.image_url} alt={anime.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                  ここに<br />アニメの<br />画像
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #ccc' }}>
            <div style={{
              fontSize: '13px', fontWeight: 'bold', color: '#222',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {anime.title}
            </div>

            {/* Season */}
            {anime.season && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{anime.season}</div>
            )}

            {/* Star Rating */}
            {rating > 0 && (
              <div style={{ marginTop: '4px' }}>
                <StarRating value={rating} size={12} readonly />
              </div>
            )}

            {/* Progress Bar */}
            {showProgress && status === '視聴中' && total > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ flex: 1, height: '5px', background: '#ccc', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((progress / total) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: '#3b82f6', borderRadius: '3px' }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: '#666' }}>{progress}/{total}</span>
              </div>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
