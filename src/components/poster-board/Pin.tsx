import { motion } from 'motion/react';

interface PinProps {
  color?: string;
  className?: string;
}

const Pin: React.FC<PinProps> = ({ color = '#FF4D4D', className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        whileHover={{ scale: 1.2, rotate: 10 }}
        className="relative w-6 h-6 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%, white 0%, ${color} 40%, ${color} 80%, black 100%)`,
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25), 0 0 0 3px rgba(0,0,0,0.08)',
          opacity: 0.9,
        }}
      >
        <div className="absolute top-[15%] left-[15%] w-2 h-2 bg-white/60 rounded-full blur-[0.5px]" />
      </motion.div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-1 bg-black/5 blur-[1px] -mt-1" />
    </div>
  );
};

export default Pin;
