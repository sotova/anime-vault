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
  const seasonal = animeList.filter((a) => a.season).slice(0, 24);
  const recommended = animeList.slice().sort(() => 0.5 - Math.random()).slice(0, 24);

  return (
    <div style={{ padding: '60px 0', width: '100%', overflowX: 'hidden' }}>
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(32px, 8vw, 56px)', color: '#d4a843', textAlign: 'center', marginBottom: '60px', textShadow: '0 4px 20px rgba(212,168,67,0.2)' }}
      >
        Anime Manager
      </motion.h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        {watching.length > 0 && (
          <CarouselSection title="視聴中の作品" href="/library">
            {watching.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} showProgress index={i} /></CardFrame>)}
          </CarouselSection>
        )}

        <CarouselSection title="今季アニメ" href="/anime">
          {seasonal.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} index={i} /></CardFrame>)}
        </CarouselSection>

        <CarouselSection title="おすすめの作品" href="/anime">
          {recommended.map((a, i) => <CardFrame key={a.id}><AnimeCard anime={a} index={i} /></CardFrame>)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 'bold', color: '#fff', letterSpacing: '0.05em' }}>{title}</h2>
        {href && <Link href={href} style={{ fontSize: '13px', color: '#d4a843', textDecoration: 'none', fontWeight: 'bold', opacity: 0.8 }}>すべて表示 →</Link>}
      </div>

      <div style={{ position: 'relative', width: '100%' }} onMouseEnter={checkScroll}>
        
        {/* Left Gradient & Button (Only show when scrolled) */}
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

        {/* Right Gradient & Button */}
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

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            padding: '10px 60px 30px',
            scrollSnapType: 'x proximity',
            scrollBehavior: 'smooth',
            scrollPaddingLeft: '60px' // Align snap to the padding
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
      width: 'clamp(140px, 20vw, 200px)', 
      flexShrink: 0,
      scrollSnapAlign: 'start'
    }}>
      {children}
    </div>
  );
}
