'use client';

import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect, useMemo } from 'react';
import { getBaseTitle } from '@/utils/animeUtils';
import { Anime } from '@/types/anime';

// ユーザー様の形式「2026 春」に合わせて取得
function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let season = '';
  if (month >= 1 && month <= 3) season = '冬';
  else if (month >= 4 && month <= 6) season = '春';
  else if (month >= 7 && month <= 9) season = '夏';
  else season = '秋';
  return `${year} ${season}`; // 「年」を抜いた形式
}

export default function HomePage() {
  const { animeList, loading } = useAnimeData();
  const currentSeasonLabel = useMemo(() => getCurrentSeason(), []);
  const [recommended, setRecommended] = useState<typeof animeList>([]);

  useEffect(() => {
    // ランダムに並び替えてからシリーズで重複排除
    const shuffled = animeList.slice().sort(() => 0.5 - Math.random());
    const grouped = shuffled.reduce((acc, a) => {
      const base = getBaseTitle(a.title);
      if (!acc[base]) acc[base] = [];
      acc[base].push(a);
      return acc;
    }, {} as Record<string, Anime[]>);
    
    const uniqueRecommended = Object.values(grouped)
      .map(group => group.sort((a, b) => (a.season || '').localeCompare(b.season || ''))[0])
      .slice(0, 15);
      
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecommended(uniqueRecommended);
  }, [animeList]);

  if (loading) return <div style={{ padding: '60px', color: '#999', textAlign: 'center' }}>読み込み中...</div>;

  const watching = animeList.filter((a) => a.userData?.status === '視聴中');
  const seasonal = animeList.filter((a) => a.season === currentSeasonLabel);
  // 「見たい」作品を抽出
  const planToWatch = animeList.filter((a) => a.userData?.status === '見たい');

  return (
    <div style={{ padding: '60px 0', width: '100%', overflowX: 'hidden' }}>
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(32px, 8vw, 56px)', color: '#d4a843', textAlign: 'center', marginBottom: '60px', textShadow: '0 4px 20px rgba(212,168,67,0.2)' }}
      >
        Anime Vault
      </motion.h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        {watching.length > 0 && (
          <CarouselSection title="視聴中の作品" href="/library">
            {watching.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} showProgress index={i} /></CardFrame>)}
          </CarouselSection>
        )}

        <CarouselSection 
          title={`今季アニメ (${currentSeasonLabel})`} 
          href={`/anime?season=${encodeURIComponent(currentSeasonLabel)}`}
        >
          {seasonal.length > 0 ? (
            seasonal.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} index={i} /></CardFrame>)
          ) : <div style={{ padding: '40px', color: '#444', textAlign: 'center', width: '100%' }}>{currentSeasonLabel} の作品はまだ登録されていません</div>}
        </CarouselSection>

        {/* 変更: 見たい作品 */}
        <CarouselSection title="見たい作品 (ライブラリ)" href="/library">
          {planToWatch.length > 0 ? (
            planToWatch.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} index={i} /></CardFrame>)
          ) : <div style={{ padding: '40px', color: '#444', textAlign: 'center', width: '100%' }}>ライブラリに「見たい」作品がありません</div>}
        </CarouselSection>

        <CarouselSection title="おすすめの作品" href="/anime">
          {recommended.length > 0 ? (
            recommended.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} index={i} /></CardFrame>)
          ) : <div style={{ padding: '40px', color: '#444', textAlign: 'center', width: '100%' }}>作品がありません</div>}
        </CarouselSection>
      </div>
    </div>
  );
}

function CarouselSection({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScroll({
        left: scrollLeft > 10,
        right: scrollLeft < scrollWidth - clientWidth - 10
      });
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const amount = clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5vw', marginBottom: '16px' }}>
        <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 'bold', color: '#fff', letterSpacing: '0.05em' }}>{title}</h2>
        {href && <Link href={href} style={{ fontSize: '13px', color: '#d4a843', textDecoration: 'none', fontWeight: 'bold', opacity: 0.8 }}>すべて表示 →</Link>}
      </div>

      <div style={{ position: 'relative', width: '100%' }} onMouseEnter={checkScroll}>
        {canScroll.left && (
          <div style={{ 
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', 
            background: 'linear-gradient(to right, rgba(10,10,10,1) 0%, transparent 100%)', 
            zIndex: 10, display: 'flex', alignItems: 'center', paddingLeft: '20px',
            pointerEvents: 'none'
          }}>
            <button 
              onClick={() => scroll('left')}
              className="scroll-btn-hover"
              style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid #444', color: '#d4a843', cursor: 'pointer', fontSize: '24px', pointerEvents: 'auto' }}
            >‹</button>
          </div>
        )}
        {canScroll.right && (
          <div style={{ 
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', 
            background: 'linear-gradient(to left, rgba(10,10,10,1) 0%, transparent 100%)', 
            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '20px',
            pointerEvents: 'none'
          }}>
            <button 
              onClick={() => scroll('right')}
              className="scroll-btn-hover"
              style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid #444', color: '#d4a843', cursor: 'pointer', fontSize: '24px', pointerEvents: 'auto' }}
            >›</button>
          </div>
        )}
        <div ref={scrollRef} onScroll={checkScroll} className="no-scrollbar" style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '10px 5vw 30px', scrollSnapType: 'x proximity', scrollBehavior: 'smooth', scrollPaddingLeft: '5vw' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 'clamp(110px, 28vw, 200px)', flexShrink: 0, scrollSnapAlign: 'start' }}>
      {children}
    </div>
  );
}
