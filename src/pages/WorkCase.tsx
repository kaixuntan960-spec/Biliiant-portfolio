import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Languages, X } from "lucide-react";
import { useI18n, useSiteContent } from "../i18n";
import { useThemeMode } from "../theme";
import { bijieAiTranslations } from "../content/bijieAiTranslations";
import { bEndTranslations } from "../content/bEndTranslations";
import MusicPlayer from "../components/MusicPlayer";

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
  const isVideoCase = Boolean(file && /\.mp4($|\?)/i.test(file));
  const [maxImg, setMaxImg] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState(1020);
  const [manifest, setManifest] = useState<null | { title: string; pages: Array<{ index: number; src: string; label: string }> }>(null);
  const [activeIdx, setActiveIdx] = useState(1);
  const [showNextCta, setShowNextCta] = useState(false);
  const [navHoverIdx, setNavHoverIdx] = useState<number | null>(null);
  const [posterActiveIdx, setPosterActiveIdx] = useState(0);
  const posterWheelLockRef = useRef(false);

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

  const posterWheelItems = useMemo(
    () =>
      [
        {
          id: "poster-a",
          bg: "linear-gradient(145deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
          accent: "linear-gradient(120deg, rgba(148,163,184,0.65), rgba(226,232,240,0.28))",
        },
        {
          id: "poster-b",
          bg: "linear-gradient(145deg, #312e81 0%, #4c1d95 45%, #701a75 100%)",
          accent: "linear-gradient(120deg, rgba(216,180,254,0.7), rgba(253,224,71,0.24))",
        },
        {
          id: "poster-c",
          bg: "linear-gradient(145deg, #0c4a6e 0%, #0369a1 40%, #0f766e 100%)",
          accent: "linear-gradient(120deg, rgba(165,243,252,0.7), rgba(125,211,252,0.26))",
        },
        {
          id: "poster-d",
          bg: "linear-gradient(145deg, #7f1d1d 0%, #be123c 50%, #9d174d 100%)",
          accent: "linear-gradient(120deg, rgba(253,186,116,0.65), rgba(254,205,211,0.28))",
        },
      ],
    [],
  );

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

  useEffect(() => {
    setPosterActiveIdx(0);
  }, [slug, lang]);

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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: resolvedTheme === "light" ? "rgb(6, 8, 14)" : "rgb(0,0,0)",
        backgroundImage:
          resolvedTheme === "light"
            ? "radial-gradient(circle at 20% 10%, rgba(79,172,254,0.20), transparent 55%), radial-gradient(circle at 85% 18%, rgba(168,85,247,0.18), transparent 58%)"
            : "radial-gradient(circle at 22% 12%, rgba(79,172,254,0.16), transparent 55%), radial-gradient(circle at 86% 18%, rgba(168,85,247,0.14), transparent 58%)",
      }}
    >
      <MusicPlayer playing={musicPlaying} onToggle={handleMusicToggle} />
      <button
        type="button"
        onClick={() => {
          const st = location.state as WorksReturnState | null;
          navigate("/", {
            state: {
              scrollTo: "works",
              worksCarouselPage: typeof st?.worksCarouselPage === "number" ? st.worksCarouselPage : undefined,
              worksCategory: typeof st?.worksCategory === "string" ? st.worksCategory : undefined,
            },
          });
        }}
        className="fixed z-[9000] flex items-center border transition-all duration-300 hover:scale-[1.02]"
        style={{
          left: "16px",
          top: "16px",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "var(--radius-full)",
          background: "rgba(0,0,0,0.45)",
          color: "rgba(255,255,255,0.92)",
          borderColor: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
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

      {nextWork?.slug && showNextCta && !isVideoCase ? (
        <button
          type="button"
          onClick={() => {
            navigate(`/works/${nextWork.slug}`);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.03]"
          style={{
            right: "16px",
            bottom: "16px",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "999px",
            background: resolvedTheme === "light" ? "rgba(0,0,0,0.46)" : "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px) saturate(1.15)",
            boxShadow: "0 16px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
          }}
          title={lang === "en" ? `Next: ${nextWork.title}` : `下一个作品：${nextWork.title}`}
          aria-label={lang === "en" ? `Next work: ${nextWork.title}` : `下一个作品：${nextWork.title}`}
        >
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
        </button>
      ) : null}

      {isPosterCollection || file ? (
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
          <div style={{ marginBottom: "18px" }}>
            <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              {work?.category ?? (lang === "en" ? "Work" : "作品")}
            </div>
            <div style={{ color: "rgba(255,255,255,0.96)", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em", marginTop: "8px" }}>
              {work?.title ?? (lang === "en" ? "Case" : "作品集")}
            </div>
            {work?.subtitle ? (
              <div style={{ color: "rgba(255,255,255,0.68)", fontSize: "14px", marginTop: "10px", lineHeight: 1.6, maxWidth: "780px" }}>
                {work.subtitle}
              </div>
            ) : null}
          </div>

          {isPosterCollection ? (
            <div
              onWheel={(e) => {
                e.preventDefault();
                if (posterWheelLockRef.current) return;
                posterWheelLockRef.current = true;
                window.setTimeout(() => {
                  posterWheelLockRef.current = false;
                }, 180);
                setPosterActiveIdx((prev) => {
                  const delta = e.deltaY > 0 ? 1 : -1;
                  return (prev + delta + posterWheelItems.length) % posterWheelItems.length;
                });
              }}
              style={{
                position: "relative",
                minHeight: "460px",
                display: "grid",
                gridTemplateColumns: "170px minmax(0,1fr)",
                gap: "22px",
                alignItems: "center",
                overflow: "visible",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: "18px", alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "132px",
                      height: "104px",
                      borderRadius: "24px",
                      position: "relative",
                      overflow: "hidden",
                      background: "linear-gradient(185deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 28%, rgba(7,9,18,0.72) 100%)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      transform: `rotate(${(posterActiveIdx - 1.5) * 3}deg)`,
                      transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                      boxShadow: "0 20px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.26)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "-10px",
                        width: "60px",
                        height: "20px",
                        borderRadius: "12px 12px 0 0",
                        background: "rgba(255,255,255,0.34)",
                        border: "1px solid rgba(255,255,255,0.26)",
                        borderBottom: "none",
                      }}
                    />
                    {[0, 1, 2].map((layer) => (
                      <div
                        key={`folder-file-${layer}`}
                        style={{
                          position: "absolute",
                          left: `${18 + layer * 12}px`,
                          top: `${20 + (2 - layer) * 6}px`,
                          width: "62px",
                          height: "34px",
                          borderRadius: "8px",
                          transform: `rotate(${layer === 1 ? -7 : layer === 2 ? 8 : -2}deg)`,
                          background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(221,226,235,0.68))",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      />
                    ))}
                  </div>
                  {posterWheelItems.map((_, idx) => (
                    <button
                      key={`folder-wheel-${idx}`}
                      type="button"
                      onClick={() => setPosterActiveIdx(idx)}
                      style={{
                        width: "18px",
                        height: "58px",
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.18)",
                        cursor: "pointer",
                        background:
                          posterActiveIdx === idx
                            ? "linear-gradient(180deg, rgba(129,140,248,0.98), rgba(99,102,241,0.98))"
                            : "rgba(255,255,255,0.2)",
                        transform: `translateX(${posterActiveIdx === idx ? "8px" : "0px"}) scaleY(${posterActiveIdx === idx ? 1.02 : 0.9})`,
                        boxShadow: posterActiveIdx === idx ? "0 8px 20px rgba(99,102,241,0.45)" : "none",
                        transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      aria-label={`${lang === "en" ? "Go to item" : "切换到项目"} ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  height: "460px",
                  overflow: "visible",
                  perspective: "1300px",
                  perspectiveOrigin: "50% 45%",
                }}
              >
                {posterWheelItems.map((item, idx) => {
                  let offset = idx - posterActiveIdx;
                  if (offset > posterWheelItems.length / 2) offset -= posterWheelItems.length;
                  if (offset < -posterWheelItems.length / 2) offset += posterWheelItems.length;
                  const abs = Math.abs(offset);
                  return (
                    <div
                      key={item.id}
                      style={{
                        position: "absolute",
                        left: "14px",
                        right: "22px",
                        top: "26px",
                        bottom: "28px",
                        borderRadius: "26px",
                        padding: "18px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 50%, rgba(10,12,22,0.2) 100%)",
                        transform: `translate3d(${offset * 6}px, ${offset * 102}px, ${-abs * 120}px) rotateX(${offset * -8}deg) rotate(${offset * -1.2}deg) scale(${1 - abs * 0.09})`,
                        opacity: abs > 2 ? 0 : 1 - abs * 0.26,
                        filter: `blur(${abs * 0.7}px) saturate(${1 - abs * 0.12})`,
                        transition:
                          "transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease, filter 320ms ease, box-shadow 320ms ease",
                        pointerEvents: offset === 0 ? "auto" : "none",
                        zIndex: posterWheelItems.length - abs,
                        boxShadow: abs === 0 ? "0 36px 84px rgba(0,0,0,0.44)" : "0 18px 38px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "20px",
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.18)",
                          background: "linear-gradient(90deg, #0b0b0d 0%, #0b0b0d 42%, #f3f4f6 42%, #ffffff 100%)",
                          position: "relative",
                        }}
                      >
                        {/* Left "folder cover" circle */}
                        <div
                          aria-hidden
                          style={{
                            position: "absolute",
                            left: "-58%",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "120%",
                            aspectRatio: "1 / 1",
                            borderRadius: "999px",
                            background: "radial-gradient(circle at 35% 40%, rgba(255,255,255,0.10), rgba(255,255,255,0) 55%), #0b0b0d",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                          }}
                        />

                        {/* Left title (folder-style area) */}
                        <div
                          style={{
                            position: "absolute",
                            left: "0",
                            top: "0",
                            bottom: "0",
                            width: "42%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px 22px",
                            color: "rgba(255,255,255,0.92)",
                            zIndex: 2,
                          }}
                        >
                          <div style={{ textAlign: "left", width: "100%", maxWidth: "220px" }}>
                            <div style={{ height: "1px", width: "68px", background: "rgba(255,255,255,0.22)", marginBottom: "18px" }} />
                            <div style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                              Nuestro
                              <br />
                              equipo
                            </div>
                            <div style={{ height: "1px", width: "68px", background: "rgba(255,255,255,0.22)", marginTop: "18px" }} />
                          </div>
                        </div>

                        {/* Right collage area */}
                        <div
                          style={{
                            position: "absolute",
                            left: "42%",
                            right: "0",
                            top: "0",
                            bottom: "0",
                            background: "linear-gradient(180deg, #fbfbfc, #f1f3f6)",
                            zIndex: 1,
                          }}
                        >
                          {/* Diagonal separators */}
                          {[
                            { top: "22%", rot: -18 },
                            { top: "53%", rot: -18 },
                            { top: "84%", rot: -18 },
                          ].map((sep) => (
                            <div
                              key={`sep-${sep.top}`}
                              aria-hidden
                              style={{
                                position: "absolute",
                                left: "-20%",
                                right: "-20%",
                                top: sep.top,
                                height: "18px",
                                background: "#0b0b0d",
                                transform: `rotate(${sep.rot}deg)`,
                                transformOrigin: "center",
                                boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
                                opacity: 0.95,
                              }}
                            />
                          ))}

                          {/* Photo frames (use the provided sample image as placeholder) */}
                          {[
                            {
                              key: "p1",
                              top: "6%",
                              left: "6%",
                              w: "52%",
                              h: "34%",
                              rot: -12,
                              pos: "18% 10%",
                            },
                            {
                              key: "p2",
                              top: "31%",
                              left: "36%",
                              w: "58%",
                              h: "34%",
                              rot: 10,
                              pos: "70% 45%",
                            },
                            {
                              key: "p3",
                              top: "61%",
                              left: "18%",
                              w: "64%",
                              h: "36%",
                              rot: -6,
                              pos: "55% 86%",
                            },
                          ].map((p) => (
                            <div
                              key={p.key}
                              style={{
                                position: "absolute",
                                top: p.top,
                                left: p.left,
                                width: p.w,
                                height: p.h,
                                transform: `rotate(${p.rot}deg)`,
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.94)",
                                boxShadow: "0 18px 44px rgba(0,0,0,0.30)",
                                padding: "10px",
                                zIndex: 2,
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  background: "#fff",
                                }}
                              >
                                <img
                                  src="/img/team-collage.png"
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition: p.pos,
                                    filter: "grayscale(1) contrast(1.1)",
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Subtle glass overlay */}
                        <div
                          aria-hidden
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.08) 100%)",
                            pointerEvents: "none",
                            zIndex: 3,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

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
                      "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0.04) 100%)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
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
                          border: active ? "1px solid rgba(79,172,254,0.55)" : "1px solid rgba(255,255,255,0.12)",
                          background: active
                            ? "linear-gradient(135deg, rgba(79,172,254,0.32) 0%, rgba(168,85,247,0.26) 100%)"
                            : "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.9)",
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
                              background: "linear-gradient(135deg, rgba(79,172,254,0.22) 0%, rgba(168,85,247,0.18) 100%), rgba(0,0,0,0.55)",
                              border: "1px solid rgba(79,172,254,0.18)",
                              color: "rgba(255,255,255,0.92)",
                              fontSize: "11px",
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
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
                      borderRadius: "22px",
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.55)",
                      boxShadow: "0 26px 70px rgba(0,0,0,0.62)",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                background: "rgba(0,0,0,0.62)",
                boxShadow: "0 26px 70px rgba(0,0,0,0.62)",
                border: "1px solid rgba(255,255,255,0.1)",
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
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", padding: "24px 0" }}>
              {lang === "en" ? "Case rendering is not configured for this slug yet." : "该作品暂未配置渲染方式。"}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground" style={{ fontSize: "var(--text-sm)" }}>
          {lang === "en" ? "Case not found." : "未找到该作品。"}
        </div>
      )}
    </main>
  );
}

