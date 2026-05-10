import { useEffect, useState, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  emoji: string;
  size: number;
}

const EMOJIS = ["✨", "⭐", "💫", "🌟", "✦", "◈", "◇"];

const EasterEgg = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  // Click burst
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Only trigger on non-interactive elements
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "A") return;

      const newParticles: Particle[] = Array.from({ length: 6 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        return {
          id: idRef.current++,
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 60,
          maxLife: 60,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          size: Math.random() * 12 + 8,
        };
      });

      setParticles((prev) => [...prev, ...newParticles]);
      console.log("Easter egg click burst at", e.clientX, e.clientY);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      frameRef.current++;
      setParticles((prev) => {
        if (prev.length === 0) {
          rafRef.current = requestAnimationFrame(animate);
          return prev;
        }
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0);
        rafRef.current = requestAnimationFrame(animate);
        return updated;
      });
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Konami / secret code for confetti burst
  const [keyBuffer, setKeyBuffer] = useState<string[]>([]);
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight"];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeyBuffer((prev) => {
        const next = [...prev, e.key].slice(-6);
        if (JSON.stringify(next) === JSON.stringify(KONAMI)) {
          // Big confetti burst!
          const confetti: Particle[] = Array.from({ length: 30 }, () => ({
            id: idRef.current++,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12 - 4,
            life: 90,
            maxLife: 90,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            size: Math.random() * 20 + 12,
          }));
          setParticles((prev) => [...prev, ...confetti]);
          console.log("Konami code activated! 🎉");
        }
        return next;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute select-none"
          style={{
            left: p.x,
            top: p.y,
            fontSize: `${p.size}px`,
            opacity: p.life / p.maxLife,
            transform: `translate(-50%, -50%) rotate(${(1 - p.life / p.maxLife) * 360}deg)`,
            transition: "none",
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};

export default EasterEgg;
