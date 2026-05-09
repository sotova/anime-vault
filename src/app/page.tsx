'use client';

import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

export default function HomePage() {
  const { animeList, loading } = useAnimeData();

  if (loading) return <div style={{ padding: '60px', color: '#999', textAlign: 'center' }}>読み込み中...</div>;

  const watching = animeList.filter((a) => a.userData?.status === '視聴中');
  const seasonal = animeList.filter((a) => a.season).slice(0, 20);
  const recommended = animeList.slice().sort(() => 0.5 - Math.random()).slice(0, 20);

  return (
    <div style={{ padding: '40px 0', width: '100%', overflowX: 'hidden' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(24px, 8vw, 48px)', color: '#d4a843', textAlign: 'center', marginBottom: '40px' }}
      >
        Anime Manager
      </motion.h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {watching.length > 0 && (
          <CarouselSection title="視聴中の作品" href="/library">
            {watching.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} showProgress index={i} /></CardFrame>)}
          </CarouselSection>
        )}

        <CarouselSection title="今季アニメ" href="/anime">
          {seasonal.length > 0 ? (
            seasonal.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} index={i} /></CardFrame>)
          ) : <div style={{ padding: '40px', color: '#444', textAlign: 'center', width: '100%' }}>作品がありません</div>}
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
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // デスクトップの場合のみボタンを表示候補にする
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    setShowButtons(!isMobile);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5%', marginBottom: '16px' }}>
        <h2 style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: '#fff' }}>{title}</h2>
        {href && <Link href={href} style={{ fontSize: '13px', color: '#d4a843', textDecoration: 'none', fontWeight: 'bold' }}>すべて表示 →</Link>}
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        {/* Buttons (Desktop Only) */}
        {showButtons && (
          <>
            <button 
              onClick={() => scroll('left')}
              className="scroll-btn-hover"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #444', color: '#d4a843', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ‹
            </button>
            <button 
              onClick={() => scroll('right')}
              className="scroll-btn-hover"
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #444', color: '#d4a843', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ›
            </button>
          </>
        )}

        <div 
          ref={scrollRef}
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            padding: '10px 5% 30px',
            scrollSnapType: 'x proximity',
            scrollBehavior: 'smooth'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ 
      width: 'clamp(130px, 30vw, 180px)', 
      flexShrink: 0,
      scrollSnapAlign: 'start'
    }}>
      {children}
    </div>
  );
}
