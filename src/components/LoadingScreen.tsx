import { useEffect, useRef, useState } from "react";

/**
 * 全屏加载动画 —— 霓虹粒子旋涡 + 品牌文字
 */
const LoadingScreen = ({ onLoaded }: { onLoaded?: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    onLoaded?.();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8 + 2, 99));
    }, 200);

    const COUNT = 120;
    const particles: {
      angle: number; radius: number; speed: number;
      size: number; hue: number; pulse: number;
      trail: { x: number; y: number }[];
    }[] = [];

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 20 + Math.random() * 60,
        speed: 0.008 + Math.random() * 0.015,
        size: 2 + Math.random() * 4,
        hue: (i / COUNT) * 60 + 240,
        pulse: Math.random() * Math.PI * 2,
        trail: [],
      });
    }

    let blinkTimer = 0;

    const draw = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, w, h);
      ctx.scale(devicePixelRatio, devicePixelRatio);

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const scale = Math.min(window.innerWidth, window.innerHeight) / 600;

      // 外层光晕
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160 * scale);
      grad.addColorStop(0, "rgba(124, 58, 237, 0.06)");
      grad.addColorStop(0.5, "rgba(124, 58, 237, 0.03)");
      grad.addColorStop(1, "rgba(124, 58, 237, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // 粒子轨道
      for (const p of particles) {
        p.angle += p.speed * (1 + Math.sin(elapsed * 0.3 + p.pulse) * 0.3);
        const px = cx + Math.cos(p.angle) * p.radius * scale;
        const py = cy + Math.sin(p.angle) * p.radius * scale;

        p.trail.push({ x: px, y: py });
        if (p.trail.length > 12) p.trail.shift();

        for (let t = 0; t < p.trail.length - 1; t++) {
          const alpha = (t / p.trail.length) * 0.3;
          const size = p.size * (t / p.trail.length) * 0.5;
          ctx.beginPath();
          ctx.arc(p.trail[t].x, p.trail[t].y, size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha})`;
          ctx.fill();
        }

        const glow = 1 + Math.sin(elapsed * 2 + p.pulse) * 0.3;
        const r = p.size * glow;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, 0.9)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, 0.15)`;
        ctx.fill();
      }

      // 连接线
      const visible = particles.filter((p) => {
        const px = cx + Math.cos(p.angle) * p.radius * scale;
        const py = cy + Math.sin(p.angle) * p.radius * scale;
        return Math.hypot(px - cx, py - cy) < 90 * scale;
      });
      for (let i = 0; i < visible.length; i++) {
        for (let j = i + 1; j < visible.length; j++) {
          const pi = visible[i], pj = visible[j];
          const xi = cx + Math.cos(pi.angle) * pi.radius * scale;
          const yi = cy + Math.sin(pi.angle) * pi.radius * scale;
          const xj = cx + Math.cos(pj.angle) * pj.radius * scale;
          const yj = cy + Math.sin(pj.angle) * pj.radius * scale;
          const dist = Math.hypot(xi - xj, yi - yj);
          if (dist < 50 * scale) {
            const alpha = (1 - dist / (50 * scale)) * 0.2;
            ctx.beginPath();
            ctx.moveTo(xi, yi);
            ctx.lineTo(xj, yj);
            ctx.strokeStyle = `hsla(260, 70%, 65%, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 中心文字
      blinkTimer += 0.03;
      const textAlpha = 0.5 + Math.sin(blinkTimer) * 0.25;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
      ctx.shadowBlur = 30;
      ctx.font = `bold ${42 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = `hsla(265, 80%, 72%, ${textAlpha})`;
      ctx.fillText("K", cx, cy - 2 * scale);
      ctx.shadowBlur = 0;
      ctx.font = `${11 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = `hsla(265, 30%, 60%, ${textAlpha * 0.6})`;
      ctx.fillText("loading", cx, cy + 28 * scale);
      ctx.restore();

      // 底部进度条
      const barW = 120 * scale;
      const barH = 2;
      const barX = cx - barW / 2;
      const barY = cy + 52 * scale;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, barH / 2);
      ctx.fill();
      const fillW = (progress / 100) * barW;
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, "rgba(168, 85, 247, 0.7)");
      barGrad.addColorStop(0.5, "rgba(124, 58, 237, 0.9)");
      barGrad.addColorStop(1, "rgba(99, 102, 241, 0.7)");
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, barH / 2);
      ctx.fill();

      ctx.resetTransform();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      clearInterval(progressInterval);
    };
  }, []);

  const isDark =
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: isDark
          ? "linear-gradient(180deg, #0a0a0f 0%, #0d0a1a 100%)"
          : "linear-gradient(180deg, #f9fbff 0%, #edf2fc 100%)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
};

export default LoadingScreen;
