import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Cursor from "../components/Cursor";
import Nav from "../components/Nav";
import ClawMachineHero from "../components/ClawMachineHero";
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
import ModelLandingZone from "../components/ModelLandingZone";
import SoundEffect from "../components/SoundEffect";
import ScrollProgress from "../components/ScrollProgress";
import EasterEgg from "../components/EasterEgg";
import WelcomeGate from "../components/WelcomeGate";
import LoadingScreen from "../components/LoadingScreen";

/** Dev-only: set true to always show WelcomeGate; disables localStorage same-day skip inside WelcomeGate. */
const FORCE_SHOW_WELCOME_GATE = false;

const Index = () => {
  const [appLoading, setAppLoading] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [useCustomPointerFx, setUseCustomPointerFx] = useState(false);
  const location = useLocation();

  // 组件挂载后关闭加载动画
  useEffect(() => {
    const t = window.setTimeout(() => setAppLoading(false), 400);
    return () => window.clearTimeout(t);
  }, []);

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

  // 检查是否从作品页"返回主页"跳转回来（仅通过 sessionStorage 标记，不依赖 location.state）
  const scrollToWorksRef = useRef(false);
  const scrollCheckRef = useRef(true);
  if (scrollCheckRef.current) {
    scrollCheckRef.current = false;
    try {
      if (sessionStorage.getItem("return-to-works")) {
        sessionStorage.removeItem("return-to-works");
        scrollToWorksRef.current = true;
      }
    } catch {}
  }

  useEffect(() => {
    if (!scrollToWorksRef.current) return;
    scrollToWorksRef.current = false;

    window.setTimeout(() => {
      const section = document.getElementById("works");
      if (!section) return;
      const NAVBAR_H = 72;
      const top = section.getBoundingClientRect().top + window.scrollY - NAVBAR_H;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 300);

    window.setTimeout(() => {
      try {
        sessionStorage.removeItem("from-work-carousel-page");
        sessionStorage.removeItem("from-work-category");
      } catch {
        // ignore
      }
    }, 1000);
  }, []);

  // 始终监听滚动，保存精确 scrollY
  useEffect(() => {
    if (location.pathname !== "/") return;
    history.scrollRestoration = "manual";

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        try {
          sessionStorage.setItem("index-scrollY", String(window.scrollY));
        } catch {
          // ignore
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname]);

  // reload 后恢复滚动位置
  useEffect(() => {
    if (location.pathname !== "/" || !welcomeDone) return;
    try {
      const nav =
        performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type !== "reload") return;
      const saved = sessionStorage.getItem("index-scrollY");
      if (!saved) return;
      const targetY = parseInt(saved, 10);
      if (!targetY) return;
      let attempts = 0;
      const tryRestore = (): void => {
        attempts++;
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );
        if (scrollHeight > targetY || attempts > 300) {
          window.scrollTo(0, targetY);
        } else {
          requestAnimationFrame(tryRestore);
        }
      };
      requestAnimationFrame(tryRestore);
    } catch {
      // ignore
    }
  }, [location.pathname, welcomeDone]);

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
      {/* 初始加载动画 */}
      {appLoading && <LoadingScreen />}

      {/* WelcomeGate - 一天只显示一次 */}
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

      {/* 主页面 — 包含抓娃娃机 Hero + 各模块 */}
      {welcomeDone && (
        <div className={`noise ${useCustomPointerFx ? "cursor-none" : ""}`}>
          {useCustomPointerFx ? <Cursor /> : null}
          <MouseTrail enabled={useCustomPointerFx} />
          <SoundEffect enabled={true} />
          <ScrollProgress />
          <EasterEgg />

          <MusicPlayer
            playing={musicPlaying}
            onToggle={handleMusicToggle}
          />

          <Nav />
          <main>
            {/* 抓娃娃机作为首页 Hero */}
            <section className="w-full h-screen relative">
              <ClawMachineHero />
            </section>
            <div className="relative">
              <Hero />
              <ModelLandingZone />
            </div>
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
