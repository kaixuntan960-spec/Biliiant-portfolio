import { useCallback, useEffect, useRef, useState, Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Languages, Moon, Sun } from "lucide-react";
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
import HeroAvatarViewer from "../components/HeroAvatarViewer";
import SoundEffect from "../components/SoundEffect";
import ScrollProgress from "../components/ScrollProgress";
import EasterEgg from "../components/EasterEgg";
import WelcomeGate from "../components/WelcomeGate";
import LoadingScreen from "../components/LoadingScreen";
import { useI18n } from "../i18n";
import { useThemeMode } from "../theme";

/** 捕获 HeroAvatarViewer 内部错误，防止整个页面崩溃 */
class HeroAvatarViewerErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Dev-only: set true to always show WelcomeGate; disables localStorage same-day skip inside WelcomeGate. */
const FORCE_SHOW_WELCOME_GATE = false;

function webglContextAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: false } as WebGLContextAttributes)
    );
  } catch {
    return false;
  }
}

const Index = () => {
  const { lang, setLang } = useI18n();
  const { resolvedTheme, mode, setMode } = useThemeMode();
  const [appLoading, setAppLoading] = useState(true);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [useCustomPointerFx, setUseCustomPointerFx] = useState(false);
  const [showModelIntro, setShowModelIntro] = useState(false);
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const location = useLocation();

  // 组件挂载后关闭加载动画
  useEffect(() => {
    const t = window.setTimeout(() => setAppLoading(false), 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!welcomeDone) return;
    try {
      if (sessionStorage.getItem("model_intro_seen_v1") === "1") {
        setShowModelIntro(false);
        return;
      }
    } catch {
      // ignore
    }
    if (!webglContextAvailable()) {
      setShowModelIntro(false);
      return;
    }
    setShowModelIntro(true);
  }, [welcomeDone]);

  const closeModelIntro = (targetId?: string) => {
    setShowModelIntro(false);
    try {
      sessionStorage.setItem("model_intro_seen_v1", "1");
    } catch {
      // ignore
    }
    if (!targetId) return;
    const NAVBAR_H = 72;
    window.setTimeout(() => {
      if (targetId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(targetId);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 120);
  };

  const openModelIntro = () => {
    setShowModelIntro(true);
  };

  // 当模型介绍覆盖层显示时，按 Enter 键关闭
  const closeModelIntroRef = useRef(closeModelIntro);
  closeModelIntroRef.current = closeModelIntro;
  useEffect(() => {
    if (!showModelIntro) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeModelIntroRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showModelIntro]);

  const modelIntroBg =
    resolvedTheme === "light"
      ? "radial-gradient(860px 480px at 12% 16%, rgba(121,174,255,0.24), rgba(121,174,255,0) 58%), radial-gradient(760px 420px at 84% 18%, rgba(193,147,255,0.2), rgba(193,147,255,0) 58%), linear-gradient(180deg, #f8fbff 0%, #edf3ff 56%, #e8eefb 100%)"
      : "radial-gradient(820px 460px at 16% 12%, rgba(130,170,255,0.26), rgba(130,170,255,0) 58%), radial-gradient(740px 420px at 84% 22%, rgba(216,163,255,0.24), rgba(216,163,255,0) 60%), linear-gradient(180deg, #0d121d 0%, #151d2d 54%, #111827 100%)";

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setUseCustomPointerFx(false);
      return;
    }
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setUseCustomPointerFx(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => {
      mq.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (scrollTo !== "works") return;
    try {
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (navEntry?.type === "reload") {
        return;
      }
    } catch {
      // ignore and keep default behavior
    }
    window.setTimeout(() => {
      const el = document.getElementById("works");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        // Preserve React Router history.state (e.g. works carousel restore) while normalizing the URL.
        window.history.replaceState(window.history.state, "", window.location.pathname);
      } catch {
        // ignore
      }
    }, 0);
  }, [location.state]);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("#about, #works, #skills, #life, #contact"),
    );
    if (!targets.length) return;

    targets.forEach((el) => el.classList.add("kz-reveal"));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (FORCE_SHOW_WELCOME_GATE) {
      // 强制显示模式：每次都显示 WelcomeGate
      setWelcomeDone(false);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const seenDate = localStorage.getItem("welcome_seen_date");
      if (seenDate === today) {
        setWelcomeDone(true);
        setMusicPlaying(localStorage.getItem("bgm_preferred") === "1");
      }
    } catch {
      setWelcomeDone(true);
    }
  }, []);

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
    <>
      {/* 初始加载动画 — 仅显示跳动小人，没有弹窗 */}
      {appLoading && <LoadingScreen />}

      {/* WelcomeGate - 全屏独立页面，一天只显示一次 */}
      {!appLoading && !welcomeDone && (
        <WelcomeGate
          allowStorageAutoComplete={!FORCE_SHOW_WELCOME_GATE}
          onComplete={(opts) => {
            setWelcomeDone(true);
            setMusicPlaying(Boolean(opts?.playMusic));
            try {
              const today = new Date().toISOString().slice(0, 10);
              localStorage.setItem("welcome_seen_date", today);
              localStorage.setItem("bgm_preferred", opts?.playMusic ? "1" : "0");
            } catch {
              // ignore
            }
          }}
        />
      )}

      {/* 3D 小屋模型 - 全屏显示，点击物体跳转到网站 */}
      {welcomeDone && showModelIntro && (
        <div
          className="fixed inset-0 z-[10000]"
          style={{
            background: modelIntroBg,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
              zIndex: 1,
            }}
          />
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            <HeroAvatarViewerErrorBoundary>
            <HeroAvatarViewer
              onNavigate={(targetId) => closeModelIntro(targetId)}
              lang={lang}
              theme={resolvedTheme}
              calibrationEnabled={calibrationEnabled}
            />
            </HeroAvatarViewerErrorBoundary>
          </div>
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              zIndex: 10002,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setMode(mode === "light" ? "dark" : "light")}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.24)",
                background: resolvedTheme === "light" ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.12)",
                color: resolvedTheme === "light" ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={mode === "light" ? "切换到黑夜模式" : "切换到白天模式"}
              aria-label={mode === "light" ? "切换到黑夜模式" : "切换到白天模式"}
            >
              {mode === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              style={{
                height: "36px",
                padding: "0 10px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.24)",
                background: resolvedTheme === "light" ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.12)",
                color: resolvedTheme === "light" ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title={lang === "zh" ? "Switch to English" : "切换到中文"}
              aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
            >
              <Languages size={13} />
              {lang === "zh" ? "EN" : "中文"}
            </button>
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "26px",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: resolvedTheme === "light" ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.1)",
                color: resolvedTheme === "light" ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.92)",
                fontSize: "11px",
                backdropFilter: "blur(10px)",
              }}
            >
              {lang === "en" ? "Explore the 3D model, click objects to navigate" : "先探索 3D 模型，点击物件跳转对应模块"}
            </div>
            <button
              type="button"
              onClick={() => closeModelIntro()}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.26)",
                background: resolvedTheme === "light" ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.14)",
                color: resolvedTheme === "light" ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.95)",
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Enter
            </button>
          </div>
        </div>
      )}

      {/* 网站主页面 - 只在关闭小屋模型后显示 */}
      {welcomeDone && !showModelIntro && (
        <div className={`noise ${useCustomPointerFx ? "cursor-none" : ""}`}>
          {useCustomPointerFx ? <Cursor /> : null}
          <MouseTrail enabled={useCustomPointerFx} />
          <SoundEffect enabled={true} />
          <ScrollProgress />
          <EasterEgg />

          {/* Music Player Control */}
          <MusicPlayer
            playing={musicPlaying}
            onToggle={handleMusicToggle}
          />

          <Nav onOpenModelIntro={openModelIntro} />
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
      )}
    </>
  );
};

export default Index;
