import { motion } from 'motion/react';
import React from 'react';
import { PosterTheme } from './types';
import Pin from './Pin';

interface StickyNoteProps {
  theme: PosterTheme;
  onClick: (theme: PosterTheme) => void;
  index: number;
}

const StickyNote: React.FC<StickyNoteProps> = ({ theme, onClick, index }) => {
  const stableRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const rotation = React.useMemo(() => (stableRandom(index + 1) - 0.5) * 18, [index]);
  const noteScale = React.useMemo(() => 0.95 + stableRandom(index + 4) * 0.1, [index]);

  // 错落感：按行和列综合错位，更自然
  const staggerMap = [
    { y: 0, z: 10 },     // index 0: 圣诞 — 基准
    { y: 200, z: 20 },   // index 1: 圣诞日历 — 下沉
    { y: 80, z: 15 },    // index 2: 妇女节 — 微沉
    { y: 280, z: 25 },   // index 3: 摄影 — 下沉最多
    { y: 140, z: 18 },   // index 4: 元宵 — 中间值
    { y: 60, z: 10 },    // index 5: 京东电商 — 微沉
  ];
  const stagger = staggerMap[index] ?? { y: 0, z: 10 };
  const left = (index % 3) * 640 + 3600;
  const top = Math.floor(index / 3) * 1100 + 3500 + stagger.y;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: noteScale }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: noteScale + 0.05, rotate: rotation + (rotation > 0 ? 3 : -3), zIndex: 50 }}
      className="absolute cursor-pointer group"
      onClick={() => onClick(theme)}
      style={{ left, top, zIndex: stagger.z }}
    >
      <div
        className="w-[320px] p-8 pb-12 rounded-[2.5rem] transition-shadow duration-300 flex flex-col gap-6"
        style={{
          backgroundColor: '#FFFFFF',
          transform: `rotate(${rotation}deg)`,
          boxShadow: '0 28px 60px rgba(0,0,0,0.12)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-24 rounded-t-[2.5rem] opacity-20 -z-10"
          style={{ backgroundColor: theme.color }}
        />
        <Pin className="absolute -top-4 left-1/2 -translate-x-1/2 z-20" color={theme.color} />
        <div className="space-y-4">
          <span className="text-3xl font-serif italic text-orange-500 opacity-60">
            0{index + 1}
          </span>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight leading-tight">
              {theme.title}
            </h3>
            <p className="text-gray-500 text-base leading-relaxed">
              {theme.description}
            </p>
          </div>
        </div>
        <div className="relative rounded-2xl bg-white overflow-hidden transition-colors duration-500">
          <img
            src={theme.mainPoster.imageUrl}
            alt={theme.mainPoster.title}
            className="w-full h-auto block"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
          <span>👆</span>
          <span>点击查看全部延展海报</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StickyNote;
