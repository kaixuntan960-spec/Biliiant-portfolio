import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Cursor from "../components/Cursor";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import About from "../components/About";
import Works from "../components/Works";
import Skills from "../components/Skills";
import Life from "../components/Life";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import MusicPlayer from "../components/MusicPlayer";
import MouseTrail from "../components/MouseTrail";
import SoundEffect from "../components/SoundEffect";
import ScrollProgress from "../components/ScrollProgress";
import EasterEgg from "../components/EasterEgg";
import WelcomeGate from "../components/WelcomeGate";
import { useI18n } from "../i18n";

const Index = () => {
  const { lang } = useI18n();
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showReturnWelcome, setShowReturnWelcome] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 40 });
  const location = useLocation();

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (scrollTo !== "works") return;
    window.setTimeout(() => {
      const el = document.getElementById("works");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        // ignore
      }
    }, 0);
  }, [location.state]);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("welcome_seen_date") === today) {
        setWelcomeDone(true);
        setMusicPlaying(localStorage.getItem("bgm_preferred") === "1");

        // Show "welcome back" only when:
        // 1) it's the 2nd+ visit of today, and
        // 2) this entry is a page reload (not in-app navigation/back from case pages).
        const visitKey = `daily_home_visit_count_${today}`;
        const prevCount = Number(localStorage.getItem(visitKey) ?? "0");
        const nextCount = Number.isFinite(prevCount) ? prevCount + 1 : 1;
        localStorage.setItem(visitKey, String(nextCount));

        const cameFromWorksRoute = (location.state as { scrollTo?: string } | null)?.scrollTo === "works";
        // Keep behavior consistent across browser/Cursor previews:
        // show on every homepage entry within the day, except when returning from works route.
        setShowReturnWelcome(!cameFromWorksRoute && nextCount >= 1);
      }
    } catch {
      setWelcomeDone(true);
    }
  }, [location.state]);

  const handleMusicToggle = (next: boolean) => {
    setMusicPlaying(next);
    try {
      localStorage.setItem("bgm_preferred", next ? "1" : "0");
    } catch {
      // ignore
    }
    console.log("Music toggled");
  };

  return (
    <div className="noise" style={{ cursor: "none" }}>
      <Cursor />
      <MouseTrail enabled={true} />
      <SoundEffect enabled={true} />
      <ScrollProgress />
      <EasterEgg />

      {!welcomeDone && (
        <WelcomeGate
          onComplete={(opts) => {
            setWelcomeDone(true);
            setMusicPlaying(Boolean(opts?.playMusic));
          }}
        />
      )}

      {/* Music Player Control */}
      {welcomeDone && (
        <MusicPlayer
          playing={musicPlaying}
          onToggle={handleMusicToggle}
        />
      )}

      {welcomeDone && showReturnWelcome && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 pointer-events-none">
          <div
            className="relative overflow-hidden border pointer-events-auto animate-scale-in"
            onMouseMove={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setGlowPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
            }}
            style={{
              width: "min(520px, 92vw)",
              borderRadius: "var(--radius-2xl)",
              borderColor: "rgba(168,85,247,0.28)",
              background: "var(--card)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(320px 200px at ${glowPos.x}% ${glowPos.y}%, rgba(168,85,247,0.22), rgba(99,102,241,0.1) 42%, rgba(0,0,0,0) 72%)`,
                transition: "background 160ms ease",
              }}
            />
            <div className="relative" style={{ padding: "22px 22px 18px" }}>
              <h3 className="font-black text-foreground" style={{ fontSize: "var(--text-lg)", marginBottom: "6px" }}>
                {lang === "en" ? "Welcome back to my space" : "欢迎回到我的空间"}
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "var(--text-sm)", marginBottom: "14px" }}>
                {lang === "en"
                  ? "Great to see you again. Move your mouse on this card and feel the interactive glow."
                  : "很高兴再次见到你。鼠标在卡片上移动，感受一点点互动光效。"}
              </p>
              <div
                className="relative overflow-hidden border"
                style={{
                  marginBottom: "12px",
                  borderRadius: "14px",
                  borderColor: "rgba(168,85,247,0.28)",
                  minHeight: "64px",
                  background: "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(99,102,241,0.10) 50%, rgba(14,165,233,0.10) 100%)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(180px 120px at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.25), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0) 72%)`,
                  }}
                />
                <div className="relative" style={{ padding: "12px 14px" }}>
                  <div className="text-foreground font-semibold" style={{ fontSize: "var(--text-xs)", marginBottom: "4px" }}>
                    {lang === "en" ? "Today’s vibe is ready" : "今日氛围已就绪"}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: "11px", lineHeight: 1.5 }}>
                    {lang === "en"
                      ? "Smooth interactions, cleaner visuals, and a focused portfolio experience."
                      : "流畅交互、干净视觉和更聚焦的作品浏览体验已开启。"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end" style={{ gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowReturnWelcome(false)}
                  className="border transition-all hover:scale-[1.02]"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-full)",
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  {lang === "en" ? "Close" : "关闭"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnWelcome(false);
                    document.getElementById("works")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="transition-all hover:scale-[1.02]"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  {lang === "en" ? "Explore works" : "查看作品"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Works />
        <Skills />
        <Life />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
