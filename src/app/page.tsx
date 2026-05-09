'use client';

import { useAnimeData } from '@/hooks/useAnimeData';
import { AnimeCard } from '@/components/AnimeCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';

export default function HomePage() {
  const { animeList, loading } = useAnimeData();

  if (loading) return <div style={{ padding: '60px', color: '#999' }}>読み込み中...</div>;

  const watching = animeList.filter((a) => a.userData?.status === '視聴中');
  const seasonal = animeList.filter((a) => a.season).slice(0, 15);
  const recommended = animeList.slice().sort(() => 0.5 - Math.random()).slice(0, 15);

  return (
    <div style={{ padding: '40px 0', width: '100%', overflowX: 'hidden' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="home-title"
      >
        Anime Manager
      </motion.h1>

      <div style={{ width: '100%' }}>
        {watching.length > 0 && (
          <Section title="視聴中の作品" href="/library">
            <HorizontalScroll>
              {watching.map((a, i) => <CardWrapper key={a.id}><AnimeCard anime={a} showProgress index={i} /></CardWrapper>)}
            </HorizontalScroll>
          </Section>
        )}

        <Section title="今季アニメ" href="/anime">
          {seasonal.length > 0 ? (
            <HorizontalScroll>
              {seasonal.map((a, i) => <CardWrapper key={a.id}><AnimeCard anime={a} index={i} /></CardWrapper>)}
            </HorizontalScroll>
          ) : <EmptyState text="登録済み作品がありません" />}
        </Section>

        <Section title="あなたにおすすめ" href="/anime">
          {recommended.length > 0 ? (
            <HorizontalScroll>
              {recommended.map((a, i) => <CardWrapper key={a.id}><AnimeCard anime={a} index={i} /></CardWrapper>)}
            </HorizontalScroll>
          ) : <EmptyState text="作品を登録してください" />}
        </Section>
      </div>

      <style jsx>{`
        .home-title {
          font-family: 'Georgia', serif;
          font-style: italic;
          font-size: 48px;
          color: #d4a843;
          text-align: center;
          margin-bottom: 48px;
        }
        @media (max-width: 768px) {
          .home-title { font-size: 32px; margin-bottom: 24px; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <div style={{ marginBottom: '40px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5%', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{title}</h2>
        {href && <Link href={href} style={{ fontSize: '13px', color: '#d4a843', textDecoration: 'none' }}>すべて表示 →</Link>}
      </div>
      {children}
    </div>
  );
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} className="scroll-container-outer">
      {/* Scroll Buttons (Desktop only) */}
      <button onClick={() => scroll('left')} className="scroll-btn left">‹</button>
      <button onClick={() => scroll('right')} className="scroll-btn right">›</button>

      <div ref={scrollRef} className="scroll-row">
        {children}
      </div>

      <style jsx>{`
        .scroll-row {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding: 10px 5% 30px;
          scrollbar-width: none;
          ms-overflow-style: none;
        }
        .scroll-row::-webkit-scrollbar { display: none; }
        
        .scroll-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(0,0,0,0.7);
          border: 1px solid #444;
          color: #d4a843;
          border-radius: 50%;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: auto;
        }
        .scroll-container-outer:hover .scroll-btn {
          opacity: 1;
        }
        .left { left: 10px; }
        .right { right: 10px; }

        @media (max-width: 768px) {
          .scroll-btn { display: none; }
          .scroll-row { gap: 12px; }
        }
      `}</style>
    </div>
  );
}

function CardWrapper({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '160px', flexShrink: 0 }}>{children}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ margin: '0 5%', padding: '40px', textAlign: 'center', color: '#444', background: '#111', borderRadius: '12px' }}>{text}</div>;
}
