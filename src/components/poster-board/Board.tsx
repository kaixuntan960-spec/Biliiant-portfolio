import { motion, useMotionValue, useSpring } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { THEMES } from './data';
import { PosterTheme } from './types';
import PosterOverlay from './PosterOverlay';
import StickyNote from './StickyNote';
import { useI18n } from '../../i18n';

const Board: React.FC = () => {
  const { lang } = useI18n();
  const [selectedTheme, setSelectedTheme] = useState<PosterTheme | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-gray-400 text-[11px] font-light tracking-widest">
              {lang === 'en' ? 'Tap a note for a surprise~' : '点击便签有惊喜噢~'}
            </p>
          </div>
        </div>
      </div>


      <motion.div
        drag
        dragConstraints={{ left: -4500, right: -2500, top: -4500, bottom: -2500 }}
        dragElastic={0.1}
        dragTransition={{ power: 0.2, timeConstant: 300 }}
        style={{ x, y, scale: smoothScale, transformOrigin: '4250px 4200px' }}
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
