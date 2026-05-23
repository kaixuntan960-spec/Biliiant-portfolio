import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PosterTheme } from './types';

interface PosterOverlayProps {
  theme: PosterTheme | null;
  onClose: () => void;
}

const PosterOverlay: React.FC<PosterOverlayProps> = ({ theme, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !theme?.extensions.length) return;

    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (mouseX !== null) {
        const deadZone = 0.12;
        if (Math.abs(mouseX) > deadZone) {
          const speed = mouseX * 0.6;
          el.scrollLeft += dt * speed;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [theme, mouseX]);

  const goNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = Math.min(450, el.clientWidth * 0.65);
    el.scrollBy({ left: cardW + 64, behavior: 'smooth' });
  }, []);

  const goPrev = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = Math.min(450, el.clientWidth * 0.65);
    el.scrollBy({ left: -(cardW + 64), behavior: 'smooth' });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    setMouseX(x);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  if (!theme) return null;

  const hasExtensions = theme.extensions.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] flex items-center justify-center p-4 md:p-8 overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#F9F9F9] rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.15)] border border-black/5 flex flex-col"
          style={{
            width: hasExtensions ? '95%' : 'auto',
            maxWidth: hasExtensions ? 'none' : 'min(580px, 85vw)',
            height: '92%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-5 right-5 z-40 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-black/5 pointer-events-auto shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Exhibition</span>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/80 hover:bg-white text-gray-600 flex items-center justify-center transition-all border border-black/5 pointer-events-auto backdrop-blur-sm shadow-sm"
            >
              <X size={22} />
            </button>
          </div>

          <div
            ref={scrollRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setShowControls(true)}
            className="flex-1 flex flex-nowrap overflow-x-auto px-10 md:px-16 gap-16 theme-scroll items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 space-y-4"
            >
              <div className="space-y-2">
                <div className="h-px w-12 bg-gray-900/20" />
                <h3 className="text-xl md:text-2xl font-serif italic text-gray-900 leading-tight tracking-tight">
                  {theme.mainPoster.title}
                </h3>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-light italic">
                  {theme.description}
                </p>
              </div>
              <div className="relative group rounded-xl overflow-hidden border border-black/5 shadow-[0_40px_100px_rgba(0,0,0,0.08)] bg-white flex items-center justify-center">
                <img
                  src={theme.mainPoster.imageUrl}
                  alt={theme.mainPoster.title}
                  className="max-h-[70vh] w-auto max-w-[min(480px,72vw)] object-contain"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-black/10" />
                  <span className="text-[9px] font-mono text-black/20 uppercase tracking-widest">Core_Ref</span>
                </div>
              </div>
            </motion.div>

            {hasExtensions && (
              <>
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="h-24 w-px bg-gradient-to-b from-transparent via-black/5 to-transparent" />
                  <span className="text-[10px] text-black/10 font-black uppercase tracking-[0.8em] vertical-text">Sequence</span>
                  <div className="h-24 w-px bg-gradient-to-b from-transparent via-black/5 to-transparent" />
                </div>

                {theme.extensions.map((poster, idx) => (
                  <motion.div
                    key={poster.id}
                    initial={{ opacity: 0, scale: 0.5, y: 80, rotate: -6 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    viewport={{ once: false, margin: "-10%" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-shrink-0 flex flex-col gap-4 justify-center"
                    style={{ width: poster.width > poster.height ? 'min(600px, 75vw)' : 'min(380px, 60vw)' }}
                  >
                    <div className="relative group overflow-hidden bg-white rounded-[2rem] border border-black/5 p-4 hover:border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.02)] transition-all flex flex-col gap-3">
                      <div className="overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
                        <img
                          src={poster.imageUrl}
                          alt={poster.title}
                          className="max-h-[65vh] max-w-full object-contain"
                          referrerPolicy="no-referrer"
                          draggable={false}
                        />
                      </div>
                      <div className="flex justify-between items-center shrink-0">
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-base text-gray-900 tracking-tight">{poster.title}</h5>
                          <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-mono">Series_0{idx + 1}</p>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-black/5 border border-black/5 text-[9px] font-mono text-gray-400">
                          {poster.width}x{poster.height}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}

            {hasExtensions && (
              <div className="flex-shrink-0 w-[300px] text-center space-y-6 flex flex-col items-center px-12">
                <div className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-black/10 animate-ping" />
                </div>
                <p className="text-black/10 font-serif italic text-xl leading-snug">
                  "End of thematic exploration. The journey continues in the next note."
                </p>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
              </div>
            )}
          </div>

          {/* 鼠标控制提示 */}
          {hasExtensions && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 pointer-events-none"
              style={{ opacity: showControls && mouseX === null ? 1 : 0 }}
            >
              <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-black/5 text-xs text-gray-500">
                鼠标左右移动浏览 · ← 上一个 · → 下一个
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PosterOverlay;
