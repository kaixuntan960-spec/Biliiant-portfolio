import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, Info } from "lucide-react";
import { useI18n, useSiteContent } from "../i18n";
import type { WorkItem } from "../content/site";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../theme";

type AmbientHandlers = {
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
};

const ambientHandlers: AmbientHandlers = {
  onPointerMove: (e) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
    el.style.setProperty("--mop", "1");
  },
  onPointerLeave: (e) => {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty("--mop", "0");
  },
};

const ambientButtonWrap: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  isolation: "isolate",
};

const ambientLightLayerStyle: React.CSSProperties = {
  position: "absolute",
  inset: "-1px",
  borderRadius: "999px",
  pointerEvents: "none",
  background:
    "radial-gradient(220px 160px at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.26), rgba(255,255,255,0.10) 38%, rgba(255,255,255,0.00) 72%)",
  opacity: "var(--mop, 0)",
  transition: "opacity 220ms ease",
  mixBlendMode: "screen",
  zIndex: 0,
};

const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const WorkDetailModal = ({
  work,
  onClose,
}: {
  work: WorkItem | null;
  onClose: () => void;
}) => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const navigate = useNavigate();

  useEffect(() => {
    if (!work) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [work, onClose]);

  if (!work) return null;

  const openCase = () => {
    onClose();
    if (work.slug) {
      navigate(`/works/${work.slug}`);
      return;
    }
    if (work.caseHref) window.open(work.caseHref, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center p-6"
      style={{ background: "transparent", pointerEvents: "none" }}
      aria-hidden={false}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden animate-scale-in"
        style={{
          background: "var(--card)",
          border: "1px solid var(--accent-soft-border)",
          borderRadius: "28px",
          pointerEvents: "auto",
          boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div className="relative overflow-hidden" style={{ height: "240px", background: work.gradient }}>
          {work.coverImage ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.52) 100%), url(${work.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-8xl" style={{ pointerEvents: "none" }}>
                {work.emoji}
              </div>
            </>
          )}
          {work.award && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(232,255,71,0.9)", color: "#0a0a0f" }}>
              🏆 {work.award}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.38)", color: "rgba(255,255,255,0.92)" }}
            aria-label={lang === "en" ? "Close" : "关闭"}
          >
            ×
          </button>
        </div>
        <div className="p-7" style={{ background: "var(--card)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{work.category}</span>
            <span className="text-muted-foreground opacity-30">·</span>
            <span className="text-xs text-muted-foreground">{work.year}</span>
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">{work.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{work.subtitle}</p>
          <div className="p-4 rounded-xl mb-5 text-sm text-muted-foreground leading-relaxed" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            {work.desc}
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {work.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border text-muted-foreground" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                {tag}
              </span>
            ))}
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--btn-primary-bg)", color: "var(--primary-foreground)", boxShadow: "var(--btn-primary-shadow)" }}
            onClick={openCase}
            disabled={!work.slug && !work.caseHref}
          >
            {lang === "en" ? "View details" : "查看详情"}
          </button>
        </div>
        <div className="px-7 pb-6 text-xs text-muted-foreground" style={{ background: "var(--card)" }}>
          {lang === "en" ? "Press Esc to close." : "按 Esc 关闭。"}
        </div>
      </div>
    </div>
  );
};

const FlipCarousel = ({ works }: { works: WorkItem[] }) => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const navigate = useNavigate();
  const { resolvedTheme } = useThemeMode();
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<null | "main" | "side0" | "side1">(null);
  const [detailWork, setDetailWork] = useState<WorkItem | null>(null);

  const VISIBLE = 3;
  const total = works.length;
  const pageCount = Math.max(1, Math.ceil(total / VISIBLE));
  const pageStart = currentPage * VISIBLE;

  const detailsBtnStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px) saturate(1.2)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06) inset",
    letterSpacing: "0.08em",
    fontWeight: 900,
  };

  const goNext = () => {
    if (isAnimating) return;
    setDirection("right");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((p) => (p + 1) % pageCount);
      setIsAnimating(false);
    }, 300);
  };

  const goPrev = () => {
    if (isAnimating) return;
    setDirection("left");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((p) => (p - 1 + pageCount) % pageCount);
      setIsAnimating(false);
    }, 300);
  };

  const getVisible = () => {
    return works.slice(pageStart, pageStart + VISIBLE);
  };

  const visibleWorks = getVisible();
  const mainWork = visibleWorks[0];
  const sideWorks = visibleWorks.slice(1);

  const openDetails = (work: WorkItem) => {
    try {
      window.dispatchEvent(new CustomEvent("sfx", { detail: { kind: "pop" } }));
    } catch {
      // ignore
    }
    setDetailWork(work);
  };

  // Hover focus: hovered card becomes the biggest (desktop).
  const focusCurve = "cubic-bezier(0.2, 0.95, 0.2, 1)";
  const focusMs = 360;
  const fastMs = 220;
  const mainBasis = hoveredCard === "main" ? "68%" : hoveredCard ? "46%" : "58%";
  const sideBasis = hoveredCard === "main" ? "32%" : hoveredCard ? "54%" : "42%";
  const sideHeights =
    hoveredCard === "side0"
      ? { a: 228, b: 128 }
      : hoveredCard === "side1"
        ? { a: 128, b: 228 }
        : { a: 162, b: 162 };
  const unfocusedFilter = hoveredCard ? "saturate(0.92) brightness(0.92) blur(0.85px)" : "none";
  const focusedFilter = hoveredCard ? "saturate(1.02) brightness(1)" : "none";

  const focusGlowStyle: React.CSSProperties = {
    position: "absolute",
    inset: "-1px",
    borderRadius: "inherit",
    pointerEvents: "none",
    opacity: 0,
    transition: `opacity ${fastMs}ms ease`,
    background:
      "radial-gradient(420px 260px at var(--mx, 50%) var(--my, 40%), rgba(255,255,255,0.22), rgba(255,255,255,0.06) 38%, rgba(255,255,255,0.00) 72%)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.10) inset, 0 26px 70px rgba(0,0,0,0.28)",
    mixBlendMode: "screen",
    zIndex: 6,
  };

  const detailsBtnClassName = "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-[1.03]";
  const detailsBtnExtraStyle: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    right: "20px",
    insetInlineEnd: "20px",
    left: "auto",
    padding: "6px 12px",
    minHeight: "32px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    zIndex: 80,
  };

  return (
    <>
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-6">
          <div
            className="cursor-pointer"
            style={{
              perspective: "1200px",
              minHeight: "340px",
              flexBasis: mainBasis,
              flexGrow: 1,
              transition: `flex-basis ${focusMs}ms ${focusCurve}`,
            }}
            {...ambientHandlers}
            data-sfx-hover="glow"
            onClick={() => {
              if (mainWork.slug) navigate(`/works/${mainWork.slug}`);
              else openDetails(mainWork);
            }}
            onMouseEnter={() => setHoveredCard("main")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div
              className="relative w-full h-full transition-all duration-600"
              style={{
                transition: `filter ${fastMs}ms ease, transform ${focusMs}ms ${focusCurve}`,
                minHeight: "340px",
                filter: hoveredCard && hoveredCard !== "main" ? unfocusedFilter : "none",
                transform: hoveredCard === "main" ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
                willChange: "transform",
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden"
                style={{
                  background: mainWork.gradient,
                  minHeight: "340px",
                  position: "relative",
                }}
              >
                <div style={{ ...focusGlowStyle, opacity: hoveredCard === "main" ? 1 : 0 }} />
                {mainWork.coverImage ? (
                  <div className="absolute inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
                    <div
                      className="absolute inset-0 transition-transform duration-700"
                      style={{
                        backgroundImage:
                          resolvedTheme === "light"
                            ? `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(15,23,42,0.22) 100%), url(${mainWork.coverImage})`
                            : `linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 100%), url(${mainWork.coverImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        transform: "scale(1.02)",
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: resolvedTheme === "light" ? 0.02 : 0.1,
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                    <div className="absolute inset-0 flex items-center justify-center text-9xl">{mainWork.emoji}</div>
                  </>
                )}
                {mainWork.award && (
                  <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(232,255,71,0.92)", color: "#0a0a0f" }}>
                    🏆 {mainWork.award}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6" style={{ zIndex: 10, background: "var(--media-bottom-overlay)", transition: "background 420ms ease" }}>
                  <div className="text-xs text-primary-foreground opacity-60 mb-1">
                    {mainWork.category} · {mainWork.year}
                  </div>
                  <h3
                    className="font-black text-primary-foreground"
                    style={{
                      fontSize: hoveredCard === "main" ? "22px" : "20px",
                      transition: `font-size ${focusMs}ms ${focusCurve}`,
                      filter: hoveredCard === "main" ? focusedFilter : "none",
                    }}
                  >
                    {mainWork.title}
                  </h3>
                  <p
                    className="text-primary-foreground opacity-70 mt-1"
                    style={{
                      fontSize: hoveredCard === "main" ? "15px" : "14px",
                      transition: `font-size ${focusMs}ms ${focusCurve}`,
                      filter: hoveredCard === "main" ? focusedFilter : "none",
                    }}
                  >
                    {mainWork.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetails(mainWork);
                  }}
                  className={detailsBtnClassName}
                  style={{
                    ...detailsBtnStyle,
                    ...ambientButtonWrap,
                    ...detailsBtnExtraStyle,
                  }}
                  {...ambientHandlers}
                  title={lang === "en" ? "Open details" : "查看详情"}
                  aria-label={lang === "en" ? "Open details" : "查看详情"}
                >
                  <span aria-hidden style={ambientLightLayerStyle} />
                  <Info size={12} style={{ opacity: 0.92, position: "relative", zIndex: 1 }} />
                  <span style={{ position: "relative", zIndex: 1 }}>{lang === "en" ? "View details" : "查看详情"}</span>
                </button>
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-4"
            style={{
              flexBasis: sideBasis,
              transition: `flex-basis ${focusMs}ms ${focusCurve}`,
            }}
          >
            {sideWorks.map((work, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={work.title}
                className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{
                  height: `${i === 0 ? sideHeights.a : sideHeights.b}px`,
                  background: work.gradient,
                  filter: hoveredCard && hoveredCard !== (i === 0 ? "side0" : "side1") ? unfocusedFilter : "none",
                  transition: `height ${focusMs}ms ${focusCurve}, filter ${fastMs}ms ease, transform ${focusMs}ms ${focusCurve}`,
                  willChange: "height, transform",
                  transform: hoveredCard === (i === 0 ? "side0" : "side1") ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
                  position: "relative",
                }}
                {...ambientHandlers}
                data-sfx-hover="glow"
                onClick={() => {
                  if (work.slug) navigate(`/works/${work.slug}`);
                  else openDetails(work);
                }}
                onMouseEnter={() => setHoveredCard(i === 0 ? "side0" : "side1")}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ ...focusGlowStyle, opacity: hoveredCard === (i === 0 ? "side0" : "side1") ? 1 : 0 }} />
                {work.coverImage ? (
                  <div className="absolute inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
                    <div
                      className="absolute inset-0 transition-transform duration-700"
                      style={{
                        backgroundImage:
                          resolvedTheme === "light"
                            ? `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(15,23,42,0.22) 100%), url(${work.coverImage})`
                            : `linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.6) 100%), url(${work.coverImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        transform: "scale(1.02)",
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: resolvedTheme === "light" ? 0.02 : 0.1,
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                      {work.emoji}
                    </div>
                  </>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3" style={{ zIndex: 10, background: "var(--media-bottom-overlay)", transition: "background 420ms ease" }}>
                  <div className="text-[12px] text-primary-foreground opacity-60 mb-0.5">
                    {work.category} · {work.year}
                  </div>
                  <div
                    className="text-primary-foreground font-semibold"
                    style={{
                      lineHeight: 1.2,
                      fontSize: hoveredCard === (i === 0 ? "side0" : "side1") ? "13px" : "12px",
                      transition: `font-size ${focusMs}ms ${focusCurve}`,
                      filter: hoveredCard === (i === 0 ? "side0" : "side1") ? focusedFilter : "none",
                    }}
                  >
                    {work.title}
                  </div>
                  <div
                    className="text-primary-foreground opacity-70"
                    style={{
                      lineHeight: 1.2,
                      marginTop: "2px",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden" as const,
                      fontSize: hoveredCard === (i === 0 ? "side0" : "side1") ? "12px" : "11px",
                      transition: `font-size ${focusMs}ms ${focusCurve}`,
                      filter: hoveredCard === (i === 0 ? "side0" : "side1") ? focusedFilter : "none",
                    }}
                  >
                    {work.subtitle}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetails(work);
                  }}
                  className={detailsBtnClassName}
                  style={{
                    ...detailsBtnStyle,
                    ...ambientButtonWrap,
                    ...detailsBtnExtraStyle,
                  }}
                  {...ambientHandlers}
                  title={lang === "en" ? "Open details" : "查看详情"}
                  aria-label={lang === "en" ? "Open details" : "查看详情"}
                >
                  <span aria-hidden style={ambientLightLayerStyle} />
                  <Info size={12} style={{ opacity: 0.9, position: "relative", zIndex: 1 }} />
                  <span style={{ position: "relative", zIndex: 1 }}>{lang === "en" ? "View details" : "查看详情"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i);
                }}
                className="transition-all duration-300"
                style={{
                  width: i === currentPage ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === currentPage ? "var(--primary)" : "var(--surface-3)",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:border-primary"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", ...ambientButtonWrap }}
              {...ambientHandlers}
              aria-label={lang === "en" ? "Previous page" : "上一页"}
            >
              <span aria-hidden style={{ ...ambientLightLayerStyle, borderRadius: "999px" }} />
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "var(--btn-primary-bg)", color: "var(--primary-foreground)", boxShadow: "var(--btn-primary-shadow)", ...ambientButtonWrap }}
              {...ambientHandlers}
              aria-label={lang === "en" ? "Next page" : "下一页"}
            >
              <span aria-hidden style={{ ...ambientLightLayerStyle, borderRadius: "999px" }} />
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground justify-center" style={{ opacity: 0.78 }}>
          <span>{siteContent.works.carouselHint[0]}</span>
          <span>·</span>
          <span>{siteContent.works.carouselHint[1]}</span>
          <span>·</span>
          <span>{siteContent.works.carouselHint[2]}</span>
        </div>
      </div>

      <WorkDetailModal work={detailWork} onClose={() => setDetailWork(null)} />
    </>
  );
};

const Works = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const CATEGORIES = siteContent.works.categories;
  const ALL_WORKS = siteContent.works.items;
  const { ref, inView } = useInView();
  const [activeCategory, setActiveCategory] = useState(lang === "en" ? "All" : "全部");

  useEffect(() => {
    setActiveCategory(lang === "en" ? "All" : "全部");
  }, [lang]);

  const allLabel = lang === "en" ? "All" : "全部";
  const filtered = activeCategory === allLabel ? ALL_WORKS : ALL_WORKS.filter((w) => w.category === activeCategory);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        // handled inside carousel
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <section id="works" ref={ref} className="py-32 relative" style={{ background: "var(--works-section-bg)", transition: "background 420ms ease" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span className="text-xs text-primary tracking-[0.3em] uppercase font-medium">Portfolio</span>
            <h2 className="text-6xl font-black leading-none tracking-tighter mt-3">
              {lang === "en" ? (
                <>
                  <span className="text-foreground">Selected</span>
                  <span className="text-gradient"> Work</span>
                </>
              ) : (
                <>
                  <span className="text-foreground">精选</span>
                  <span className="text-gradient"> 作品</span>
                </>
              )}
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xs leading-relaxed text-sm mt-4 md:mt-0">{siteContent.works.headerDesc}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
              style={{
                background:
                  activeCategory === cat
                    ? "linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(99,102,241,0.95) 100%)"
                    : "var(--card)",
                color: activeCategory === cat ? "rgba(255,255,255,0.96)" : "var(--muted-foreground)",
                border: `1px solid ${activeCategory === cat ? "rgba(255,255,255,0.16)" : "var(--border)"}`,
                boxShadow: activeCategory === cat ? "0 14px 38px rgba(99,102,241,0.22)" : "none",
                position: "relative",
                overflow: "hidden",
                transform: "translateZ(0)",
              }}
              data-sfx="yay"
            >
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{
                  opacity: activeCategory === cat ? 1 : 0,
                  background:
                    "radial-gradient(240px 120px at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.00) 72%)",
                  mixBlendMode: "screen",
                }}
              />
              {cat}
              <span className="ml-2 text-xs opacity-60">{cat === allLabel ? ALL_WORKS.length : ALL_WORKS.filter((w) => w.category === cat).length}</span>
            </button>
          ))}
        </div>

        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {filtered.length > 0 ? <FlipCarousel works={filtered} /> : <div className="text-center py-20 text-muted-foreground">{siteContent.works.emptyText}</div>}
        </div>

        <div className="flex justify-center mt-16">
          <button className="flex items-center gap-3 px-8 py-3.5 rounded-full border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300" style={{ borderColor: "var(--border)" }}>
            {siteContent.works.loadMoreText}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Works;

