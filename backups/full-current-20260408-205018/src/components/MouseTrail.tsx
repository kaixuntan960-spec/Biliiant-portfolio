import { useEffect, useRef } from "react";

interface TrailParticle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
}

const COLORS = [
  "rgba(168,85,247,",
  "rgba(232,255,71,",
  "rgba(196,132,252,",
  "rgba(0,212,170,",
];

const MouseTrail = ({ enabled = true }: { enabled?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TrailParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const count = 2;
      for (let i = 0; i < count; i++) {
        const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          alpha: 0.7,
          size: Math.random() * 3 + 1,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          color: colorBase,
        });
      }
      // Keep max 120 particles
      if (particlesRef.current.length > 120) {
        particlesRef.current = particlesRef.current.slice(-120);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01);
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.88;
        p.size *= 0.96;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9997 }}
    />
  );
};

export default MouseTrail;
