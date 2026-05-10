import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Award,
  Briefcase,
  MapPin,
  Mail,
  Download,
  X,
  ChevronRight,
  ExternalLink,
  Zap,
  Users,
  Star,
  MessageSquare,
} from "lucide-react";
import { useI18n, useSiteContent } from "../i18n";
import { useThemeMode } from "../theme";
import type { ExperienceItem, HonorItem } from "../content/site";

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

// Content is language-dependent; read from `useSiteContent()` inside components.

const parsePeriodStart = (period: string) => {
  // Expected formats like "2025.11 — 至今" or "2024.02 — 2024.08"
  const start = period.split("—")[0]?.trim() ?? "";
  const m = start.match(/^(\d{4})(?:\.(\d{1,2}))?/);
  if (!m) return 0;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : 1;
  return year * 100 + month;
};

const rgbaFromRgb = (rgb: string, alpha: number) => {
  const m = rgb.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/i);
  if (!m) return rgb;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
};

const getStatIcon = (iconName: string, size = 14) => {
  if (iconName === "Zap") return <Zap size={size} />;
  if (iconName === "Users") return <Users size={size} />;
  if (iconName === "Star") return <Star size={size} />;
  return <Zap size={size} />;
};

const ExperienceModal = ({
  exp,
  onClose,
}: {
  exp: ExperienceItem | null;
  onClose: () => void;
}) => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const modalAccent =
    exp?.colorHex === "rgb(232, 255, 71)" ? "rgba(0, 191, 255, 1)" : exp?.colorHex ?? "var(--primary)";
  useEffect(() => {
    if (exp) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [exp]);

  if (!exp) return null;

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center"
      style={{ background: "var(--modal-backdrop)", backdropFilter: "blur(20px)", padding: "var(--space-6)", transition: "background 420ms ease" }}
      onClick={onClose}
    >
      <div
        className="relative w-full overflow-hidden animate-scale-in"
        style={{
          maxWidth: "600px",
          borderRadius: "var(--radius-3xl)",
          background: "var(--card)",
          border: `1px solid ${exp.colorHex}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden"
          style={{
            padding: "var(--space-8)",
            background: `linear-gradient(135deg, ${exp.colorHex}20 0%, transparent 100%)`,
          }}
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: exp.colorHex }} />
          <div className="relative flex items-start justify-between" style={{ gap: "var(--space-4)" }}>
            <div className="flex items-center" style={{ gap: "var(--space-4)" }}>
              <div
                className="flex items-center justify-center text-3xl flex-shrink-0"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius-xl)",
                  background: `${exp.colorHex}20`,
                }}
              >
                {exp.emoji}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <h3 className="font-black text-foreground" style={{ fontSize: "var(--text-xl)" }}>
                  {exp.company}
                </h3>
                <p className="font-medium" style={{ fontSize: "var(--text-sm)", color: modalAccent }}>
                  {exp.role}
                </p>
                <div className="flex items-center text-muted-foreground" style={{ gap: "var(--space-3)", fontSize: "var(--text-xs)" }}>
                  <span>{exp.period}</span>
                  <span>·</span>
                  <span className="flex items-center" style={{ gap: "var(--space-1)" }}>
                    <MapPin size={10} />
                    {exp.location}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                background: "var(--surface-2)",
                color: "var(--muted-foreground)",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: "0 var(--space-8) var(--space-8)" }}>
          <div className="flex" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)", marginTop: "var(--space-2)" }}>
            {exp.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex-1 text-center"
                style={{
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-xl)",
                  background: `${exp.colorHex}10`,
                  border: `1px solid ${exp.colorHex}25`,
                }}
              >
                <div className="flex justify-center" style={{ marginBottom: "var(--space-1)", color: modalAccent }}>
                  {getStatIcon(stat.icon)}
                </div>
                <div className="font-black text-foreground" style={{ fontSize: "var(--text-lg)" }}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)", marginTop: "2px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "var(--space-6)" }}>
            <h4 className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
              {lang === "en" ? "My story" : "我的故事"}
            </h4>
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "var(--text-sm)" }}>
              {exp.story}
            </p>
          </div>

          <div
            className="flex items-start"
            style={{
              gap: "var(--space-3)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-xl)",
              background: `${exp.colorHex}10`,
              border: `1px solid ${exp.colorHex}25`,
              marginBottom: "var(--space-5)",
            }}
          >
            <span style={{ fontSize: "18px" }}>🏆</span>
            <div>
              <div className="font-semibold" style={{ fontSize: "var(--text-xs)", color: modalAccent, marginBottom: "var(--space-1)" }}>
                {lang === "en" ? "Key achievement" : "最大成就"}
              </div>
              <p className="text-foreground leading-relaxed" style={{ fontSize: "var(--text-sm)" }}>
                {exp.achievement}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap" style={{ gap: "var(--space-2)" }}>
            {exp.tags.map((tag) => (
              <span
                key={tag}
                className="text-muted-foreground border"
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  borderColor: `${exp.colorHex}40`,
                  background: `${exp.colorHex}08`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HonorModal = ({
  honor,
  onClose,
}: {
  honor: HonorItem | null;
  onClose: () => void;
}) => {
  const { lang } = useI18n();
  useEffect(() => {
    if (honor) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [honor]);

  if (!honor) return null;

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center"
      style={{ background: "var(--modal-backdrop)", backdropFilter: "blur(20px)", padding: "var(--space-6)", transition: "background 420ms ease" }}
      onClick={onClose}
    >
      <div
        className="relative w-full overflow-hidden animate-scale-in"
        style={{
          maxWidth: "720px",
          maxHeight: "88vh",
          width: "min(720px, 92vw)",
          borderRadius: "var(--radius-3xl)",
          background: "var(--card)",
          border: "1px solid rgba(232,255,71,0.25)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden"
          style={{
            padding: "var(--space-8)",
            background: "linear-gradient(135deg, rgba(232,255,71,0.14) 0%, transparent 100%)",
          }}
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: "var(--accent-strong)" }} />
          <div
            className="relative flex items-start justify-between flex-wrap"
            style={{ gap: "var(--space-4)" }}
          >
            <div>
              <div className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)", marginBottom: "6px" }}>
                {lang === "en" ? "Honors" : "荣誉奖项"}
              </div>
              <h3 className="font-black text-foreground" style={{ fontSize: "var(--text-xl)", lineHeight: 1.2 }}>
                {honor.title}
              </h3>
              <div className="text-muted-foreground" style={{ marginTop: "12px", fontSize: "var(--text-xs)", lineHeight: 1.5 }}>
                {honor.year} · <span style={{ color: "var(--accent-strong)" }}>{honor.level}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                background: "var(--surface-2)",
                color: "var(--muted-foreground)",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "var(--space-2) var(--space-8) var(--space-8)",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div style={{ marginTop: "var(--space-6)" }}>
            <h4 className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
              {lang === "en" ? "Details" : "详情"}
            </h4>
            <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
              {(honor.details?.length
                ? honor.details
                : [lang === "en" ? "You can add more details for this honor in `src/content/site.ts`." : "可在 `src/content/site.ts` 的该奖项里补充详情内容。"]
              ).map((line) => (
                <div
                  key={line}
                  className="text-muted-foreground"
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: "var(--leading-relaxed)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    wordBreak: "break-word",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {honor.proofImages?.length ? (
            <div style={{ marginTop: "var(--space-6)" }}>
              <h4 className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
                {lang === "en" ? "Certificate" : "奖状证明"}
              </h4>
              <div className="flex flex-wrap" style={{ gap: "var(--space-3)" }}>
                {honor.proofImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="cursor-pointer overflow-hidden border transition-transform hover:scale-[1.02]"
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      borderRadius: "var(--radius-xl)",
                      background: "var(--surface-1)",
                      borderColor: "var(--border)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                    onClick={() => {
                      const viewer = document.createElement("div");
                      viewer.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;cursor:pointer;";
                      viewer.onclick = () => viewer.remove();
                      const imgEl = document.createElement("img");
                      imgEl.src = img;
                      imgEl.style.cssText = "max-width:92vw;max-height:92vh;border-radius:12px;object-fit:contain;";
                      viewer.appendChild(imgEl);
                      document.body.appendChild(viewer);
                    }}
                  >
                    <img
                      src={img}
                      alt={`${honor.title} certificate ${idx + 1}`}
                      style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {honor.proof?.length ? (
            <div style={{ marginTop: "var(--space-6)" }}>
              <h4 className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
                {lang === "en" ? "Proof" : "证明信息"}
              </h4>
              <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
                {honor.proof.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-start justify-between flex-wrap"
                    style={{
                      gap: "var(--space-3)",
                      fontSize: "var(--text-sm)",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span className="text-muted-foreground" style={{ lineHeight: 1.5 }}>
                      {p.label}
                    </span>
                    <span
                      className="text-foreground"
                      style={{
                        textAlign: "right",
                        lineHeight: 1.5,
                        marginLeft: "auto",
                        maxWidth: "100%",
                        wordBreak: "break-word",
                      }}
                    >
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ExperienceTimelineCard = ({
  exp,
  index,
  inView,
  onClick,
  isLast,
}: {
  exp: ExperienceItem;
  index: number;
  inView: boolean;
  onClick: () => void;
  isLast: boolean;
}) => {
  const { lang } = useI18n();
  const { resolvedTheme } = useThemeMode();
  const [isMobile, setIsMobile] = useState(false);
  const isYellowTheme = exp.colorHex === "rgb(232, 255, 71)";
  const timelineAccent = isYellowTheme ? "rgb(186, 197, 132)" : exp.colorHex;
  const roleAccent = isYellowTheme ? "rgba(0, 170, 255, 1)" : timelineAccent;
  const flipHintAccent = isYellowTheme ? "rgba(0, 145, 255, 1)" : timelineAccent;
  const markerAccent = isYellowTheme ? "rgba(0, 191, 255, 1)" : exp.colorHex;
  const markerBorderAccent = isYellowTheme ? "rgba(31, 199, 255, 1)" : markerAccent;
  const flipCardHeaderBg = isYellowTheme ? "rgba(103, 168, 254, 0.1)" : rgbaFromRgb(exp.colorHex, 0.1);
  const flipCardHeaderBorder = isYellowTheme ? "rgba(51, 167, 255, 0.2)" : rgbaFromRgb(exp.colorHex, 0.2);
  const flipStoryBg = isYellowTheme ? "rgba(71, 133, 255, 0.08)" : rgbaFromRgb(exp.colorHex, 0.08);
  const flipStoryBorder = isYellowTheme ? "rgba(169, 206, 254, 0.2)" : flipCardHeaderBorder;
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const flipBackStyle =
    resolvedTheme === "light"
      ? {
          background: `linear-gradient(135deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.2) 46%, var(--card) 100%)`,
          border: `1px solid rgba(255,255,255,0.2)`,
          boxShadow: `0 16px 42px rgba(0,0,0,0.1)`,
          backdropFilter: "blur(20px) saturate(1.35)",
        }
      : {
          background: `linear-gradient(135deg, ${rgbaFromRgb(timelineAccent, 0.04)} 0%, rgba(255,255,255,0.01) 48%, var(--card) 100%)`,
          border: `1px solid ${rgbaFromRgb(timelineAccent, 0.14)}`,
          boxShadow: "none",
          backdropFilter: "blur(16px) saturate(1.12)",
        };

  const detailsBtnStyle = {
    background:
      resolvedTheme === "light"
        ? "linear-gradient(135deg, rgba(124,58,237,0.92) 0%, rgba(99,102,241,0.92) 100%)"
        : isYellowTheme
          ? "rgba(103, 168, 254, 0.14)"
          : rgbaFromRgb(timelineAccent, 0.14),
    border:
      resolvedTheme === "light"
        ? "1px solid rgba(255,255,255,0.24)"
        : isYellowTheme
          ? "1px solid rgba(51, 167, 255, 0.24)"
          : `1px solid ${rgbaFromRgb(timelineAccent, 0.24)}`,
    color: resolvedTheme === "light" ? "rgb(255,255,255)" : "var(--foreground)",
    backdropFilter: "blur(10px)",
    boxShadow: resolvedTheme === "light" ? "0 8px 18px rgba(99,102,241,0.24)" : "none",
  };

  return (
    <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${index * 0.15}s` }}>
      <div className="flex items-start" style={{ gap: "var(--space-6)" }}>
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: "96px" }}>
          <div
            className="flex items-center justify-center z-10 transition-all duration-300"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-full)",
              background: flipped ? markerAccent : "transparent",
              border: `2px solid ${markerBorderAccent}`,
              transform: hovered ? "scale(1.1)" : "scale(1)",
              boxShadow: hovered ? `0 0 20px ${rgbaFromRgb(markerBorderAccent, 0.26)}` : "none",
              fontSize: "18px",
            }}
          >
            {flipped ? <span style={{ color: "rgb(0,0,0)", fontSize: "var(--text-xs)" }}>★</span> : <span>{exp.emoji}</span>}
          </div>
          {!isLast && (
            <div
              className="w-px"
              style={{
                minHeight: "48px",
                flex: 1,
                marginTop: "var(--space-2)",
                background: `linear-gradient(to bottom, ${rgbaFromRgb(timelineAccent, 0.5)}, transparent)`,
              }}
            />
          )}
        </div>

        <div
          className="flex-1 cursor-pointer"
          style={{ perspective: isMobile ? "none" : "1000px", marginBottom: "var(--space-6)" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => {
            if (isMobile) {
              onClick();
              return;
            }
            try {
              window.dispatchEvent(new CustomEvent("sfx", { detail: { kind: "flip" } }));
            } catch {
              // ignore
            }
            setFlipped((f) => !f);
          }}
        >
          <div
            className="relative w-full transition-all duration-500"
            style={{
              transformStyle: isMobile ? "flat" : "preserve-3d",
              transform: isMobile ? "none" : flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "180px",
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                background: "var(--card)",
                borderRadius: "var(--radius-2xl)",
                padding: "var(--space-6)",
                border: `1px solid ${hovered ? `${exp.colorHex}50` : "var(--border)"}`,
                boxShadow: hovered ? `0 8px 40px ${exp.colorHex}15` : "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
                height: "180px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: markerBorderAccent, borderRadius: "4px 0 0 4px" }} />
              <div className="flex items-start justify-between" style={{ gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
                  <h4 className="font-bold text-foreground" style={{ fontSize: "var(--text-md)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {exp.company}
                  </h4>
                  <p className="font-medium" style={{ fontSize: "var(--text-sm)", color: roleAccent, lineHeight: 1.2 }}>
                    {exp.role}
                  </p>
                </div>
                <div className="text-right flex-shrink-0" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div className="text-foreground" style={{ fontSize: "var(--text-xs)", letterSpacing: "0.04em", opacity: resolvedTheme === "dark" ? 0.9 : 0.72 }}>
                    {exp.period.replace(/\s+/g, " ")}
                  </div>
                  <div className="flex items-center justify-end text-foreground" style={{ gap: "var(--space-1)", fontSize: "var(--text-xs)", opacity: resolvedTheme === "dark" ? 0.9 : 0.72 }}>
                    <MapPin size={10} /> {exp.location}
                  </div>
                </div>
              </div>

              <p className="text-foreground leading-relaxed" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)", flex: 1, overflow: "hidden", opacity: resolvedTheme === "dark" ? 0.92 : 0.8 }}>
                {exp.desc}
              </p>

              <div className="flex items-center justify-between" style={{ gap: "var(--space-3)" }}>
                <div className="flex flex-wrap" style={{ gap: "var(--space-2)" }}>
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-muted-foreground border border-border"
                      style={{ fontSize: "var(--text-xs)", padding: "3px 10px", borderRadius: "var(--radius-full)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center flex-shrink-0" style={{ gap: "var(--space-1)", fontSize: "var(--text-xs)", color: flipHintAccent }}>
                  {lang === "en" ? "Flip for story" : "翻转查看故事"} <ChevronRight size={12} />
                </div>
              </div>
            </div>

            {!isMobile ? (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderRadius: "var(--radius-2xl)",
                  padding: "var(--space-6)",
                  ...flipBackStyle,
                  height: "180px",
                }}
              >
              <div
                className="flex items-center justify-between"
                style={{
                  marginBottom: "var(--space-4)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-lg)",
                  background: flipCardHeaderBg,
                  border: `1px solid ${flipCardHeaderBorder}`,
                }}
              >
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "20px" }}>{exp.emoji}</span>
                  <h4 className="font-bold text-foreground" style={{ fontSize: "var(--text-base)" }}>
                    {exp.company}
                  </h4>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="flex items-center font-medium transition-all hover:scale-105"
                  style={{
                    gap: "var(--space-1)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    ...detailsBtnStyle,
                  }}
                >
                  <ExternalLink size={10} /> {lang === "en" ? "Details" : "查看详情"}
                </button>
              </div>
              <div
                className="text-foreground leading-relaxed"
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  marginBottom: "var(--space-3)",
                  fontSize: "var(--text-xs)",
                  opacity: resolvedTheme === "dark" ? 0.96 : 0.86,
                  background:
                    resolvedTheme === "light"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.22) 100%)"
                      : flipStoryBg,
                  border:
                    resolvedTheme === "light"
                      ? "1px solid rgba(255,255,255,0.28)"
                      : `1px solid ${flipStoryBorder}`,
                }}
              >
                <span style={{ fontSize: "14px" }}>💬 </span>
                {exp.story.slice(0, 100)}...
              </div>
              <div
                className="flex items-center"
                style={{
                  gap: "var(--space-2)",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "var(--text-xs)",
                  background:
                    resolvedTheme === "light"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.24) 100%)"
                      : flipCardHeaderBg,
                  border:
                    resolvedTheme === "light"
                      ? "1px solid rgba(255,255,255,0.3)"
                      : `1px solid ${flipCardHeaderBorder}`,
                }}
              >
                <span>🏆</span>
                <span className="text-foreground" style={{ opacity: 0.9 }}>
                  {exp.achievement}
                </span>
              </div>
              <div className="text-center text-foreground" style={{ marginTop: "var(--space-3)", fontSize: "var(--text-xs)", opacity: resolvedTheme === "dark" ? 0.84 : 0.66 }}>
                {lang === "en" ? "Click to flip back · Click “Details” for more" : "点击再次翻转 · 点击「查看详情」了解更多"}
              </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const EDUCATION = siteContent.about.education;
  const HONORS = siteContent.about.honors;
  const EXPERIENCE = siteContent.about.experience;
  const { ref: eduRef, inView: eduInView } = useInView();
  const { ref: honRef, inView: honInView } = useInView();
  const { ref: expRef, inView: expInView } = useInView();
  const [modalExp, setModalExp] = useState<ExperienceItem | null>(null);
  const [modalHonor, setModalHonor] = useState<HonorItem | null>(null);
  const avatarCandidates = [siteContent.about.profile.avatarImage, "/avatar-profile.png", "/img/team-collage.png"].filter(Boolean);
  const [avatarTryIndex, setAvatarTryIndex] = useState(0);
  const avatarSrc = avatarCandidates[Math.min(avatarTryIndex, avatarCandidates.length - 1)];

  useEffect(() => {
    setAvatarTryIndex(0);
  }, [lang, siteContent.about.profile.avatarImage]);

  const sortedExperience = [...EXPERIENCE].sort((a, b) => parsePeriodStart(b.period) - parsePeriodStart(a.period));

  return (
    <section id="about" className="relative overflow-hidden" style={{ background: "var(--background)", paddingTop: "var(--space-24)", paddingBottom: "var(--space-24)" }}>
      <div style={{ maxWidth: "var(--max-w-content)", margin: "0 auto", paddingLeft: "var(--space-12)", paddingRight: "var(--space-12)" }}>
        <div className="flex items-end justify-between" style={{ marginBottom: "var(--space-12)" }}>
          <div>
            <p className="label-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              About Me
            </p>
            <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {lang === "en" ? (
                <>
                  <span className="text-foreground">About</span>
                  <span className="text-gradient"> Me</span>
                </>
              ) : (
                <>
                  <span className="text-foreground">关于</span>
                  <span className="text-gradient"> 我</span>
                </>
              )}
            </h2>
          </div>
          <p className="text-muted-foreground text-right leading-relaxed hidden md:block" style={{ maxWidth: "300px", fontSize: "var(--text-sm)" }}>
            {siteContent.about.headerRightLines[0]}
            <br />
            {siteContent.about.headerRightLines[1]}
          </p>
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "var(--radius-3xl)",
            padding: "var(--space-10)",
            border: "1px solid rgba(168,85,247,0.2)",
            background: "var(--card)",
            marginBottom: "var(--space-16)",
          }}
        >
          <div className="absolute -top-20 -right-20 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ width: "320px", height: "320px", background: "var(--primary)" }} />
          <div className="relative z-10 flex flex-col md:flex-row items-start" style={{ gap: "var(--space-10)" }}>
            <div className="flex-shrink-0">
              <div
                className="relative overflow-hidden"
                style={{
                  width: "112px",
                  height: "112px",
                  borderRadius: "var(--radius-2xl)",
                  background: "linear-gradient(135deg, var(--primary) 0%, rgb(192,132,252) 50%, var(--accent) 100%)",
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={siteContent.about.profile.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setAvatarTryIndex((v) => Math.min(v + 1, avatarCandidates.length))}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-black text-primary-foreground" style={{ fontSize: "36px" }}>
                    {siteContent.about.profile.avatarChar}
                  </div>
                )}
              </div>
              <div className="flex items-center" style={{ gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                  {siteContent.about.profile.statusText}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground" style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-1)" }}>
                {siteContent.about.profile.name}
              </h3>
              <p className="text-primary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                {siteContent.about.profile.title}
              </p>
              <p
                className="text-muted-foreground leading-relaxed"
                style={{
                  fontSize: "clamp(14px, 0.95vw, 16px)",
                  maxWidth: "min(720px, 100%)",
                  marginBottom: "var(--space-6)",
                }}
              >
                {siteContent.about.profile.introParagraphs.join("")}
              </p>
              <div className="flex flex-wrap text-muted-foreground" style={{ gap: "var(--space-5)", fontSize: "var(--text-sm)" }}>
                <span className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <MapPin size={14} className="text-primary" /> {siteContent.about.profile.locationText}
                </span>
                <span className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <Mail size={14} className="text-primary" /> {siteContent.about.profile.email}
                </span>
                {siteContent.about.profile.wechat ? (
                  <span className="flex items-center" style={{ gap: "var(--space-2)" }}>
                    <MessageSquare size={14} className="text-primary" /> {siteContent.about.profile.wechat}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex-shrink-0">
              <a
                href="/resume.pdf"
                download="谭凯洵简历.pdf"
                className="flex items-center border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300"
                style={{ gap: "var(--space-2)", padding: "10px 20px", borderRadius: "var(--radius-full)", fontSize: "var(--text-sm)" }}
              >
                <Download size={14} />
                {siteContent.about.profile.resumeButtonLabel}
              </a>
            </div>
          </div>
        </div>

        <div id="education" ref={eduRef} style={{ marginBottom: "var(--space-16)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: "40px", height: "40px", borderRadius: "var(--radius-lg)", background: "rgba(168,85,247,0.12)" }}>
              <GraduationCap size={18} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground" style={{ fontSize: "var(--text-xl)" }}>
              {lang === "en" ? "Education" : "教育经历"}
            </h3>
            <span className="flex-1 h-px ml-2" style={{ background: "var(--border)" }} />
          </div>
          <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-5)" }}>
            {EDUCATION.map((edu, i) => (
              <div
                key={edu.school}
                className={`flex-1 tilt-card border transition-all duration-700 ${eduInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius-2xl)",
                  padding: "var(--space-8)",
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <div className="flex items-start justify-between" style={{ gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
                    <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
                      <span
                        className="inline-flex font-semibold"
                        style={{
                          padding: "5px 12px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(168,85,247,0.12)",
                          border: "1px solid rgba(168,85,247,0.18)",
                          color: "var(--primary)",
                          fontSize: "var(--text-xs)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {edu.tag}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)", opacity: 0.8 }}>
                        {edu.period}
                      </span>
                    </div>
                    <h4
                      className="font-black text-foreground"
                      style={{
                        fontSize: "clamp(16px, 1.05vw, 20px)",
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={edu.school}
                    >
                      {edu.school}
                    </h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center" style={{ gap: "10px", marginBottom: "var(--space-4)" }}>
                  <span className="text-primary" style={{ fontSize: "var(--text-sm)", fontWeight: 650 }}>
                    {edu.degree}
                  </span>
                  {edu.gpa ? (
                    <span
                      className="text-muted-foreground"
                      style={{
                        fontSize: "var(--text-xs)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        border: "1px solid rgba(255,107,157,0.22)",
                        background: "rgba(255,107,157,0.06)",
                        color: "rgba(255,107,157,0.92)",
                      }}
                    >
                      {edu.gpa}
                    </span>
                  ) : null}
                </div>

                <div className="h-px" style={{ background: "var(--border)", marginBottom: "var(--space-4)" }} />

                <p
                  className="text-muted-foreground"
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: "var(--leading-relaxed)",
                    opacity: 0.92,
                    textWrap: "pretty",
                  }}
                >
                  {edu.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div id="honors" ref={honRef} style={{ marginBottom: "var(--space-16)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: "40px", height: "40px", borderRadius: "var(--radius-lg)", background: "var(--accent-soft)" }}>
              <Award size={18} style={{ color: "var(--accent-strong)" }} />
            </div>
            <h3 className="font-bold text-foreground" style={{ fontSize: "var(--text-xl)" }}>
              {lang === "en" ? "Honors" : "荣誉奖项"}
            </h3>
            <span className="flex-1 h-px ml-2" style={{ background: "var(--border)" }} />
          </div>
          <div className="flex flex-wrap" style={{ gap: "var(--space-3)" }}>
            {HONORS.map((h, i) => (
              <button
                key={h.title}
                type="button"
                onClick={() => setModalHonor(h)}
                data-sfx-off="true"
                className={`group flex items-center border cursor-pointer hover:border-accent transition-all duration-700 hover:-translate-y-0.5 hover:scale-[1.01] ${honInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  gap: "var(--space-4)",
                  padding: "var(--space-4) var(--space-5)",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  transitionDelay: `${i * 0.08}s`,
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(340px 220px at 30% 30%, rgba(168,85,247,0.18), rgba(99,102,241,0.10) 40%, rgba(0,0,0,0) 72%)",
                    mixBlendMode: "screen",
                  }}
                />
                <div className="flex items-center justify-center flex-shrink-0 font-bold group-hover:scale-110 transition-transform duration-300" style={{ width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: "var(--accent-soft)", color: "var(--accent-strong)", fontSize: "var(--text-sm)" }}>
                  {i + 1}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div className="font-semibold text-foreground" style={{ fontSize: "var(--text-sm)" }}>
                    {h.title}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                    {h.year} · <span style={{ color: "var(--accent-strong)" }}>{h.level}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div id="experience" ref={expRef}>
          <div className="flex items-center" style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: "40px", height: "40px", borderRadius: "var(--radius-lg)", background: "rgba(0,212,170,0.12)" }}>
              <Briefcase size={18} style={{ color: "rgb(0, 212, 170)" }} />
            </div>
            <h3 className="font-bold text-foreground" style={{ fontSize: "var(--text-xl)" }}>
              {lang === "en" ? "Experience" : "实习经历"}
            </h3>
            <span className="flex-1 h-px ml-2" style={{ background: "var(--border)" }} />
          </div>

          <div className="flex items-center w-fit" style={{ gap: "var(--space-2)", marginBottom: "var(--space-6)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)", background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", color: "rgb(0, 212, 170)", fontSize: "var(--text-xs)" }}>
            <span>👆</span>
            <span>{siteContent.about.experienceHint}</span>
          </div>

          <div>
            <div className="relative">
              <div
                className="absolute"
                style={{
                  left: "24px",
                  top: "4px",
                  bottom: "8px",
                  width: "2px",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(168,85,247,0.55) 14%, rgba(0,212,170,0.45) 52%, rgba(232,255,71,0.35) 86%, transparent 100%)",
                  opacity: 0.9,
                  pointerEvents: "none",
                }}
              />
              {sortedExperience.map((exp, i) => (
                <ExperienceTimelineCard
                  key={exp.company}
                  exp={exp}
                  index={i}
                  inView={expInView}
                  onClick={() => setModalExp(exp)}
                  isLast={i === sortedExperience.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ExperienceModal exp={modalExp} onClose={() => setModalExp(null)} />
      <HonorModal honor={modalHonor} onClose={() => setModalHonor(null)} />
    </section>
  );
};

export default About;

