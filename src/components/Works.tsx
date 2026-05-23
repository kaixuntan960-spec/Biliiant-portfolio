import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowRight, ExternalLink } from "lucide-react";
import { useI18n, useSiteContent } from "../i18n";
import type { WorkItem } from "../content/site";
import { useNavigate, useLocation } from "react-router-dom";
import { useThemeMode } from "../theme";

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

const ambientHandlers = {
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
    el.style.setProperty("--mop", "1");
  },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty("--mop", "0");
  },
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized;
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const useInView = (threshold = 0.15) => {
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

// ─── Layout constants ────────────────────────────────────────────────────────

const TRANSITION_MS = 460;
const STAGE_WIDTH = 1120;
const STAGE_HEIGHT = 680;
const DRAG_THRESHOLD = 86;
const MAX_DRAG = 150;

const getCategoryPageSize = (categoryKey: string) =>
  /^UI\s*项目/.test(categoryKey) || /^UI\s*Projects/.test(categoryKey) ? 4 : 3;

const threeCardLayouts = [
  { left: 44,  top: 116, w: 304, h: 368, r: -14, z: 8,  shiftX: -18, shiftY: -10, scale: 0.965 },
  { left: 332, top: 24,  w: 382, h: 456, r: -2,  z: 16, shiftX: 0,   shiftY: -12, scale: 1.02  },
  { left: 728, top: 106, w: 298, h: 360, r: 13,  z: 9,  shiftX: 20,  shiftY: -8,  scale: 0.965 },
];

const twoCardLayouts = [
  { left: 210, top: 78, w: 336, h: 404, r: -8, z: 12, shiftX: -14, shiftY: -8, scale: 0.99 },
  { left: 574, top: 70, w: 336, h: 404, r: 8,  z: 13, shiftX: 14,  shiftY: -8, scale: 0.99 },
];

const fourCardLayouts = [
  { left: 62,  top: 132, w: 284, h: 344, r: -12, z: 8,  shiftX: -14, shiftY: -8,  scale: 0.965 },
  { left: 300, top: 22,  w: 312, h: 376, r: -4,  z: 14, shiftX: -6,  shiftY: -10, scale: 1     },
  { left: 538, top: 22,  w: 312, h: 376, r: 4,   z: 15, shiftX: 6,   shiftY: -10, scale: 1     },
  { left: 776, top: 132, w: 284, h: 344, r: 12,  z: 9,  shiftX: 14,  shiftY: -8,  scale: 0.965 },
];

const singleCardLayout = { left: 369, top: 48, w: 382, h: 456, r: 0, z: 14, shiftX: 0, shiftY: -12, scale: 1.02 };

type CardLayout = typeof singleCardLayout;

const getLayout = (pageLength: number, index: number): CardLayout => {
  if (pageLength <= 1) return singleCardLayout;
  if (pageLength === 2) return twoCardLayouts[index] ?? twoCardLayouts[0];
  if (pageLength === 4) return fourCardLayouts[index] ?? fourCardLayouts[1];
  return threeCardLayouts[index] ?? threeCardLayouts[1];
};

const getPageWorks = (works: WorkItem[], page: number, pageSize: number) =>
  works.slice(page * pageSize, page * pageSize + pageSize);

const getFocusWork = (items: WorkItem[]) => items[1] ?? items[0] ?? null;

const buildTransform = ({
  left, top, rotate, scale = 1, translateX = 0, translateY = 0,
}: {
  left: number; top: number; rotate: number; scale?: number; translateX?: number; translateY?: number;
}) => `translate3d(${left + translateX}px, ${top + translateY}px, 0) rotate(${rotate}deg) scale(${scale})`;

// ─── Card colors ─────────────────────────────────────────────────────────────

const cardGradients = [
  "linear-gradient(145deg, #fff1df 0%, #ffe2c8 42%, #efe0ff 100%)",
  "linear-gradient(145deg, #eaf5ff 0%, #dcecff 42%, #ece3ff 100%)",
  "linear-gradient(145deg, #f5ebff 0%, #e9ddff 42%, #deecff 100%)",
];

const accentByIdx = ["#ffb14a", "#62b8ff", "#b896ff"];
const titleColorByIdx = ["#d88416", "#3d8fda", "#8d63d9"];

// ─── Placeholder artwork ─────────────────────────────────────────────────────

const PlaceholderArtwork = () => (
  <div
    className="w-full h-full"
    style={{
      background:
        "radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.62) 48%, rgba(255, 255, 255, 0.18) 100%)",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "16%", bottom: "8%", width: "42%", height: "42%",
        borderRadius: "18px",
        background: "linear-gradient(180deg, rgba(168,126,242,0.32), rgba(255,255,255,0.7))",
        border: "1px solid rgba(255,255,255,0.72)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: "14%", bottom: "10%", width: "34%", height: "46%",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.74)",
        border: "1px solid rgba(255,255,255,0.76)",
      }}
    />
  </div>
);

// ─── WorkDetailModal ──────────────────────────────────────────────────────────

const WorkDetailModal = ({
  work,
  onClose,
  worksNavState,
}: {
  work: WorkItem | null;
  onClose: () => void;
  worksNavState: { worksCarouselPage: number; worksCategory: string };
}) => {
  const { lang } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!work) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [work, onClose]);

  if (!work) return null;

  const coverPos =
    work.slug === "socks-detective" ? "center 62%"
    : work.slug === "motion-rules"  ? "center 28%"
    : "center";

  const openCase = () => {
    onClose();
    try {
      sessionStorage.setItem("from-work-carousel-page", String(worksNavState.worksCarouselPage));
      sessionStorage.setItem("from-work-category", worksNavState.worksCategory);
    } catch {}
    if (work.slug === "socks-detective") {
      navigate(`/works/${work.slug}/read`, { state: worksNavState });
      return;
    }
    if (work.slug) {
      navigate(`/works/${work.slug}`, { state: worksNavState });
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
          background: "linear-gradient(180deg, color-mix(in srgb, var(--card) 94%, white 6%), var(--card))",
          border: "1px solid color-mix(in srgb, var(--accent-soft-border) 72%, white 28%)",
          borderRadius: "28px",
          pointerEvents: "auto",
          boxShadow: "0 28px 80px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(460px 180px at 80% -20%, rgba(184,150,255,0.2), rgba(184,150,255,0) 72%)" }}
        />
        <div className="relative overflow-hidden" style={{ height: "240px", background: work.gradient }}>
          {work.coverImage ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${work.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: coverPos,
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
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(250,244,239,0.9) 52%, rgba(241,230,220,0.85) 100%)",
              color: "rgba(122, 86, 58, 0.9)",
              border: "1px solid rgba(255,255,255,0.88)",
              backdropFilter: "blur(14px) saturate(1.1)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(194,160,130,0.26)",
              fontSize: "21px",
              fontWeight: 600,
              lineHeight: 1,
              textShadow: "0 1px 0 rgba(255,255,255,0.72), 0 0 10px rgba(255,255,255,0.28)",
            }}
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
          <h3 className="text-xl font-semibold text-foreground mb-2">{work.title}</h3>
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
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 86%, white 14%) 0%, var(--primary) 100%)",
              color: "var(--primary-foreground)",
              boxShadow: "0 12px 28px color-mix(in srgb, var(--primary) 42%, transparent)",
            }}
            onClick={openCase}
            disabled={!work.slug && !work.caseHref}
          >
            <ExternalLink size={14} />
            {lang === "en" ? "View details" : "查看详情"}
          </button>
        </div>
        <div className="px-7 pb-6 text-xs text-muted-foreground" style={{ background: "var(--card)", opacity: 0.8 }}>
          {lang === "en" ? "Press Esc to close." : "按 Esc 关闭。"}
        </div>
      </div>
    </div>
  );
};

// ─── ProjectCard ──────────────────────────────────────────────────────────────

const ProjectCard = ({
  work,
  workVariants,
  index,
  layout,
  transform,
  opacity = 1,
  blur = 0,
  isHovered,
  transition,
  pointerEvents,
  detailLabel,
  theme,
  onClick,
  onHoverStart,
  onHoverEnd,
  onDetail,
}: {
  work: WorkItem;
  workVariants?: WorkItem[];
  index: number;
  layout: CardLayout;
  transform: string;
  opacity?: number;
  blur?: number;
  isHovered: boolean;
  transition: string;
  pointerEvents?: React.CSSProperties["pointerEvents"];
  detailLabel: string;
  theme: "light" | "dark";
  onClick: (work: WorkItem) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onDetail: (e: React.MouseEvent<HTMLButtonElement>, work: WorkItem) => void;
}) => {
  const variants = workVariants?.length ? workVariants : [work];
  const [variantIdx, setVariantIdx] = useState(0);
  const wheelDebounce = useRef(false);

  useEffect(() => { setVariantIdx(0); }, [work.slug, work.title]);

  const currentWork = variants[variantIdx] ?? work;
  const isDark = theme === "dark";
  const accent = accentByIdx[index] ?? "#b58cff";
  const gradient = cardGradients[index] ?? "linear-gradient(180deg, #eee 0%, #e7e7e7 100%)";
  const overlay1 = hexToRgba(accent, isDark ? 0.16 : 0.12);
  const overlay2 = hexToRgba(accent, isDark ? 0.10 : 0.08);
  const cardBg = isDark
    ? `radial-gradient(140% 120% at 14% 12%, ${overlay1} 0%, rgba(255,255,255,0.06) 46%, rgba(12,14,22,0.22) 100%), ${gradient}, linear-gradient(180deg, rgba(21,24,33,0.2), rgba(21,24,33,0.18))`
    : `radial-gradient(140% 120% at 12% 10%, ${overlay2} 0%, rgba(255,255,255,0.76) 46%, rgba(255,255,255,0.38) 100%), ${gradient}`;
  const titleColor = titleColorByIdx[index] ?? "#9160d9";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.9)";
  const cardShadow = isDark
    ? index === 1 ? "0 24px 58px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.08)" : "0 16px 38px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
    : index === 1 ? "0 28px 62px rgba(84,88,122,0.16), inset 0 1px 0 rgba(255,255,255,0.66)" : "0 18px 40px rgba(97,103,134,0.12), inset 0 1px 0 rgba(255,255,255,0.56)";
  const subtitleColor = hexToRgba(titleColor, isDark ? 0.86 : 0.76);
  const detailButtonBg = "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.86) 100%)";
  const detailButtonBorder = isDark ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.9)";
  const detailButtonColor = hexToRgba(titleColor, isDark ? 0.98 : 0.94);
  const mediaBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.42)";
  const mediaBorder = isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.66)";
  const contentTop = Math.round(layout.h * 0.53) + 26;
  const isMotionRules = currentWork.slug === "motion-rules";
  const coverPos =
    currentWork.slug === "socks-detective" ? "center 64%"
    : currentWork.slug === "bijie-ai"      ? "center 58%"
    : currentWork.slug === "aigc"          ? "60% center"
    : currentWork.slug === "poster-collection" ? "center"
    : "center";
  const coverFit = "cover";

  return (
    <div
      className="absolute cursor-pointer"
      data-project-card="true"
      style={{
        width: `${layout.w}px`,
        height: `${layout.h}px`,
        transform,
        transformOrigin: "center center",
        borderRadius: "30px",
        border: cardBorder,
        background: cardBg,
        boxShadow: cardShadow,
        zIndex: layout.z,
        overflow: "hidden",
        transition,
        opacity,
        filter: `blur(${blur}px) saturate(${index === 1 ? 1.02 : 0.96})`,
        pointerEvents,
        willChange: "transform, opacity, filter",
        backfaceVisibility: "hidden",
      }}
      onClick={() => onClick(currentWork)}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onWheel={variants.length > 1 ? (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (wheelDebounce.current) return;
        wheelDebounce.current = true;
        window.setTimeout(() => { wheelDebounce.current = false; }, 120);
        setVariantIdx((prev) => {
          const dir = e.deltaY > 0 ? 1 : -1;
          return (prev + dir + variants.length) % variants.length;
        });
      } : undefined}
    >
      {/* Cover image */}
      <div
        style={{
          position: "absolute",
          left: "18px", right: "18px", top: "18px",
          height: `${Math.round(layout.h * 0.5)}px`,
          borderRadius: "22px",
          overflow: "hidden",
          background: mediaBg,
          border: mediaBorder,
          boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        {currentWork.coverImage ? (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: isDark
                ? isMotionRules
                  ? `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 34%, rgba(0,0,0,0.16) 100%), url(${currentWork.coverImage})`
                  : `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 36%, rgba(0,0,0,0.26) 100%), url(${currentWork.coverImage})`
                : isMotionRules
                  ? `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 36%, rgba(0,0,0,0.10) 100%), url(${currentWork.coverImage})`
                  : `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 38%, rgba(0,0,0,0.16) 100%), url(${currentWork.coverImage})`,
              backgroundSize: coverFit,
              backgroundPosition: coverPos,
              filter: isMotionRules ? (isDark ? "brightness(1.08) contrast(1.02)" : "brightness(1.1) contrast(1.01)") : "none",
              transform: isHovered ? "scale(1.03)" : "scale(1)",
              transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        ) : (
          <PlaceholderArtwork />
        )}
      </div>

      {/* Text */}
      <div
        style={{
          position: "absolute",
          left: "22px", right: "22px",
          top: `${contentTop}px`,
          bottom: "70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflow: "hidden",
        }}
      >
        <div className="font-black" style={{ fontSize: "24px", lineHeight: 1.08, color: titleColor, letterSpacing: "-0.02em" }}>
          {currentWork.title}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: subtitleColor,
            lineHeight: 1.42,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textWrap: "pretty",
          }}
        >
          {currentWork.subtitle}
        </div>
      </div>

      {/* Variant dots */}
      {variants.length > 1 ? (
        <div
          title="滚轮切换项目"
          style={{
            position: "absolute",
            top: "22px", right: "24px",
            width: "26px",
            padding: "8px 0",
            borderRadius: "999px",
            background: "rgba(15,18,26,0.45)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            zIndex: 3,
          }}
        >
          {variants.map((_, i) => (
            <span
              key={`${currentWork.coverImage ?? "v"}-${i}`}
              style={{
                width: i === variantIdx ? "8px" : "5px",
                height: i === variantIdx ? "8px" : "5px",
                borderRadius: "999px",
                background: i === variantIdx ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.46)",
                transition: "all 180ms ease",
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Bottom actions */}
      <div
        style={{
          position: "absolute",
          left: "16px", right: "16px", bottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={(e) => onDetail(e, currentWork)}
          style={{
            height: "33px",
            borderRadius: "999px",
            padding: "0 11px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: detailButtonColor,
            fontWeight: 600,
            fontSize: "12px",
            letterSpacing: "0.01em",
            background: detailButtonBg,
            border: detailButtonBorder,
            cursor: "pointer",
            backdropFilter: "blur(14px)",
          }}
        >
          <ExternalLink size={13} strokeWidth={2.5} />
          {variants.length > 1 ? `${detailLabel} ${variantIdx + 1}/${variants.length}` : detailLabel}
        </button>
        <div
          style={{
            width: "34px", height: "34px",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hexToRgba(accent, isDark ? 0.92 : 0.86),
            border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.5)",
            color: "rgba(255,255,255,0.98)",
          }}
        >
          <ArrowRight size={17} strokeWidth={2.8} />
        </div>
      </div>
    </div>
  );
};

// ─── WorksCarousel ────────────────────────────────────────────────────────────

const WorksCarousel = ({ works, categoryKey }: { works: WorkItem[]; categoryKey: string }) => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useThemeMode();

  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [detailWork, setDetailWork] = useState<WorkItem | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [incomingPage, setIncomingPage] = useState<number | null>(null);
  const [animatePhase, setAnimatePhase] = useState(false);
  const [bgPointer, setBgPointer] = useState({ x: 50, y: 50 });
  const [scrollShift, setScrollShift] = useState(0);
  const [stageScale, setStageScale] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const startPointerX = useRef(0);
  const lastDragOffset = useRef(0);

  const pageSize = getCategoryPageSize(categoryKey);
  const pageCount = Math.max(1, Math.ceil(works.length / pageSize));
  const currentWorks = getPageWorks(works, currentPage, pageSize);
  const incomingWorks = incomingPage !== null ? getPageWorks(works, incomingPage, pageSize) : [];
  const isAnimating = incomingPage !== null;
  const isDark = resolvedTheme === "dark";

  // Group works sharing the same cover image as variants
  const variantMap = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    for (const w of works) {
      if (!w.coverImage) continue;
      const group = map.get(w.coverImage) ?? [];
      group.push(w);
      map.set(w.coverImage, group);
    }
    return map;
  }, [works]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  // Restore page from sessionStorage (for back-navigation)
  useLayoutEffect(() => {
    try {
      const savedPage = sessionStorage.getItem("from-work-carousel-page");
      const savedCategory = sessionStorage.getItem("from-work-category");
      if (savedPage && savedCategory === categoryKey) {
        const targetPage = parseInt(savedPage, 10);
        setCurrentPage(Math.min(pageCount - 1, Math.max(0, targetPage)));
      }
    } catch {
      // ignore
    }
  }, [categoryKey, pageCount]);

  // Scale stage to container width
  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) return;
    const update = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) { setStageScale(1); return; }
      const w = container.clientWidth;
      if (w <= 0) return;
      setStageScale(Math.min(1, Math.max(0.55, w / STAGE_WIDTH)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener("resize", update);
    update();
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [currentPage, categoryKey, works.length]);

  // Scroll parallax shift
  useEffect(() => {
    let raf: number | null = null;
    const onScroll = () => {
      if (raf !== null) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        const el = carouselRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const ratio = (rect.top + rect.height / 2 - vh / 2) / vh;
        setScrollShift(Math.max(-12, Math.min(12, ratio * 22)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getNavState = () => ({ scrollTo: "works" as const, worksCarouselPage: currentPage, worksCategory: categoryKey });

  const startTransition = (targetPage: number, nextDirection: "left" | "right") => {
    if (isAnimating || targetPage === currentPage) return;
    setDirection(nextDirection);
    setIncomingPage(targetPage);
    setAnimatePhase(false);
    window.requestAnimationFrame(() => setAnimatePhase(true));
    window.setTimeout(() => {
      setCurrentPage(targetPage);
      setIncomingPage(null);
      setAnimatePhase(false);
    }, TRANSITION_MS);
  };

  const goNext = () => startTransition((currentPage + 1) % pageCount, "right");
  const goPrev = () => startTransition((currentPage - 1 + pageCount) % pageCount, "left");

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as Element;
    if (target?.closest("button, a, input, textarea, select, [role='button']")) return;
    if (target?.closest("[data-project-card='true']")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerId.current = e.pointerId;
    startPointerX.current = e.clientX;
    lastDragOffset.current = 0;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBgPointer({ x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) });

    if (activePointerId.current !== e.pointerId) return;
    const delta = e.clientX - startPointerX.current;
    const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, delta));
    lastDragOffset.current = clamped;
    setDragOffset(clamped);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    activePointerId.current = null;
    setIsDragging(false);
    setDragOffset(0);
    const offset = lastDragOffset.current;
    lastDragOffset.current = 0;
    if (Math.abs(offset) < DRAG_THRESHOLD) return;
    if (offset < 0) goNext(); else goPrev();
  };

  const openDetails = (work: WorkItem) => {
    try { window.dispatchEvent(new CustomEvent("sfx", { detail: { kind: "pop" } })); } catch {}
    setDetailWork(work);
  };

  const handleCardClick = (work: WorkItem) => {
    // Save carousel state before navigating away
    try {
      sessionStorage.setItem("from-work-carousel-page", String(currentPage));
      sessionStorage.setItem("from-work-category", categoryKey);
    } catch {}
    if (work.slug === "socks-detective") { navigate("/works/socks-detective/read", { state: getNavState() }); return; }
    if (work.slug) { navigate(`/works/${work.slug}`, { state: getNavState() }); return; }
    openDetails(work);
  };

  const detailLabel = lang === "en" ? "View details" : "查看详情";

  const renderCards = (pageWorks: WorkItem[], mode: "current" | "incoming") => {
    const isIncoming = mode === "incoming";
    return pageWorks.map((work, i) => {
      // For 2-item animation pages, swap accent/gradient index so layout stays but colors swap
      const colorIdx =
        pageWorks.length === 2 && pageWorks.every((w) => /动画|Animation/i.test(w.category)) ? 1 - i : i;
      const layout = getLayout(pageWorks.length, i);
      const isHovered = hoveredCard === i && !isAnimating && !isIncoming;

      let tx = 0, ty = 0, sc = 1;
      if (isIncoming) {
        tx = animatePhase ? 0 : direction === "right" ? 58 : -58;
        ty = animatePhase ? 0 : 3;
        sc = animatePhase ? 1 : 0.992;
      } else {
        if (isHovered) { tx = layout.shiftX; ty = layout.shiftY; sc = layout.scale; }
        if (isAnimating) { tx += direction === "right" ? -48 : 48; ty += 3; sc *= 0.992; }
        tx += dragOffset * (i === 1 ? 0.95 : 0.68);
      }

      const variantGroup = work.coverImage ? variantMap.get(work.coverImage) : undefined;
      const workVariants = variantGroup && variantGroup.length > 1 ? variantGroup : undefined;

      return (
        <ProjectCard
          key={`${isIncoming ? "incoming" : "current"}-${work.title}-${i}`}
          work={work}
          workVariants={workVariants}
          index={colorIdx}
          layout={layout}
          transform={buildTransform({ left: layout.left, top: layout.top, rotate: layout.r, scale: sc, translateX: tx, translateY: ty })}
          isHovered={isHovered}
          opacity={isIncoming ? 1 : isAnimating ? 0.01 : 1}
          blur={0}
          transition={`transform ${TRANSITION_MS}ms cubic-bezier(0.2, 0.98, 0.28, 1), opacity 80ms linear`}
          pointerEvents={isIncoming ? (animatePhase ? "auto" : "none") : undefined}
          detailLabel={detailLabel}
          theme={resolvedTheme}
          onClick={(w) => handleCardClick(w)}
          onHoverStart={!isIncoming ? () => { if (!isAnimating) setHoveredCard(i); } : undefined}
          onHoverEnd={!isIncoming ? () => setHoveredCard(null) : undefined}
          onDetail={(e, w) => { e.stopPropagation(); openDetails(w); }}
        />
      );
    });
  };

  getFocusWork(currentWorks);
  if (incomingPage !== null) getFocusWork(incomingWorks);

  return (
    <>
      <div className="relative" id="works-carousel" ref={carouselRef}>
        {/* Desktop — grid: [prev] [stage] [next] */}
        <div
          className="mx-auto hidden w-full max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-2 pt-1 md:grid sm:gap-5 sm:px-6"
          style={{ minHeight: `${STAGE_HEIGHT}px` }}
        >
          <button
            type="button"
            onClick={goPrev}
            className="z-30 flex h-10 w-10 shrink-0 items-center justify-center justify-self-center rounded-full transition-all hover:scale-110 hover:border-primary"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", ...ambientButtonWrap }}
            {...ambientHandlers}
            aria-label={lang === "en" ? "Previous page" : "上一页"}
          >
            <span aria-hidden style={{ ...ambientLightLayerStyle, borderRadius: "999px" }} />
            <ChevronLeft size={18} />
          </button>

          {/* Scalable stage */}
          <div
            ref={stageContainerRef}
            className="relative mx-auto w-full min-w-0 max-w-[1120px] justify-self-center overflow-hidden"
            style={{ height: `${Math.round(STAGE_HEIGHT * stageScale)}px` }}
          >
            <div
              className="absolute left-1/2 top-0"
              style={{
                width: STAGE_WIDTH,
                height: STAGE_HEIGHT,
                transform: `translateX(-50%) scale(${stageScale})`,
                transformOrigin: "top center",
              }}
            >
              {/* Background glass panel */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: "18px",
                  width: "1020px",
                  height: "598px",
                  borderRadius: "42px",
                  overflow: "hidden",
                  background: isDark
                    ? "linear-gradient(90deg, rgba(28,32,44,0.52) 0%, rgba(15,18,28,0.9) 50%, rgba(28,32,44,0.52) 100%)"
                    : "linear-gradient(90deg, rgba(255,250,246,0.58) 0%, rgba(240,229,255,0.78) 50%, rgba(255,250,246,0.58) 100%)",
                  boxShadow: isDark
                    ? "0 28px 80px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.015)"
                    : "0 28px 70px rgba(150,132,174,0.06), inset 0 0 0 1px rgba(255,255,255,0.12)",
                  transform: `translateY(${scrollShift * -0.35}px)`,
                  transition: "transform 260ms ease-out, background 260ms ease",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isDark
                      ? `radial-gradient(620px 300px at ${bgPointer.x}% ${bgPointer.y}%, rgba(184,150,255,0.28), rgba(120,188,255,0.12) 45%, rgba(60,76,126,0.00) 78%)`
                      : `radial-gradient(600px 280px at ${bgPointer.x}% ${bgPointer.y}%, rgba(176,144,255,0.22), rgba(255,190,216,0.14) 44%, rgba(255,255,255,0.00) 78%)`,
                    transition: "background 220ms ease",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isDark
                      ? "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.05), transparent 32%), radial-gradient(circle at 82% 22%, rgba(184,156,255,0.07), transparent 28%), rgba(11,14,21,0.1)"
                      : "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.8), transparent 30%), radial-gradient(circle at 82% 22%, rgba(255,214,233,0.26), transparent 28%), rgba(255,255,255,0.12)",
                    opacity: 0.62,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backdropFilter: isDark ? "blur(24px)" : "blur(20px)",
                    background: isDark
                      ? "linear-gradient(180deg, rgba(15,18,28,0.18) 0%, rgba(15,18,28,0.08) 42%, rgba(15,18,28,0.14) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 42%, rgba(255,248,245,0.14) 100%)",
                    boxShadow: isDark
                      ? "inset 0 0 0 1px rgba(255,255,255,0.01), inset 0 -44px 120px rgba(8,10,16,0.14)"
                      : "inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 -44px 120px rgba(255,235,243,0.12)",
                  }}
                />
              </div>

              {/* Cards + drag/mouse handler */}
              <div
                className="absolute inset-0"
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                style={{
                  transform: `translate3d(${dragOffset * 0.1}px, ${scrollShift}px, 0)`,
                  transition: isDragging ? "none" : "transform 260ms ease-out",
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "pan-y",
                }}
              >
                {renderCards(currentWorks, "current")}
              </div>

              {isAnimating ? (
                <div className="absolute inset-0">
                  {renderCards(incomingWorks, "incoming")}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            className="z-30 flex h-10 w-10 shrink-0 items-center justify-center justify-self-center rounded-full transition-all hover:scale-110"
            style={{ background: "var(--btn-primary-bg)", color: "var(--primary-foreground)", boxShadow: "var(--btn-primary-shadow)", ...ambientButtonWrap }}
            {...ambientHandlers}
            aria-label={lang === "en" ? "Next page" : "下一页"}
          >
            <span aria-hidden style={{ ...ambientLightLayerStyle, borderRadius: "999px" }} />
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden flex flex-col gap-4">
          {currentWorks.map((work) => (
            <div
              key={`mobile-${work.title}`}
              className="relative cursor-pointer overflow-hidden"
              style={{ borderRadius: "18px", background: work.gradient, minHeight: "220px", border: "1px solid rgba(255,255,255,0.12)" }}
              onClick={() => handleCardClick(work)}
            >
              {work.coverImage ? (
                <div className="absolute inset-0" style={{ backgroundImage: `url(${work.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              ) : null}
              <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "var(--media-bottom-overlay)" }}>
                <div className="text-[11px] text-primary-foreground opacity-65">{work.category} · {work.year}</div>
                <div className="text-primary-foreground font-semibold">{work.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { if (i !== currentPage) startTransition(i, i > currentPage ? "right" : "left"); }}
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
            <span className="text-xs text-muted-foreground">{currentPage + 1} / {pageCount}</span>
            <div className="flex items-center gap-3 md:hidden">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 hover:border-primary"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", ...ambientButtonWrap }}
                {...ambientHandlers}
                aria-label={lang === "en" ? "Previous page" : "上一页"}
              >
                <span aria-hidden style={{ ...ambientLightLayerStyle, borderRadius: "999px" }} />
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                style={{ background: "var(--btn-primary-bg)", color: "var(--primary-foreground)", boxShadow: "var(--btn-primary-shadow)", ...ambientButtonWrap }}
                {...ambientHandlers}
                aria-label={lang === "en" ? "Next page" : "下一页"}
              >
                <span aria-hidden style={{ ...ambientLightLayerStyle, borderRadius: "999px" }} />
                <ChevronRight size={16} />
              </button>
            </div>
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

      <WorkDetailModal work={detailWork} onClose={() => setDetailWork(null)} worksNavState={getNavState()} />
    </>
  );
};

// ─── Works section ────────────────────────────────────────────────────────────

const Works = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const CATEGORIES = siteContent.works.categories;
  const ALL_WORKS = siteContent.works.items;
  const { ref, inView } = useInView();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(lang === "en" ? "All" : "全部");
  const prevLang = useRef(lang);

  // 从 sessionStorage 恢复分类（Index 组件体在渲染前已同步清理/保留数据）
  useLayoutEffect(() => {
    try {
      const saved = sessionStorage.getItem("from-work-category");
      if (saved) setActiveCategory(saved);
    } catch {}
  }, []);

  // 语言切换时重置分类
  useLayoutEffect(() => {
    if (prevLang.current !== lang) {
      prevLang.current = lang;
      setActiveCategory(lang === "en" ? "All" : "全部");
    }
  }, [lang]);

  const allLabel = lang === "en" ? "All" : "全部";
  const filtered = activeCategory === allLabel ? ALL_WORKS : ALL_WORKS.filter((w) => w.category === activeCategory);

  return (
    <section
      id="works"
      ref={ref}
      className="relative section-padding"
      style={{ background: "var(--works-section-bg)", transition: "background 500ms ease" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />

      <div className="container-standard">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span className="text-xs text-primary tracking-[0.3em] uppercase font-medium">Portfolio</span>
            <h2 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-black leading-none tracking-tighter">
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
                background: activeCategory === cat ? "linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(99,102,241,0.95) 100%)" : "var(--card)",
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
                  background: "radial-gradient(240px 120px at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.00) 72%)",
                  mixBlendMode: "screen",
                }}
              />
              {cat}
              <span className="ml-2 text-xs opacity-60">
                {cat === allLabel ? ALL_WORKS.length : ALL_WORKS.filter((w) => w.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {filtered.length > 0
            ? <WorksCarousel key={activeCategory} works={filtered} categoryKey={activeCategory} />
            : <div className="text-center py-20 text-muted-foreground">{siteContent.works.emptyText}</div>}
        </div>

        <div className="flex justify-center mt-16">
          <button
            className="flex items-center gap-3 px-8 py-3.5 rounded-full border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300"
            style={{ borderColor: "var(--border)" }}
          >
            {siteContent.works.loadMoreText}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Works;
