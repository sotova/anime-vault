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
          whileHover={{ scale: 1.05, zIndex: 10 }}
          style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            aspectRatio: '3/4',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Status Badge */}
          {status && status !== '見たい' && (
            <div style={{
              position: 'absolute', top: '8px', right: '8px', zIndex: 5,
              background: statusColors[status] || '#666',
              color: '#fff', fontSize: '10px', fontWeight: 'bold',
              padding: '2px 8px', borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              {status}
            </div>
          )}

          {/* Image */}
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {anime.image_url ? (
              <img src={anime.image_url} alt={anime.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}>
                <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>画像なし</span>
              </div>
            )}

            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
              zIndex: 2,
            }} />

            {/* Info Overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '12px',
              zIndex: 3, display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <div style={{
                fontSize: '14px', fontWeight: '900', color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {anime.title}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                {rating > 0 ? (
                  <StarRating value={rating} size={10} readonly />
                ) : (
                  <span style={{ fontSize: '10px', color: '#aaa' }}>{anime.season || '不明'}</span>
                )}
                
                {showProgress && status === '視聴中' && total > 0 && (
                   <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>{progress}/{total}話</span>
                )}
              </div>

              {/* Progress Bar (Small) */}
              {showProgress && status === '視聴中' && total > 0 && (
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((progress / total) * 100, 100)}%` }}
                    style={{ height: '100%', background: '#3b82f6' }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
