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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
    >
      <Link href={`/anime/${anime.id}`} style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="anime-card"
        >
          {/* Status Badge */}
          {status && status !== '見たい' && (
            <div className="status-badge" style={{ background: statusColors[status] || '#666' }}>
              {status}
            </div>
          )}

          {/* Image */}
          <div className="image-container">
            {anime.image_url ? (
              <img src={anime.image_url} alt={anime.title} />
            ) : (
              <div className="no-image">画像なし</div>
            )}

            {/* Gradient Overlay */}
            <div className="gradient-overlay" />

            {/* Info Overlay */}
            <div className="info-overlay">
              <div className="anime-title">{anime.title}</div>

              <div className="anime-meta">
                {rating > 0 ? (
                  <StarRating value={rating} size={8} readonly />
                ) : (
                  <span className="season-text">{anime.season || '???'}</span>
                )}
                
                {showProgress && status === '視聴中' && total > 0 && (
                   <span className="progress-text">{progress}/{total}話</span>
                )}
              </div>

              {/* Progress Bar */}
              {showProgress && status === '視聴中' && total > 0 && (
                <div className="progress-bar-bg">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((progress / total) * 100, 100)}%` }}
                    className="progress-bar-fill"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>

      <style jsx>{`
        .anime-card {
          background: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          aspect-ratio: 3/4;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .status-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 5;
          color: #fff;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 3px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .image-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #333;
          color: #666;
          font-size: 10px;
        }
        .gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60%;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
          z-index: 2;
        }
        .info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 8px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .anime-title {
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .anime-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2px;
        }
        .season-text { font-size: 9px; color: #aaa; }
        .progress-text { font-size: 9px; color: #3b82f6; font-weight: bold; }
        .progress-bar-bg {
          height: 2px;
          background: rgba(255,255,255,0.2);
          border-radius: 1px;
          overflow: hidden;
          margin-top: 1px;
        }
        .progress-bar-fill {
          height: 100%;
          background: #3b82f6;
        }

        @media (max-width: 768px) {
          .anime-title { font-size: 11px; }
          .info-overlay { padding: 6px; }
        }
      `}</style>
    </motion.div>
  );
}
