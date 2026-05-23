import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Languages, X } from "lucide-react";
import { useScrollRestore } from "../hooks/useScrollRestore";
import { useI18n, useSiteContent } from "../i18n";
import { useThemeMode } from "../theme";
import { bijieAiTranslations } from "../content/bijieAiTranslations";
import { bEndTranslations } from "../content/bEndTranslations";
import MusicPlayer from "../components/MusicPlayer";
import PosterBoard from "../components/poster-board/Board";

type WorksReturnState = {
  scrollTo?: string;
  worksCarouselPage?: number;
  worksCategory?: string;
};

export default function WorkCase() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const { resolvedTheme } = useThemeMode();

  const work = useMemo(() => siteContent.works.items.find((w) => w.slug === slug), [siteContent.works.items, slug]);
  const file = work?.caseHref ?? null;
  const isSocksDetective = slug === "socks-detective";
  const isPosterCollection = slug === "poster-collection";
  const hasLightBg = !isPosterCollection && slug !== "socks-detective" && resolvedTheme === "light";
  const isVideoCase = Boolean(file && /\.mp4($|\?)/i.test(file));
  const [maxImg, setMaxImg] = useState<number | null>(null);
  useScrollRestore();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState(1020);
  const [manifest, setManifest] = useState<null | { title: string; pages: Array<{ index: number; src: string; label: string }> }>(null);
  const [activeIdx, setActiveIdx] = useState(1);
  const [showNextCta, setShowNextCta] = useState(false);
  const [navHoverIdx, setNavHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    setMaxImg(null);
  }, [file]);

  const isBijie = slug === "bijie-ai";
  const pageCountGuess = 60;
  const bijieEnLabels: Record<number, string> = {
    1: "Cover",
    2: "Overview",
    3: "Cover / Brief",
    4: "Project Background",
    5: "User Research",
    6: "Business Analysis",
    7: "Design Principles",
    8: "Competitive Analysis",
    9: "Design Approach (1)",
    10: "Design Approach (2)",
    11: "Login Screen",
    12: "Brand Character / IP",
    13: "Design Guidelines",
  };
  const [showTranslateHelper, setShowTranslateHelper] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const shouldResumeMusicAfterVideoRef = useRef(false);
  const translations = useMemo(() => {
    if (slug === "bijie-ai") return bijieAiTranslations as Record<number, { titleEn: string; bodyEn: string }>;
    if (slug === "b-end") return bEndTranslations as Record<number, { titleEn: string; bodyEn: string }>;
    return null;
  }, [slug]);

  const worksWithSlug = useMemo(() => siteContent.works.items.filter((w) => Boolean(w.slug)), [siteContent.works.items]);
  const nextWork = useMemo(() => {
    const curIdx = worksWithSlug.findIndex((w) => w.slug === slug);
    if (curIdx < 0) return null;
    return worksWithSlug[(curIdx + 1) % worksWithSlug.length] ?? null;
  }, [worksWithSlug, slug]);
  const prevWork = useMemo(() => {
    const curIdx = worksWithSlug.findIndex((w) => w.slug === slug);
    if (curIdx < 0) return null;
    return worksWithSlug[(curIdx - 1 + worksWithSlug.length) % worksWithSlug.length] ?? null;
  }, [worksWithSlug, slug]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(320, Math.min(1100, Math.floor(el.clientWidth)));
      setPageWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!slug) {
      setManifest(null);
      return;
    }
    let cancelled = false;
    fetch(`/works/${slug}/manifest.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.pages?.length) setManifest(data);
        else setManifest(null);
      })
      .catch(() => {
        setManifest(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Robust active page tracking: compute by scroll position (works better for very tall pages).
  useEffect(() => {
    if (!manifest?.pages?.length) return;
    const ids = manifest.pages.map((p) => `page-${p.index}`);
    const getEls = () => ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    let raf = 0;

    const update = () => {
      const els = getEls();
      if (!els.length) return;
      // Anchor line slightly below top to match reading focus.
      const anchorY = 140;
      let bestIdx = activeIdx;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const el of els) {
        const r = el.getBoundingClientRect();
        const inBand = r.top <= anchorY && r.bottom >= anchorY;
        const score = inBand ? 0 : Math.min(Math.abs(r.top - anchorY), Math.abs(r.bottom - anchorY)) + (r.top > anchorY ? 4 : 0);
        if (score < bestScore) {
          bestScore = score;
          const m = el.id.match(/page-(\d+)/);
          if (m) bestIdx = Number(m[1]);
        }
      }

      if (bestIdx !== activeIdx) setActiveIdx(bestIdx);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest?.pages?.length]);

  // Show "Next work" CTA when approaching the end.
  useEffect(() => {
    if (!manifest?.pages?.length) return;
    const last = manifest.pages[manifest.pages.length - 1];
    const el = document.getElementById(`page-${last.index}`);
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setShowNextCta(Boolean(e.isIntersecting));
      },
      { root: null, threshold: [0.15], rootMargin: "0px 0px -40% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [manifest]);

  useEffect(() => {
    try {
      setMusicPlaying(localStorage.getItem("bgm_preferred") === "1");
    } catch {
      setMusicPlaying(false);
    }
  }, []);

  const handleMusicToggle = (next: boolean) => {
    setMusicPlaying(next);
    try {
      localStorage.setItem("bgm_preferred", next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const handleVideoPlay = () => {
    // Snapshot the user's original music state the first time video starts.
    if (!shouldResumeMusicAfterVideoRef.current) {
      shouldResumeMusicAfterVideoRef.current = musicPlaying;
    }
    if (musicPlaying) {
      handleMusicToggle(false);
    }
  };

  const handleVideoStop = () => {
    if (shouldResumeMusicAfterVideoRef.current) {
      handleMusicToggle(true);
      shouldResumeMusicAfterVideoRef.current = false;
    }
  };

  const goToNextWork = () => {
    if (!nextWork) return;
    if (nextWork.slug === "socks-detective") {
      navigate(`/works/socks-detective/read`);
    } else {
      navigate(`/works/${nextWork.slug}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goToPrevWork = () => {
    if (!prevWork) return;
    if (prevWork.slug === "socks-detective") {
      navigate(`/works/socks-detective/read`);
    } else {
      navigate(`/works/${prevWork.slug}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main
      style={
        isPosterCollection
          ? {
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              background: "rgb(246, 247, 252)",
            }
          : hasLightBg
            ? {
                minHeight: "100vh",
                background: "#FDFCFA",
                backgroundImage: `
                  radial-gradient(900px 600px at 18% 8%, rgba(230,200,255,0.10) 0%, transparent 55%),
                  radial-gradient(700px 500px at 82% 85%, rgba(200,230,255,0.08) 0%, transparent 50%),
                  radial-gradient(600px 400px at 50% 45%, rgba(255,240,230,0.06) 0%, transparent 50%)
                `,
              }
            : {
                minHeight: "100vh",
                background: resolvedTheme === "light" ? "rgb(6, 8, 14)" : "rgb(0,0,0)",
                backgroundImage:
                  resolvedTheme === "light"
                    ? "radial-gradient(circle at 20% 10%, rgba(79,172,254,0.20), transparent 55%), radial-gradient(circle at 85% 18%, rgba(168,85,247,0.18), transparent 58%)"
                    : "radial-gradient(circle at 22% 12%, rgba(79,172,254,0.16), transparent 55%), radial-gradient(circle at 86% 18%, rgba(168,85,247,0.14), transparent 58%)",
              }
      }
    >
      <MusicPlayer playing={musicPlaying} onToggle={handleMusicToggle} />
      <button
        type="button"
        onClick={() => {
          try { sessionStorage.setItem("return-to-works", "1"); } catch {}
          navigate("/");
        }}
        className="fixed z-[9000] flex items-center border transition-all duration-300 hover:scale-[1.02]"
        style={{
          left: "16px",
          top: "16px",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "var(--radius-full)",
          background: isPosterCollection ? "rgba(255,255,255,0.7)" : hasLightBg ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.45)",
          color: isPosterCollection ? "rgba(0,0,0,0.8)" : hasLightBg ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.92)",
          borderColor: isPosterCollection ? "rgba(0,0,0,0.08)" : hasLightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          boxShadow: isPosterCollection || hasLightBg ? "0 1px 3px rgba(0,0,0,0.04)" : undefined,
        }}
      >
        <ArrowLeft size={14} />
        {lang === "en" ? "Home" : "返回主页"}
      </button>

      {/* English-mode helper: explain pages without altering the image. */}
      {manifest?.pages?.length && lang === "en" && translations ? (
        showTranslateHelper ? (
          <div
            className="fixed z-[9000] hidden md:block"
            style={{
              right: "16px",
              top: "16px",
              width: "320px",
              borderRadius: "18px",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(12px)",
              padding: "12px 12px 10px",
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            <div className="flex items-center justify-between" style={{ gap: "10px", marginBottom: "8px" }}>
              <div className="flex items-center" style={{ gap: "8px", fontWeight: 800 }}>
                <Languages size={14} />
                <span style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85 }}>
                  Translate helper
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTranslateHelper(false)}
                className="flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.9)",
                }}
                aria-label="Close translate helper"
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "-0.01em", marginBottom: "6px" }}>
              {translations[activeIdx]?.titleEn ?? `Page ${activeIdx}`}
            </div>
            <div
              style={{
                fontSize: "12px",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.78)",
                whiteSpace: "pre-wrap",
                maxHeight: "360px",
                overflowY: "auto",
                paddingRight: "6px",
              }}
            >
              {translations[activeIdx]?.bodyEn ??
                "Add a per-page English translation in src/content/bijieAiTranslations.ts.\n\nThis overlay does not rewrite text inside the image."}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowTranslateHelper(true)}
            className="fixed z-[9000] hidden md:flex items-center justify-center transition-all duration-300 hover:scale-[1.04]"
            style={{
              right: "16px",
              top: "16px",
              width: "44px",
              height: "44px",
              borderRadius: "999px",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
            }}
            title="Show translate helper"
            aria-label="Show translate helper"
          >
            <Languages size={18} />
          </button>
        )
      ) : null}

      {nextWork?.slug && !isPosterCollection ? (
        <button
          type="button"
          onClick={goToNextWork}
          className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            right: "16px",
            bottom: "16px",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "999px",
            background: hasLightBg ? "rgba(255,255,255,0.7)" : resolvedTheme === "light" ? "rgba(0,0,0,0.46)" : "rgba(0,0,0,0.5)",
            border: hasLightBg ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.16)",
            color: hasLightBg ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            boxShadow: hasLightBg ? "0 4px 16px rgba(0,0,0,0.06)" : "0 16px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
          }}
          title={lang === "en" ? `Next: ${nextWork.title}` : `下一个作品：${nextWork.title}`}
          aria-label={lang === "en" ? `Next work: ${nextWork.title}` : `下一个作品：${nextWork.title}`}
        >
          {hasLightBg ? (
            <>
              <span style={{ fontSize: "13px", fontWeight: 700 }}>
                {lang === "en" ? "Next Project" : "下一个项目"}
              </span>
              <ArrowRight size={14} />
            </>
          ) : (
            <>
              <span
                aria-hidden
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(79,172,254,0.34) 0%, rgba(168,85,247,0.26) 100%)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.38)",
                }}
              >
                <ArrowRight size={14} />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.82 }}>
                  {lang === "en" ? "Next work" : "下一个作品"}
                </span>
                <span style={{ opacity: 0.76, fontSize: "12px", maxWidth: "210px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {nextWork.title}
                </span>
              </span>
            </>
          )}
        </button>
      ) : null}
      {prevWork?.slug && !isPosterCollection ? (
        <button
          type="button"
          onClick={goToPrevWork}
          className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            left: "96px",
            bottom: "16px",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "999px",
            background: hasLightBg ? "rgba(255,255,255,0.7)" : resolvedTheme === "light" ? "rgba(0,0,0,0.46)" : "rgba(0,0,0,0.5)",
            border: hasLightBg ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.16)",
            color: hasLightBg ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            boxShadow: hasLightBg ? "0 4px 16px rgba(0,0,0,0.06)" : "0 16px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
          }}
          title={lang === "en" ? `Previous: ${prevWork.title}` : `上一个作品：${prevWork.title}`}
          aria-label={lang === "en" ? `Previous work: ${prevWork.title}` : `上一个作品：${prevWork.title}`}
        >
          {hasLightBg ? (
            <>
              <ArrowLeft size={14} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>
                {lang === "en" ? "Prev Project" : "上一个项目"}
              </span>
            </>
          ) : (
            <>
              <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, alignItems: "flex-start" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.82 }}>
                  {lang === "en" ? "Prev work" : "上一个作品"}
                </span>
                <span style={{ opacity: 0.76, fontSize: "12px", maxWidth: "210px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prevWork.title}
                </span>
              </span>
              <span
                aria-hidden
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(79,172,254,0.34) 0%, rgba(168,85,247,0.26) 100%)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.38)",
                }}
              >
                <ArrowLeft size={14} />
              </span>
            </>
          )}
        </button>
      ) : null}

      {isPosterCollection || file ? (

        isPosterCollection ? (

          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
              }}
            >
              <PosterBoard />
            </div>
            {nextWork?.slug ? (
              <button
                type="button"
                onClick={goToNextWork}
                className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  right: "16px",
                  bottom: "16px",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  {lang === "en" ? "Next Project" : "下一个项目"}
                </span>
                <ArrowRight size={14} />
              </button>
            ) : null}
            {prevWork?.slug ? (
              <button
                type="button"
                onClick={goToPrevWork}
                className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  left: "96px",
                  bottom: "16px",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "rgba(0,0,0,0.8)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <ArrowLeft size={14} />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  {lang === "en" ? "Prev Project" : "上一个项目"}
                </span>
              </button>
            ) : null}
          </>

        ) : (
        <div
          ref={wrapRef}
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            paddingTop: "84px",
            paddingBottom: "48px",
            paddingLeft: manifest?.pages?.length && !isSocksDetective ? "64px" : "16px",
            paddingRight: "16px",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}>
              <span style={{
                width: "20px",
                height: "2px",
                borderRadius: "1px",
                background: hasLightBg ? "linear-gradient(90deg, #7C5CFC, rgba(124,92,252,0.2))" : "rgba(255,255,255,0.4)",
              }} />
              <span style={{
                color: hasLightBg ? "rgba(124,92,252,0.8)" : "rgba(255,255,255,0.78)",
                fontSize: "11px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}>
                {work?.category ?? (lang === "en" ? "Work" : "作品")}
              </span>
            </div>
            <h1 style={{
              color: hasLightBg ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.96)",
              fontSize: "clamp(28px, 3.2vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 14px",
              fontFamily: hasLightBg ? "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : undefined,
            }}>
              {work?.title ?? (lang === "en" ? "Case" : "作品集")}
              {hasLightBg && (
                <span style={{
                  display: "block",
                  width: "40px",
                  height: "3px",
                  borderRadius: "2px",
                  background: "linear-gradient(90deg, #7C5CFC, transparent)",
                  marginTop: "16px",
                }} />
              )}
            </h1>
            {work?.subtitle ? (
              <p style={{
                color: hasLightBg ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.68)",
                fontSize: "15px",
                marginTop: "0",
                lineHeight: 1.7,
                maxWidth: "680px",
                fontWeight: 400,
              }}>
                {work.subtitle}
              </p>
            ) : null}
          </div>

          {isSocksDetective ? (
            <div
              style={{
                borderRadius: "24px",
                padding: "28px 24px",
                background: "linear-gradient(135deg, rgba(0,212,170,0.14) 0%, rgba(79,172,254,0.12) 55%, rgba(168,85,247,0.12) 100%), rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 26px 70px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <span
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <BookOpen size={22} color="rgba(255,255,255,0.92)" />
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "rgba(255,255,255,0.88)" }}>
                    {lang === "en" ? "Interactive picture book" : "电子绘本 · 互动阅读"}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.62)", marginTop: "4px" }}>
                    {lang === "en"
                      ? "Gesture controls, swipe, keyboard, and detective-note riddles."
                      : "支持摄像头手势（点赞/倒赞）、滑动与键盘翻页，并配有「侦探笔记」式看图解密。"}
                  </div>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "14px", lineHeight: 1.75, marginBottom: "18px", maxWidth: "720px" }}>
                {lang === "en"
                  ? "Open the book mode to read 《The Sock Detective Agency》 as a full-screen PDF. Tips update per page; optional riddles reward close looking—edit clues in public/works/socks-detective/clues.json."
                  : "点击下方按钮进入全屏阅读模式，加载谭凯洵《袜子侦探社》PDF。右侧提示与谜面可在 public/works/socks-detective/clues.json 按你的分镜继续扩充。"}
              </p>
              <button
                type="button"
                onClick={() => navigate("/works/socks-detective/read", { state: location.state })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 22px",
                  borderRadius: "999px",
                  fontWeight: 800,
                  fontSize: "14px",
                  border: "1px solid rgba(0,212,170,0.45)",
                  background: "linear-gradient(135deg, rgba(0,212,170,0.35) 0%, rgba(79,172,254,0.22) 100%)",
                  color: "rgba(255,255,255,0.96)",
                  cursor: "pointer",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
                }}
              >
                <BookOpen size={18} />
                {lang === "en" ? "Enter interactive read" : "进入互动阅读模式"}
              </button>
            </div>
          ) : null}

          {/* Manifest-driven cases: render hi-res image pages with left navigation. */}
          {!isSocksDetective && manifest?.pages?.length ? (
            <>
              <div
                className="fixed z-[8500] hidden md:flex"
                style={{
                  left: "14px",
                  top: "96px",
                  bottom: "24px",
                  width: "56px",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    pointerEvents: "auto",
                    width: "50px",
                    borderRadius: "999px",
                    padding: "12px 8px",
                    background:
                      hasLightBg
                        ? "rgba(255,255,255,0.8)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0.04) 100%)",
                    border: hasLightBg ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxShadow: hasLightBg ? "0 1px 3px rgba(0,0,0,0.04)" : "0 18px 50px rgba(0,0,0,0.55)",
                  }}
                >
                  {manifest.pages.map((p) => {
                    const active = p.index === activeIdx;
                    const label = (lang === "en" ? translations?.[p.index]?.titleEn ?? `Page ${p.index}` : p.label?.trim()) ?? `${p.index}`;
                    return (
                      <button
                        key={p.index}
                        type="button"
                        title={label}
                        onClick={() => {
                          document.getElementById(`page-${p.index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        style={{
                          position: "relative",
                          width: "34px",
                          height: "34px",
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: active ? "1px solid rgba(79,172,254,0.55)" : hasLightBg ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.12)",
                          background: active
                            ? "linear-gradient(135deg, rgba(79,172,254,0.32) 0%, rgba(168,85,247,0.26) 100%)"
                            : hasLightBg ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                          color: hasLightBg ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                          transition: "transform 220ms cubic-bezier(0.22, 1, 0.32, 1), background 220ms ease, border-color 220ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
                          setNavHoverIdx(p.index);
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                          setNavHoverIdx((cur) => (cur === p.index ? null : cur));
                        }}
                      >
                        {p.index}
                        {navHoverIdx === p.index ? (
                          <span
                            className="absolute"
                            style={{
                              left: "58px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              padding: "8px 10px",
                              borderRadius: "999px",
                              background: hasLightBg
                                ? "#FFFFFF"
                                : "linear-gradient(135deg, rgba(79,172,254,0.22) 0%, rgba(168,85,247,0.18) 100%), rgba(0,0,0,0.55)",
                              border: hasLightBg ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(79,172,254,0.18)",
                              color: hasLightBg ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.92)",
                              fontSize: "11px",
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                              boxShadow: hasLightBg ? "0 4px 12px rgba(0,0,0,0.08)" : "0 18px 60px rgba(0,0,0,0.55)",
                            }}
                          >
                            {label}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
                {manifest.pages.map((p) => (
                  <section
                    key={p.src}
                    id={`page-${p.index}`}
                    style={{
                      borderRadius: "20px",
                      overflow: "hidden",
                      background: hasLightBg ? "#FFFFFF" : "rgba(0,0,0,0.55)",
                      boxShadow: hasLightBg ? "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" : "0 26px 70px rgba(0,0,0,0.62)",
                      border: hasLightBg ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <img data-avoid-music-player="true" src={p.src} alt={`${work?.title ?? "case"} ${p.label}`} style={{ width: "100%", display: "block" }} loading={p.index <= 2 ? "eager" : "lazy"} />
                  </section>
                ))}
              </div>
            </>
          ) : null}
          {!isSocksDetective && isVideoCase && file ? (
            <div
              style={{
                borderRadius: "22px",
                overflow: "hidden",
                background: hasLightBg ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.62)",
                boxShadow: hasLightBg ? "0 4px 20px rgba(0,0,0,0.06)" : "0 26px 70px rgba(0,0,0,0.62)",
                border: hasLightBg ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.1)",
                padding: "14px",
              }}
            >
              <video
                src={file}
                controls
                playsInline
                preload="metadata"
                onPlay={handleVideoPlay}
                onPause={handleVideoStop}
                onEnded={handleVideoStop}
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: "14px",
                  background: "#000",
                  maxHeight: "72vh",
                }}
              />
            </div>
          ) : null}
          {!isSocksDetective && !isVideoCase && !manifest?.pages?.length && file ? (
            <div style={{ color: hasLightBg ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)", fontSize: "14px", padding: "24px 0" }}>
              {lang === "en" ? "Case rendering is not configured for this slug yet." : "该作品暂未配置渲染方式。"}
            </div>
          ) : null}
        </div>
        )
      ) : (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground" style={{ fontSize: "var(--text-sm)" }}>
          {lang === "en" ? "Case not found." : "未找到该作品。"}
        </div>
      )}
    </main>
  );
}

