import { useEffect, useState } from "react";

const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(pct);
      setVisible(scrollTop > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div
        className="fixed top-0 left-0 z-[9999] h-0.5 transition-all duration-100"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--primary), var(--accent))",
        }}
      />

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed left-6 bottom-6 z-[6999] w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--muted-foreground)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          pointerEvents: visible ? "auto" : "none",
        }}
        title="回到顶部"
      >
        ↑
      </button>
    </>
  );
};

export default ScrollProgress;
