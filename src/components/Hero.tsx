import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, Heart, Sparkles } from "lucide-react";
import { useI18n } from "../i18n";
import { useSiteContent } from "../i18n";
import { useThemeMode } from "../theme";

const Hero = () => {
  const { lang } = useI18n();
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";
  const siteContent = useSiteContent();
  const WORDS = siteContent.hero.rotatingWords;
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(128);
  const blobsRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const word = WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting && displayed === word) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setWordIndex((i) => (i + 1) % WORDS.length);
    } else {
      timeout = setTimeout(() => {
        setDisplayed(isDeleting ? word.slice(0, displayed.length - 1) : word.slice(0, displayed.length + 1));
      }, isDeleting ? 60 : 100);
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, WORDS]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    try {
      const storedLiked = localStorage.getItem("portfolio_liked") === "1";
      const storedCount = Number(localStorage.getItem("portfolio_like_count") ?? "");
      setLiked(storedLiked);
      if (Number.isFinite(storedCount) && storedCount > 0) setLikeCount(storedCount);
    } catch {
      // ignore
    }
  }, []);

  // 粒子背景已移除（只保留3D人物模型和泡泡椅）

  // CSS网格鼠标交互已移除（只保留3D人物模型和泡泡椅）

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    mousePosRef.current = { x, y };
    if (blobsRef.current) {
      const children = blobsRef.current.children as HTMLCollectionOf<HTMLElement>;
      if (children[0]) children[0].style.transform = `translate(${x * -40}px, ${y * -30}px)`;
      if (children[1]) children[1].style.transform = `translate(${x * 30}px, ${y * 25}px)`;
      if (children[2]) children[2].style.transform = `translate(${x * -20}px, ${y * 35}px)`;
    }
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const toggleLike = () => {
    setLiked((v) => {
      const next = !v;
      setLikeCount((c) => {
        const nextCount = Math.max(0, c + (next ? 1 : -1));
        try {
          localStorage.setItem("portfolio_like_count", String(nextCount));
        } catch {
          // ignore
        }
        return nextCount;
      });
      try {
        localStorage.setItem("portfolio_liked", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section
      id="hero-section"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--hero-bg)", transition: "background 500ms ease" }}
    >
      {/* 流动渐变色块 */}
      <div ref={blobsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full blur-[140px] animate-blob-1 transition-transform duration-700 ease-out"
          style={{
            width: "50vw",
            height: "50vw",
            top: "-10%",
            left: "-5%",
            background: isDark
              ? "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(124,58,237,0.06) 60%, transparent 100%)"
              : "radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(124,58,237,0.04) 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[120px] animate-blob-2 transition-transform duration-700 ease-out"
          style={{
            width: "40vw",
            height: "40vw",
            top: "40%",
            right: "-10%",
            background: isDark
              ? "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.05) 60%, transparent 100%)"
              : "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(79,70,229,0.03) 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[100px] animate-blob-3 transition-transform duration-700 ease-out"
          style={{
            width: "35vw",
            height: "35vw",
            bottom: "-5%",
            left: "30%",
            background: isDark
              ? "radial-gradient(circle, rgba(232,255,71,0.06) 0%, rgba(192,132,252,0.08) 50%, transparent 100%)"
              : "radial-gradient(circle, rgba(232,255,71,0.04) 0%, rgba(192,132,252,0.06) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* 粒子背景已移除 */}

      {/* 光晕背景已移除 */}

      {/* 正方形网格背景已移除 */}

      <div
        className={`relative z-10 w-full transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        style={{
          maxWidth: "var(--max-w-content)",
          margin: "0 auto",
          paddingLeft: "var(--space-12)",
          paddingRight: "var(--space-12)",
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between" style={{ gap: "var(--space-14)" }}>
          <div className="flex flex-col items-start" style={{ maxWidth: "820px" }}>
            <div
              className="flex items-center border"
              style={{
                gap: "var(--space-2)",
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                marginBottom: "var(--space-8)",
                background: "var(--surface-1)",
                borderColor: "rgba(168,85,247,0.3)",
              }}
            >
              <Sparkles size={13} className="text-primary" />
              <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)" }}>
                {siteContent.hero.badge}
              </span>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>

            <h1 className="font-black leading-none tracking-tighter" style={{ fontSize: "clamp(56px, 8vw, 88px)", marginBottom: "var(--space-3)" }}>
              <span className="text-foreground">{siteContent.hero.firstName}</span>
              <span className="text-gradient">{siteContent.hero.middleNameGradient}</span>
              <span
                className="block"
                style={{
                  fontSize: "clamp(44px, 6.5vw, 72px)",
                  marginTop: "var(--space-2)",
                  WebkitTextStroke: "1px rgba(168,85,247,0.5)",
                  color: "transparent",
                  letterSpacing: "-0.04em",
                }}
              >
                {siteContent.hero.lastName}
              </span>
            </h1>

            <div className="flex items-center" style={{ gap: "var(--space-3)", marginTop: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              <span className="w-8 h-px flex-shrink-0" style={{ background: "var(--accent)" }} />
              <span className="font-light text-muted-foreground tracking-wide" style={{ fontSize: "var(--text-lg)" }}>
                <span className="font-medium" style={{ color: "var(--accent-strong)" }}>{displayed}</span>
                <span className="animate-blink text-primary ml-0.5">|</span>
              </span>
            </div>

            <p
              className="text-muted-foreground leading-relaxed"
              style={{
                fontSize: "var(--text-md)",
                maxWidth: "520px",
                marginBottom: "var(--space-10)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              {siteContent.hero.descriptionLines[0]}
              <br />
              {siteContent.hero.descriptionLines[1]}
            </p>

            <div className="flex items-center flex-wrap" style={{ gap: "var(--space-4)" }}>
              <a
                href="#works"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex items-center font-medium transition-all duration-300 hover:shadow-glow hover:scale-105"
                style={{
                  gap: "var(--space-3)",
                  padding: "12px 28px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-sm)",
                  background: "var(--btn-primary-bg)",
                  color: "var(--primary-foreground)",
                  boxShadow: "var(--btn-primary-shadow)",
                }}
              >
                {siteContent.hero.ctas.primary}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
                  style={{ background: "rgba(255,255,255,0.2)", fontSize: "12px" }}
                >
                  →
                </span>
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300"
                style={{
                  padding: "12px 28px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {siteContent.hero.ctas.secondary}
              </a>
              <div className="2xl:hidden flex items-center" style={{ gap: "var(--space-3)" }}>
                <button
                  type="button"
                  onClick={toggleLike}
                  className="flex items-center justify-center border transition-all hover:scale-105 active:scale-100"
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "var(--radius-lg)",
                    background: liked ? "rgba(255,107,157,0.16)" : "var(--glass-soft)",
                    borderColor: liked ? "rgba(255,107,157,0.45)" : "rgba(255,255,255,0.10)",
                  }}
                  title={lang === "en" ? (liked ? "Liked" : "Like this site") : liked ? "已点赞收藏" : "点赞收藏这个网站"}
                >
                  <Heart
                    size={18}
                    style={{
                      color: liked ? "rgb(255,107,157)" : "var(--muted-foreground)",
                      fill: liked ? "rgb(255,107,157)" : "transparent",
                    }}
                  />
                </button>
                <div className="flex flex-col" style={{ gap: "2px" }}>
                  <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                    {lang === "en" ? "Like me" : "喜欢我"}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {likeCount} likes
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap border-t border-border" style={{ gap: "var(--space-10)", marginTop: "var(--space-12)", paddingTop: "var(--space-8)" }}>
              {siteContent.hero.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col" style={{ gap: "var(--space-1)" }}>
                  <span
                    className="font-bold"
                    style={{
                      fontSize: "var(--text-2xl)",
                      background: "var(--hero-stat-gradient)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      transition: "background 500ms ease",
                    }}
                  >
                    {stat.num}
                  </span>
                  <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)" }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
	      </div>
	    </div>

      <div className="pointer-events-none absolute top-28 left-0 right-0 hidden 2xl:block">
        <div
          className="mx-auto flex justify-end"
          style={{
            maxWidth: "var(--max-w-content)",
            paddingLeft: "var(--space-12)",
            paddingRight: "var(--space-12)",
          }}
        >
          <div className="pointer-events-auto animate-float flex flex-col items-center" style={{ gap: "var(--space-2)", animationDelay: "1s" }}>
            <button
              type="button"
              onClick={toggleLike}
              className="flex items-center justify-center border transition-all hover:scale-110 active:scale-105"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-xl)",
                background: liked ? "rgba(255,107,157,0.16)" : "var(--glass-soft)",
                borderColor: liked ? "rgba(255,107,157,0.45)" : "rgba(255,255,255,0.10)",
                boxShadow: liked ? "0 0 30px rgba(255,107,157,0.20)" : "none",
              }}
              title={lang === "en" ? (liked ? "Liked" : "Like this site") : liked ? "已点赞收藏" : "点赞收藏这个网站"}
            >
              <Heart
                size={24}
                style={{
                  color: liked ? "rgb(255,107,157)" : "var(--muted-foreground)",
                  fill: liked ? "rgb(255,107,157)" : "transparent",
                  transition: "transform 200ms ease, color 200ms ease",
                  transform: liked ? "scale(1.06)" : "scale(1)",
                }}
              />
            </button>
            <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
              {lang === "en" ? "Like me" : "喜欢我"}
            </span>
            <div className="text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {likeCount} likes
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ gap: "var(--space-2)" }}>
        <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)" }}>
          Scroll
        </span>
        <ArrowDown size={16} className="text-muted-foreground scroll-indicator" />
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block" style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}>
        <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)", letterSpacing: "0.3em" }}>
          {siteContent.hero.ctas.side}
        </span>
      </div>
    </section>
  );
};

export default Hero;

