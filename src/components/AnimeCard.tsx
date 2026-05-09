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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.4) }}
    >
      <Link href={`/anime/${anime.id}`} style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            aspectRatio: '3/4',
            boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {/* Status Badge */}
          {status && status !== '見たい' && (
            <div style={{
              position: 'absolute', top: '8px', right: '8px', zIndex: 10,
              background: statusColors[status] || '#666', color: '#fff',
              fontSize: '10px', fontWeight: 'bold', padding: '3px 8px',
              borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {status}
            </div>
          )}

          {/* Image with Unified Cropping */}
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {anime.image_url ? (
              <img 
                src={anime.image_url} 
                alt={anime.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#444', fontSize: '12px' }}>
                No Image
              </div>
            )}

            {/* Premium Gradient Overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
              zIndex: 2
            }} />

            {/* Info Overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, width: '100%',
              padding: '12px', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <div style={{
                fontSize: '13px', fontWeight: 'bold', color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', white-space: 'nowrap',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}>
                {anime.title}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {rating > 0 ? (
                  <StarRating value={rating} size={10} readonly />
                ) : (
                  <span style={{ fontSize: '10px', color: '#aaa' }}>{anime.season || '---'}</span>
                )}
                
                {showProgress && status === '視聴中' && total > 0 && (
                   <span style={{ fontSize: '10px', color: '#d4a843', fontWeight: 'bold' }}>{progress}/{total}話</span>
                )}
              </div>

              {/* Progress Bar (Watching only) */}
              {showProgress && status === '視聴中' && total > 0 && (
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((progress / total) * 100, 100)}%` }}
                    style={{ height: '100%', background: '#d4a843' }}
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
