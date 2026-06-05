import { motion, useMotionValue, useSpring } from 'motion/react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { THEMES } from './data';
import { PosterTheme } from './types';
import PosterOverlay from './PosterOverlay';
import StickyNote from './StickyNote';
import { useI18n } from '../../i18n';

const Board: React.FC = () => {
  const { lang } = useI18n();
  const [selectedTheme, setSelectedTheme] = useState<PosterTheme | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  const x = useMotionValue(window.innerWidth / 2 - 4250);
  const y = useMotionValue(window.innerHeight / 2 - 4200);
  const scale = useMotionValue(0.75);

  const smoothScale = useSpring(scale, { damping: 20, stiffness: 100 });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (selectedTheme) return;
      e.preventDefault();
      const zoomSpeed = 0.001;
      const delta = e.deltaY * -zoomSpeed;
      const newScale = Math.min(Math.max(scale.get() + delta, 0.3), 1.5);
      scale.set(newScale);
    };

    const target = containerRef.current;
    if (target) {
      target.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (target) target.removeEventListener('wheel', handleWheel);
    };
  }, [selectedTheme, scale]);

  const getTouchDist = useCallback((t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const onTouchStart = (e: TouchEvent) => {
      if (selectedTheme || e.touches.length < 2) return;
      e.preventDefault();
      setIsPinching(true);
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      pinchRef.current = { startDist: dist, startScale: scale.get() };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pinchRef.current || e.touches.length < 2) return;
      e.preventDefault();
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const ratio = dist / pinchRef.current.startDist;
      const newScale = Math.min(Math.max(pinchRef.current.startScale * ratio, 0.3), 1.5);
      scale.set(newScale);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
        setIsPinching(false);
      }
    };

    target.addEventListener('touchstart', onTouchStart, { passive: false });
    target.addEventListener('touchmove', onTouchMove, { passive: false });
    target.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [selectedTheme, scale, getTouchDist]);

  const renderConnections = () => {
    const getPos = (i: number) => {
      return {
        x: (i % 3) * 640 + 3600 + 160,
        y: Math.floor(i / 3) * 1100 + 3500 + 50 + (i % 2 === 0 ? 0 : 300)
      };
    };

    return (
      <svg className="absolute inset-0 w-[8000px] h-[8000px] pointer-events-none opacity-[0.6]" style={{ zIndex: 0 }}>
        {THEMES.map((_, i) => {
          if (i === THEMES.length - 1) return null;
          const p1 = getPos(i);
          const p2 = getPos(i + 1);
          return (
            <path
              key={`conn-${i}`}
              d={`M ${p1.x} ${p1.y} C ${(p1.x + p2.x) / 2 + 150} ${p1.y}, ${(p1.x + p2.x) / 2 - 150} ${p2.y}, ${p2.x} ${p2.y}`}
              stroke="#7777CC"
              strokeWidth="2.5"
              strokeDasharray="6,8"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 4px rgba(100,100,200,0.35))' }}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        touchAction: 'none',
        background: '#FCF9F6',
        backgroundImage: `
          radial-gradient(900px 700px at 10% 5%, rgba(160,120,255,0.20) 0%, transparent 58%),
          radial-gradient(750px 550px at 90% 88%, rgba(200,160,255,0.16) 0%, transparent 55%),
          radial-gradient(650px 450px at 50% 42%, rgba(230,200,255,0.10) 0%, transparent 50%),
          radial-gradient(500px 400px at 22% 75%, rgba(255,220,240,0.12) 0%, transparent 50%),
          radial-gradient(500px 380px at 78% 22%, rgba(180,210,255,0.08) 0%, transparent 50%),
          radial-gradient(400px 320px at 55% 62%, rgba(255,235,210,0.08) 0%, transparent 48%)
        `,
      }}
    >
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="px-5 py-3 bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-serif italic font-light text-gray-900 tracking-tight leading-none text-center">
            {lang === 'en' ? 'Poster Collection' : '海报展览'}
          </h2>
        </div>
      </div>

      {/* Floating hint tag */}
      <div className="absolute top-[90px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="px-4 py-2 bg-amber-50/90 backdrop-blur-md border border-amber-200/80 rounded-full shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-700 text-xs font-medium tracking-wide">
            {lang === 'en' ? 'Tap a sticky note for a surprise!' : '👆 点击便签有惊喜噢~'}
          </span>
        </div>
      </div>


      <motion.div
        drag={!isPinching}
        dragConstraints={{ left: -4500, right: -2500, top: -4500, bottom: -2500 }}
        dragElastic={0.1}
        dragTransition={{ power: 0.2, timeConstant: 300 }}
        style={{ x, y, scale: smoothScale, transformOrigin: '4250px 4200px', touchAction: 'none' }}
        className="relative w-[8000px] h-[8000px] transform-gpu"
      >
        <div
          className="absolute inset-0 opacity-[0.012] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px)',
            backgroundSize: '100% 40px'
          }}
        />
        <div className="relative">
          {renderConnections()}
          {THEMES.map((theme, index) => (
            <StickyNote
              key={theme.id}
              theme={theme}
              index={index}
              onClick={(t) => setSelectedTheme(t)}
            />
          ))}
        </div>
      </motion.div>

      <PosterOverlay
        theme={selectedTheme}
        onClose={() => setSelectedTheme(null)}
      />
    </div>
  );
};

export default Board;
