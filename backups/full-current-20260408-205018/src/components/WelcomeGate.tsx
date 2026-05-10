import { useEffect, useRef, useState } from "react";
import { Languages, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "../i18n";

const VISITOR_ENDPOINT = ""; // Optional: set to your backend URL to record visits
const COMPANY_SEARCH_ENDPOINT = ""; // Optional: set company search API, query param: ?q=腾讯

const FALLBACK_COMPANIES = [
  "腾讯",
  "腾讯科技",
  "腾讯音乐",
  "腾讯云",
  "阿里巴巴",
  "阿里云",
  "字节跳动",
  "抖音",
  "百度",
  "美团",
  "京东",
  "小红书",
  "快手",
  "网易",
  "华为",
  "荣耀",
  "OPPO",
  "vivo",
  "小米",
  "B站",
  "拼多多",
  "Shopee",
  "Shein",
];

interface WelcomeGateProps {
  onComplete: (opts?: { playMusic: boolean }) => void;
}

const WelcomeGate = ({ onComplete }: WelcomeGateProps) => {
  const { lang, setLang } = useI18n();
  const [selectedLang, setSelectedLang] = useState<"zh" | "en">(lang);
  const [company, setCompany] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmHovered, setBgmHovered] = useState(false);
  const [vinylPop, setVinylPop] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const chordTimerRef = useRef<number | null>(null);
  const nodesRef = useRef<Array<{ osc: OscillatorNode; gain: GainNode }>>([]);

  useEffect(() => {
    // If we've already shown the gate, do nothing
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("welcome_seen_date") === today) {
        onComplete();
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      setBgmEnabled(localStorage.getItem("bgm_preferred") === "1");
    } catch {
      setBgmEnabled(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master) return;
      if (chordTimerRef.current) {
        window.clearInterval(chordTimerRef.current);
        chordTimerRef.current = null;
      }
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0.0001, now, 0.08);
      nodesRef.current.forEach(({ osc, gain }) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0.0001, now, 0.08);
          osc.stop(now + 0.2);
        } catch {
          // ignore
        }
      });
      nodesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const q = company.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const fromFallback = FALLBACK_COMPANIES.filter((c) => c.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
    setSuggestions(fromFallback);

    if (!COMPANY_SEARCH_ENDPOINT) return;

    const t = window.setTimeout(async () => {
      try {
        const url = new URL(COMPANY_SEARCH_ENDPOINT);
        url.searchParams.set("q", q);
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = await res.json();
        const list: string[] = Array.isArray(data)
          ? data.map((v) => String(v))
          : Array.isArray(data?.items)
            ? data.items.map((v: unknown) => String(v))
            : [];
        const merged = Array.from(new Set([...list, ...fromFallback])).slice(0, 8);
        setSuggestions(merged);
      } catch {
        // ignore search API errors
      }
    }, 180);

    return () => window.clearTimeout(t);
  }, [company]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setLang(selectedLang);

    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem("welcome_seen_date", today);
      localStorage.setItem("bgm_preferred", bgmEnabled ? "1" : "0");
      if (company.trim()) {
        localStorage.setItem("visitor_company", company.trim());
      }
    } catch {
      // ignore storage errors
    }

    if (VISITOR_ENDPOINT) {
      try {
        await fetch(VISITOR_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: company.trim() || null,
            lang: selectedLang,
            path: window.location.pathname + window.location.search,
            referrer: document.referrer || null,
            ts: new Date().toISOString(),
          }),
        });
      } catch {
        // silently ignore network errors
      }
    }

    setSubmitting(false);
    stopPreviewAmbient();
    onComplete({ playMusic: bgmEnabled });
  };

  const title = selectedLang === "en" ? "Welcome to my portfolio" : "欢迎来到我的作品集";
  const subtitle =
    selectedLang === "en"
      ? "Choose your language, and optionally tell me where you're from."
      : "请选择浏览语言，并可选填写你来自哪家公司。";
  const companyLabel = selectedLang === "en" ? "Where are you from? (company / team / recruiter, optional)" : "你来自哪家公司？（公司 / 团队 / 猎头，可选）";
  const placeholder =
    selectedLang === "en" ? "e.g. XX Company / Recruiter / Personal" : "例如：XX 公司 / 猎头 / 个人";
  const btnText = selectedLang === "en" ? "Enter site" : "进入网站";
  const bgmLabel = selectedLang === "en" ? "Enable background music on enter" : "进入网站后开启背景音乐";
  const bgmHint = selectedLang === "en" ? "You can pause/resume anytime after entering." : "进入后也可以随时暂停或继续播放。";

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (!masterGainRef.current) {
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      masterGainRef.current = master;
    }
    return ctx;
  };

  const stopPreviewAmbient = () => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    if (chordTimerRef.current) {
      window.clearInterval(chordTimerRef.current);
      chordTimerRef.current = null;
    }
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0.0001, now, 0.08);
    nodesRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0.0001, now, 0.08);
        osc.stop(now + 0.2);
      } catch {
        // ignore
      }
    });
    nodesRef.current = [];
  };

  const startPreviewAmbient = async () => {
    const ctx = ensureCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const master = masterGainRef.current!;
    stopPreviewAmbient();

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 920;
    filter.Q.value = 0.8;
    filter.connect(master);

    const buildChord = (baseHz: number, ratios: number[]) => {
      nodesRef.current.forEach(({ osc }) => {
        try {
          osc.stop();
        } catch {
          // ignore
        }
      });
      nodesRef.current = [];
      ratios.forEach((r) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = baseHz * r;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(filter);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.setTargetAtTime(0.05, now + 0.02, 0.18);
        osc.start();
        nodesRef.current.push({ osc, gain });
      });
    };

    const chords: Array<{ base: number; ratios: number[] }> = [
      { base: 130.81, ratios: [1, 1.25, 1.5, 1.875] },
      { base: 110.0, ratios: [1, 1.2, 1.5, 1.8] },
      { base: 174.61 / 2, ratios: [1, 1.25, 1.5, 1.875] },
      { base: 196.0 / 2, ratios: [1, 1.25, 1.5, 1.6667] },
    ];

    let idx = 0;
    buildChord(chords[idx].base, chords[idx].ratios);
    chordTimerRef.current = window.setInterval(() => {
      idx = (idx + 1) % chords.length;
      buildChord(chords[idx].base, chords[idx].ratios);
    }, 8000);

    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.setTargetAtTime(0.2, now + 0.02, 0.2);
  };

  const playToggleClick = (nextEnabled: boolean) => {
    try {
      const ctx = ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGainRef.current ?? ctx.destination);
      osc.frequency.value = nextEnabled ? 560 : 300;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // ignore
    }
  };

  const toggleBgm = () => {
    const next = !bgmEnabled;
    setBgmEnabled(next);
    setVinylPop(true);
    window.setTimeout(() => setVinylPop(false), 240);
    playToggleClick(next);
    if (next) {
      void startPreviewAmbient();
    } else {
      stopPreviewAmbient();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9500] flex items-center justify-center"
      style={{
        background: "rgba(5,5,10,0.94)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        className="relative w-full max-w-md mx-6 rounded-3xl border overflow-hidden"
        style={{
          background: "var(--card)",
          borderColor: "rgba(168,85,247,0.35)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.75)",
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "var(--accent)" }}
        />

        <div className="relative p-8">
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, rgb(192,132,252) 50%, var(--accent) 100%)",
              }}
            >
              <Languages size={20} className="text-primary-foreground" />
            </div>
          </div>

          <h2 className="text-center font-black text-foreground mb-2" style={{ fontSize: "var(--text-xl)" }}>
            {title}
          </h2>
          <p className="text-center text-muted-foreground mb-6" style={{ fontSize: "var(--text-xs)", lineHeight: "var(--leading-relaxed)" }}>
            {subtitle}
          </p>

          <div className="flex items-center justify-center mb-6" style={{ gap: "var(--space-3)" }}>
            <button
              type="button"
              onClick={() => setSelectedLang("zh")}
              className="flex-1 font-medium transition-all duration-200"
              style={{
                padding: "10px 0",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: selectedLang === "zh" ? "var(--primary)" : "var(--surface-2)",
                color: selectedLang === "zh" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                border: `1px solid ${selectedLang === "zh" ? "transparent" : "var(--border)"}`,
              }}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("en")}
              className="flex-1 font-medium transition-all duration-200"
              style={{
                padding: "10px 0",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: selectedLang === "en" ? "var(--primary)" : "var(--surface-2)",
                color: selectedLang === "en" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                border: `1px solid ${selectedLang === "en" ? "transparent" : "var(--border)"}`,
              }}
            >
              English
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "var(--space-5)" }}>
            <label className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
              {companyLabel}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay close to allow click on suggestion
                window.setTimeout(() => setShowSuggestions(false), 120);
              }}
              placeholder={placeholder}
              className="w-full outline-none"
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-lg)",
                background: "var(--input)",
                border: "1px solid var(--border)",
                fontSize: "var(--text-xs)",
                color: "var(--foreground)",
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="border"
                style={{
                  marginTop: "6px",
                  borderRadius: "var(--radius-lg)",
                  borderColor: "var(--border)",
                  background: "var(--card)",
                  maxHeight: "180px",
                  overflowY: "auto",
                }}
              >
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCompany(item);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left transition-colors hover:bg-[rgba(168,85,247,0.08)]"
                    style={{
                      padding: "9px 10px",
                      fontSize: "var(--text-xs)",
                      color: "var(--foreground)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="border"
            onMouseEnter={() => setBgmHovered(true)}
            onMouseLeave={() => setBgmHovered(false)}
            onClick={toggleBgm}
            style={{
              marginBottom: "var(--space-5)",
              borderRadius: "var(--radius-lg)",
              borderColor: "var(--border)",
              background: "linear-gradient(135deg, rgba(168,85,247,0.10) 0%, var(--card) 100%)",
              padding: "10px 12px",
              cursor: "pointer",
              transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
              transform: bgmHovered ? "translateY(-1px) scale(1.01)" : "translateY(0) scale(1)",
              boxShadow: bgmEnabled ? "0 10px 24px rgba(168,85,247,0.18)" : bgmHovered ? "0 8px 18px rgba(168,85,247,0.10)" : "none",
            }}
          >
            <div className="flex items-center justify-between" style={{ gap: "var(--space-3)" }}>
              <div className="flex items-center" style={{ gap: "8px", minWidth: 0 }}>
                <div
                  className={`relative flex items-center justify-center flex-shrink-0 ${bgmEnabled ? "animate-spin" : ""}`}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "999px",
                    background: "radial-gradient(circle, rgb(30,30,40) 28%, rgb(12,12,16) 62%, rgb(40,40,52) 100%)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    animationDuration: "2.8s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    transform: vinylPop ? "scale(1.18) rotate(8deg)" : bgmHovered ? "scale(1.08)" : "scale(1)",
                    transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease",
                    boxShadow: bgmEnabled ? "0 0 16px rgba(168,85,247,0.35)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: bgmEnabled ? "var(--accent)" : "rgba(255,255,255,0.55)",
                      boxShadow: bgmEnabled ? "0 0 8px rgba(232,255,71,0.45)" : "none",
                    }}
                  />
                  <span
                    className="absolute"
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.16)",
                    }}
                  />
                  <span
                    className="absolute"
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="text-foreground font-medium flex items-center" style={{ fontSize: "var(--text-xs)", gap: "6px" }}>
                    <span>{bgmLabel}</span>
                    {bgmEnabled ? (
                      <span className="inline-flex items-end" style={{ gap: "2px", height: "10px" }}>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            style={{
                              width: "2px",
                              height: `${6 + i * 2}px`,
                              borderRadius: "2px",
                              background: "var(--accent)",
                              animation: "musicBar 0.85s ease-in-out infinite",
                              animationDelay: `${i * 0.12}s`,
                            }}
                          />
                        ))}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: "10px", lineHeight: 1.3 }}>
                    {bgmEnabled
                      ? (lang === "en" ? "Ambient mode is ready. Click again to mute." : "氛围音乐已准备好，再点一下可静音。")
                      : bgmHint}
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={bgmEnabled}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBgm();
                }}
                className="relative flex-shrink-0 transition-all duration-300 hover:scale-105"
                style={{
                  width: "46px",
                  height: "26px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: bgmEnabled ? "rgba(168,85,247,0.85)" : "rgba(255,255,255,0.08)",
                }}
              >
                <span
                  className="absolute top-1 flex items-center justify-center transition-all duration-300"
                  style={{
                    left: bgmEnabled ? "22px" : "3px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    background: "white",
                    color: bgmEnabled ? "rgb(168, 85, 247)" : "rgb(107,114,128)",
                  }}
                >
                  {bgmEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-glow disabled:opacity-60"
            style={{
              padding: "11px 0",
              borderRadius: "var(--radius-full)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: "var(--text-sm)",
            }}
          >
            {btnText}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGate;

