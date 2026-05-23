import { useEffect, useState } from "react";
import { Music, VolumeX, Volume2, Headphones } from "lucide-react";
import { useI18n } from "../i18n";

interface MusicModalProps {
  onChoice: (play: boolean) => void;
  visible: boolean;
}

const MusicModal = ({ onChoice = () => {}, visible = true }: MusicModalProps) => {
  const { lang } = useI18n();
  const [animating, setAnimating] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [bars] = useState(() => Array.from({ length: 12 }, (_, i) => i));

  useEffect(() => {
    if (visible) {
      setTimeout(() => setAnimating(true), 100);
    }
  }, [visible]);

  const handleChoice = (play: boolean) => {
    setExiting(true);
    setTimeout(() => {
      onChoice(play);
    }, 500);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(20px)",
        opacity: exiting ? 0 : animating ? 1 : 0,
        transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Animated bg orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", animationDelay: "2s" }}
      />

      {/* Card */}
      <div
        className="relative z-10 rounded-3xl border p-12 max-w-md w-full mx-6 text-center overflow-hidden"
        style={{
          background: "var(--card)",
          borderColor: "rgba(168,85,247,0.3)",
          transform: exiting ? "scale(0.9) translateY(20px)" : animating ? "scale(1) translateY(0)" : "scale(0.85) translateY(30px)",
          opacity: exiting ? 0 : animating ? 1 : 0,
          transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: "0 0 80px rgba(168,85,247,0.2), 0 40px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: "var(--primary)" }}
        />

        {/* Icon with animated music bars */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #c084fc 50%, var(--accent) 100%)" }}
          >
            <Headphones size={36} className="text-primary-foreground relative z-10" />
            {/* Ripple rings */}
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute rounded-2xl border-2 opacity-0"
                style={{
                  inset: 0,
                  borderColor: "rgba(255,255,255,0.4)",
                  animation: `musicRipple 2.4s ease-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Music bars visualizer */}
        <div className="flex items-end justify-center gap-1 h-10 mb-6">
          {bars.map((i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                background: `linear-gradient(180deg, var(--primary) 0%, var(--accent) 100%)`,
                height: `${20 + Math.sin(i * 0.8) * 14}px`,
                animation: `musicBar 1s ease-in-out infinite`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          {lang === "en" ? "Welcome ✨" : "欢迎来到我的空间 ✨"}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {lang === "en" ? "Enable background music for a more immersive experience?" : "是否要开启背景音乐，获得更沉浸的浏览体验？"}
          <br />
          <span className="text-primary text-xs">
            {lang === "en" ? "You can control it anytime in the bottom-right" : "随时可以在右下角控制音乐"}
          </span>
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleChoice(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-glow group relative overflow-hidden"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)" }}
            />
            <Volume2 size={16} />
            {lang === "en" ? "Enable" : "开启音乐"}
          </button>
          <button
            onClick={() => handleChoice(false)}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm border transition-all duration-300 hover:border-primary hover:text-foreground"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <VolumeX size={16} />
            {lang === "en" ? "Mute" : "静音浏览"}
          </button>
        </div>

        {/* Decorative corner dots */}
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse"
          style={{ background: "var(--accent)" }}
        />
        <div
          className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full opacity-50"
          style={{ background: "var(--primary)" }}
        />
      </div>

      <style>{`
        @keyframes musicRipple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes musicBar {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
};

export default MusicModal;
