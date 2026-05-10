import { useEffect, useRef, useState } from "react";
import { Camera, Heart, Coffee, Music, Plane, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import LifeQuizModal from "./LifeQuizModal";
import { useI18n, useSiteContent } from "../i18n";

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

const getCategoryIcon = (iconName: string, size = 13) => {
  if (iconName === "Camera") return <Camera size={size} />;
  if (iconName === "Coffee") return <Coffee size={size} />;
  if (iconName === "Music") return <Music size={size} />;
  if (iconName === "Plane") return <Plane size={size} />;
  if (iconName === "BookOpen") return <BookOpen size={size} />;
  if (iconName === "Heart") return <Heart size={size} />;
  return <Camera size={size} />;
};

const Life = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const LIFE_CATEGORIES = siteContent.life.categories;
  const LIFE_PHOTOS = siteContent.life.photos;
  const { ref, inView } = useInView();
  const [locked, setLocked] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filterCategory, setFilterCategory] = useState(lang === "en" ? "All" : "全部");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilterCategory(lang === "en" ? "All" : "全部");
    setCurrentSlide(0);
  }, [lang]);

  const LIFE_SLOGANS: Array<{ emoji: string; text: string }> =
    lang === "en"
      ? [
          { emoji: "🫣", text: "Sure you want to open this?" },
          { emoji: "🔍", text: "You might need to know me first" },
          { emoji: "🗝️", text: "Unlock by quiz—entry required" },
        ]
      : [
          { emoji: "🫣", text: "你确定要打开看吗？" },
          { emoji: "🔍", text: "这需要对我有一点了解噢" },
          { emoji: "🗝️", text: "答题解锁，才算入场" },
        ];

  const allLabel = lang === "en" ? "All" : "全部";
  const filteredPhotos = filterCategory === allLabel ? LIFE_PHOTOS : LIFE_PHOTOS.filter((p) => p.category === filterCategory);

  const playTone = (freq: number, dur = 0.2) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      console.log("audio err", e);
    }
  };

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });

  return (
    <section id="life" ref={ref} className="relative overflow-hidden" style={{ background: "var(--life-section-bg)", paddingTop: "var(--space-16)", paddingBottom: "var(--space-16)", transition: "background 420ms ease" }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgb(255, 107, 157), transparent)" }} />

      <div className="container-standard">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between" style={{ marginBottom: "var(--space-8)", gap: "var(--space-4)" }}>
          <div className="flex items-center flex-wrap" style={{ gap: "var(--space-5)" }}>
            <div>
              <p className="tracking-widest uppercase font-semibold" style={{ fontSize: "var(--text-xs)", color: "rgb(255, 107, 157)", marginBottom: "var(--space-2)" }}>
                Personal Life
              </p>
              <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1 }}>
                {lang === "en" ? (
                  <>
                    <span className="text-foreground">Personal</span>
                    <span className="ml-2 text-gradient">
                      Life
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-foreground">个人</span>
                    <span className="ml-2 text-gradient">
                      生活
                    </span>
                  </>
                )}
              </h2>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--space-2)" }}>
              {LIFE_SLOGANS.map((s) => (
                <div
                  key={s.text}
                  className="flex items-center border border-border"
                  style={{
                    gap: "var(--space-2)",
                    padding: "5px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    background: "var(--card)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <span>{s.emoji}</span>
                  <span className="font-medium">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed hidden md:block text-right" style={{ maxWidth: "180px", fontSize: "var(--text-xs)" }}>
            {siteContent.life.headerDesc}
          </p>
        </div>

        {locked && (
          <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="relative overflow-hidden" style={{ borderRadius: "var(--radius-2xl)" }}>
              <div
                className="flex pointer-events-none select-none opacity-30 blur-sm items-center justify-center"
                style={{ gap: "var(--space-3)", minHeight: "240px", padding: "var(--space-6)" }}
              >
                {LIFE_PHOTOS.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl"
                    style={{ width: "140px", height: "140px", background: p.gradient }}
                  >
                    {p.emoji}
                  </div>
                ))}
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center flex-col text-center"
                style={{
                  background: "var(--overlay-strong)",
                  gap: "var(--space-3)",
                  padding: "var(--space-6)",
                  transition: "background 420ms ease",
                }}
              >
                <div className="font-medium" style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", background: "rgba(255,107,157,0.12)", color: "rgb(255, 107, 157)", border: "1px solid rgba(255,107,157,0.25)" }}>
                  {siteContent.life.locked.title}
                </div>
                <button onClick={() => setShowQuiz(true)} className="flex items-center font-bold transition-all duration-300 hover:scale-105" style={{ gap: "var(--space-3)", padding: "var(--space-4) var(--space-8)", borderRadius: "var(--radius-xl)", fontSize: "var(--text-sm)", background: "var(--btn-primary-bg)", boxShadow: "var(--btn-primary-shadow)", color: "rgb(255, 255, 255)" }}>
                  <span>🎮</span>
                  {siteContent.life.locked.button}
                  <span>→</span>
                </button>
                <p className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                  {siteContent.life.locked.hint(LIFE_PHOTOS.length)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!locked && (
          <div className="animate-fade-in-up">
            <div className="flex items-center border" style={{ gap: "var(--space-3)", padding: "var(--space-3) var(--space-5)", borderRadius: "var(--radius-xl)", borderColor: "rgba(0,212,170,0.2)", background: "rgba(0,212,170,0.06)", color: "rgb(0, 212, 170)", fontSize: "var(--text-sm)", marginBottom: "var(--space-5)" }}>
              <span>{siteContent.life.unlocked.banner(LIFE_PHOTOS.length).left}</span>
              <span className="font-medium">{siteContent.life.unlocked.banner(LIFE_PHOTOS.length).text}</span>
              <span className="ml-auto text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                {siteContent.life.unlocked.banner(LIFE_PHOTOS.length).right}
              </span>
            </div>

            <div className="flex flex-wrap items-center" style={{ gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
              <button
                onClick={() => {
                  setFilterCategory(allLabel);
                  setCurrentSlide(0);
                }}
                className="font-medium transition-all"
                style={{
                  padding: "5px 16px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  background: filterCategory === allLabel ? "var(--btn-primary-bg)" : "var(--card)",
                  color: filterCategory === allLabel ? "rgb(255,255,255)" : "var(--muted-foreground)",
                  border: filterCategory === allLabel ? "none" : "1px solid var(--border)",
                }}
              >
                {allLabel} <span className="opacity-60 ml-1">{LIFE_PHOTOS.length}</span>
              </button>
              {LIFE_CATEGORIES.map((cat) => (
                <button key={cat.label} onClick={() => { setFilterCategory(cat.label); setCurrentSlide(0); }} className="flex items-center font-medium transition-all" style={{ gap: "var(--space-1)", padding: "5px 16px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", background: "var(--card)", color: filterCategory === cat.label ? cat.color : "var(--muted-foreground)", border: filterCategory === cat.label ? `1px solid ${cat.color}` : "1px solid var(--border)" }}>
                  {getCategoryIcon(cat.icon)}
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative" style={{ marginBottom: "var(--space-4)" }}>
              <button onClick={scrollLeft} className="absolute z-10 flex items-center justify-center top-1/2 -translate-y-1/2 transition-all hover:scale-110" style={{ left: "-16px", width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <ChevronLeft size={14} />
              </button>
              <div ref={scrollRef} className="flex overflow-x-auto" style={{ gap: "var(--space-3)", paddingBottom: "var(--space-2)", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {filteredPhotos.map((photo, i) => (
                  <div key={photo.id} onClick={() => setCurrentSlide(i)} className="group relative flex-shrink-0 overflow-hidden cursor-pointer" style={{ width: currentSlide === i ? "280px" : "160px", height: "170px", borderRadius: "var(--radius-xl)", background: photo.gradient, border: currentSlide === i ? "2px solid rgba(168,85,247,0.6)" : "2px solid transparent", transition: "width 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s" }}>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">{photo.emoji}</div>
                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-300" style={{ padding: "var(--space-3)", background: "var(--media-bottom-overlay)", transition: "background 420ms ease" }}>
                      <div className="font-bold text-primary-foreground truncate" style={{ fontSize: "var(--text-xs)" }}>
                        {photo.title}
                      </div>
                      {currentSlide === i && (
                        <div className="text-primary-foreground opacity-70 leading-relaxed" style={{ fontSize: "var(--text-xs)", marginTop: "2px" }}>
                          {photo.desc}
                        </div>
                      )}
                    </div>
                    {currentSlide === i && (
                      <div className="absolute" style={{ top: "var(--space-2)", right: "var(--space-2)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", background: "rgba(168,85,247,0.7)", color: "rgb(255, 255, 255)" }}>
                        {photo.tag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={scrollRight} className="absolute z-10 flex items-center justify-center top-1/2 -translate-y-1/2 transition-all hover:scale-110" style={{ right: "-16px", width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <LifeQuizModal
        visible={showQuiz}
        onClose={() => setShowQuiz(false)}
        onPass={() => {
          setShowQuiz(false);
          setLocked(false);
          playTone(523, 0.1);
          setTimeout(() => playTone(659, 0.1), 120);
          setTimeout(() => playTone(784, 0.15), 240);
        }}
      />
    </section>
  );
};

export default Life;

