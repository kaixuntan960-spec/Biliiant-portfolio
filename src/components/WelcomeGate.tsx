import { useEffect, useRef, useState } from "react";
import { Languages, ArrowRight, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { useI18n } from "../i18n";
import { useThemeMode } from "../theme";

const VISITOR_ENDPOINT = ""; // Optional: set to your backend URL to record visits
const COMPANY_SEARCH_ENDPOINT = ""; // Optional: set company search API, query param: ?q=腾讯
const PREVIEW_TRACK_SRC = "/music/bgm.mp3";

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
  /** When false, never auto-call onComplete from localStorage (parent controls forcing full gate). */
  allowStorageAutoComplete?: boolean;
}

const WelcomeGate = ({ onComplete, allowStorageAutoComplete = true }: WelcomeGateProps) => {
  const { lang, setLang } = useI18n();
  const { mode, setMode, resolvedTheme } = useThemeMode();
  const [isDarkTheme, setIsDarkTheme] = useState(resolvedTheme === "dark");
  const [isMobile, setIsMobile] = useState(false);
  const [gatePointer, setGatePointer] = useState({ x: 50, y: 50 });
  const pointerPxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [petPos, setPetPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const petStateRef = useRef<{ x: number; y: number; vx: number; vy: number; popT: number }>({ x: 0, y: 0, vx: 0, vy: 0, popT: 0 });
  const petVideoRef = useRef<HTMLVideoElement | null>(null);
  const petCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLang, setSelectedLang] = useState<"zh" | "en">(lang);
  const [company, setCompany] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmHovered, setBgmHovered] = useState(false);
  const [vinylPop, setVinylPop] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const gateContentRef = useRef<HTMLDivElement | null>(null);
  const [petAvoidGateContent, setPetAvoidGateContent] = useState(false);
  const roamIdxRef = useRef(0);
  const roamTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const roamHoldUntilRef = useRef(0);
  const lastPointerTsRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (!allowStorageAutoComplete) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("welcome_seen_date") === today) {
        onComplete();
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowStorageAutoComplete]);

  useEffect(() => {
    const video = petVideoRef.current;
    const canvas = petCanvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      raf = window.requestAnimationFrame(render);
      if (video.readyState < 2) return;

      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (!vw || !vh) return;

      // Render at higher internal resolution for crisp edges.
      // (Canvas is displayed smaller via CSS; higher internal size reduces blur.)
      const size = 320;
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.clearRect(0, 0, size, size);
      const scale = Math.min(size / vw, size / vh);
      const dw = Math.round(vw * scale);
      const dh = Math.round(vh * scale);
      const dx = Math.round((size - dw) / 2);
      const dy = Math.round((size - dh) / 2);
      // Draw full frame. Background removal happens via flood-fill keying below
      // (no crop, and we only remove background connected to edges).
      ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh);

      // Auto-pick background color from 4 corners, then remove ONLY
      // the background connected to the edges (flood fill). This avoids
      // accidentally cutting into the pet itself.
      const img = ctx.getImageData(0, 0, size, size);
      const d = img.data;
      // Estimate background color using many samples along the edges,
      // so gradients / watermarks are treated as "background".
      const edgeSamples: number[] = [];
      const sample = (x: number, y: number) => edgeSamples.push((y * size + x) * 4);
      const step = Math.max(1, Math.floor(size / 24));
      for (let x = 0; x < size; x += step) {
        sample(x, 0);
        sample(x, size - 1);
      }
      for (let y = 0; y < size; y += step) {
        sample(0, y);
        sample(size - 1, y);
      }

      let br = 0, bg = 0, bb = 0;
      for (const p of edgeSamples) {
        br += d[p];
        bg += d[p + 1];
        bb += d[p + 2];
      }
      br /= edgeSamples.length;
      bg /= edgeSamples.length;
      bb /= edgeSamples.length;

      let dev = 0;
      for (const p of edgeSamples) {
        dev += Math.abs(d[p] - br) + Math.abs(d[p + 1] - bg) + Math.abs(d[p + 2] - bb);
      }
      dev /= edgeSamples.length;

      // Adaptive threshold: tighter in light, slightly looser in dark.
      const thr = (isDarkTheme ? 62 : 54) + Math.min(36, dev * 0.65);
      const distAt = (p: number) => Math.abs(d[p] - br) + Math.abs(d[p + 1] - bg) + Math.abs(d[p + 2] - bb);
      const bgL = br * 0.2126 + bg * 0.7152 + bb * 0.0722;
      const lumaAt = (p: number) => d[p] * 0.2126 + d[p + 1] * 0.7152 + d[p + 2] * 0.0722;
      const isSmoothBg = (x: number, y: number) => {
        // Background is usually smooth; object edges have higher local contrast.
        const idx = (y * size + x) * 4;
        const base = lumaAt(idx);
        let maxDiff = 0;
        if (x > 0) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx - 4) - base));
        if (x < size - 1) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx + 4) - base));
        if (y > 0) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx - size * 4) - base));
        if (y < size - 1) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx + size * 4) - base));
        return maxDiff < (isDarkTheme ? 22 : 18);
      };

      // Flood fill from the edges for pixels close to bg color.
      const visited = new Uint8Array(size * size);
      const qx = new Int16Array(size * size);
      const qy = new Int16Array(size * size);
      let qs = 0;
      let qe = 0;
      const push = (x: number, y: number) => {
        const idx = y * size + x;
        if (visited[idx]) return;
        const p = idx * 4;
        // Only consider pixels similar to bg, and not nearly-transparent already.
        if (d[p + 3] === 0) return;
        if (Math.abs(lumaAt(p) - bgL) > (isDarkTheme ? 78 : 70)) return;
        if (distAt(p) > thr) return;
        visited[idx] = 1;
        qx[qe] = x;
        qy[qe] = y;
        qe++;
      };

      for (let x = 0; x < size; x++) {
        push(x, 0);
        push(x, size - 1);
      }
      for (let y = 0; y < size; y++) {
        push(0, y);
        push(size - 1, y);
      }

      while (qs < qe) {
        const x = qx[qs];
        const y = qy[qs];
        qs++;
        if (x > 0) push(x - 1, y);
        if (x < size - 1) push(x + 1, y);
        if (y > 0) push(x, y - 1);
        if (y < size - 1) push(x, y + 1);
      }

      // Second pass (watermark removal): expand ONLY 1–2px outward from the
      // strict background region, never "flooding" freely. This avoids eating
      // into the pet on later frames where colors get close.
      const thrLoose = thr + (isDarkTheme ? 14 : 12);
      const canBeLooseBg = (x: number, y: number) => {
        const idx = y * size + x;
        if (visited[idx]) return false;
        const p = idx * 4;
        if (d[p + 3] === 0) return false;
        if (!isSmoothBg(x, y)) return false;
        if (Math.abs(lumaAt(p) - bgL) > (isDarkTheme ? 82 : 72)) return false;
        return distAt(p) <= thrLoose;
      };

      const mark = new Uint8Array(size * size);
      const hasVisitedNeighbor = (x: number, y: number) => {
        const idx = y * size + x;
        const left = x > 0 ? visited[idx - 1] : 0;
        const right = x < size - 1 ? visited[idx + 1] : 0;
        const up = y > 0 ? visited[idx - size] : 0;
        const down = y < size - 1 ? visited[idx + size] : 0;
        return left || right || up || down;
      };

      for (let round = 0; round < 2; round++) {
        mark.fill(0);
        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;
            if (visited[idx]) continue;
            if (!hasVisitedNeighbor(x, y)) continue;
            if (!canBeLooseBg(x, y)) continue;
            mark[idx] = 1;
          }
        }
        let any = false;
        for (let i = 0; i < mark.length; i++) {
          if (!mark[i]) continue;
          visited[i] = 1;
          any = true;
        }
        if (!any) break;
      }

      // Build a protected subject bounding box from current foreground so
      // corner watermark cleanup can never cut into the pet itself.
      let minX = size;
      let minY = size;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          if (visited[idx]) continue;
          const p = idx * 4;
          if (d[p + 3] < 12) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      const hasSubject = maxX >= minX && maxY >= minY;
      const guard = 8;
      const keep = hasSubject
        ? {
            x1: Math.max(0, minX - guard),
            y1: Math.max(0, minY - guard),
            x2: Math.min(size - 1, maxX + guard),
            y2: Math.min(size - 1, maxY + guard),
          }
        : { x1: 0, y1: 0, x2: size - 1, y2: size - 1 };
      const inKeep = (x: number, y: number) => x >= keep.x1 && x <= keep.x2 && y >= keep.y1 && y <= keep.y2;

      // Explicitly clear corner watermark zones (top-left / bottom-right)
      // but never clear inside protected subject bounds.
      const clearCorner = (x1: number, y1: number, x2: number, y2: number) => {
        const cx = (x1 + x2) * 0.5;
        const cy = (y1 + y2) * 0.5;
        const rx = Math.max(1, (x2 - x1) * 0.5);
        const ry = Math.max(1, (y2 - y1) * 0.5);
        for (let y = y1; y <= y2; y++) {
          for (let x = x1; x <= x2; x++) {
            if (inKeep(x, y)) continue;
            const nx = (x - cx) / rx;
            const ny = (y - cy) / ry;
            const dist = nx * nx + ny * ny;
            if (dist > 1.08) continue;
            const idx = y * size + x;
            const p = idx * 4;
            if (d[p + 3] === 0) continue;
            // Feather the edge so removal is less noticeable.
            if (dist > 0.78) {
              d[p + 3] = Math.min(d[p + 3], 28);
            } else {
              d[p + 3] = 0;
            }
          }
        }
      };
      const cornerW = Math.round(size * (isDarkTheme ? 0.34 : 0.27));
      const cornerH = Math.round(size * (isDarkTheme ? 0.26 : 0.2));
      clearCorner(0, 0, cornerW, cornerH);
      clearCorner(size - 1 - cornerW, size - 1 - cornerH, size - 1, size - 1);
      // Night mode: watermark on source video is stronger, so enforce a
      // slightly harder corner clear while still respecting subject keep box.
      if (isDarkTheme) {
        const hardClearCorner = (x1: number, y1: number, x2: number, y2: number) => {
          for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
              if (inKeep(x, y)) continue;
              const idx = y * size + x;
              d[idx * 4 + 3] = 0;
            }
          }
        };
        hardClearCorner(0, 0, Math.round(size * 0.18), Math.round(size * 0.12));
        hardClearCorner(size - 1 - Math.round(size * 0.18), size - 1 - Math.round(size * 0.12), size - 1, size - 1);
        // Dedicated bottom-right cleanup for stubborn night watermark:
        // widen the clear zone and use an ellipse+rect blend to fully cover
        // logo/text while still respecting subject keep bounds.
        const brX1 = Math.round(size * 0.81);
        const brY1 = Math.round(size * 0.912);
        const brX2 = size - 1;
        const brY2 = size - 1;
        const cx = (brX1 + brX2) * 0.5;
        const cy = (brY1 + brY2) * 0.5;
        const rx = Math.max(1, (brX2 - brX1) * 0.5);
        const ry = Math.max(1, (brY2 - brY1) * 0.5);
        for (let y = brY1; y <= brY2; y++) {
          for (let x = brX1; x <= brX2; x++) {
            if (inKeep(x, y)) continue;
            const idx = y * size + x;
            const p = idx * 4;
            if (d[p + 3] === 0) continue;
            const nx = (x - cx) / rx;
            const ny = (y - cy) / ry;
            const dist = nx * nx + ny * ny;
            const inRect = x > Math.round(size * 0.925) && y > Math.round(size * 0.965);
            if (dist <= 0.96 || inRect) {
              d[p + 3] = 0;
            } else if (dist <= 1.06) {
              // Feather the edge to make the cut more rounded and less invasive.
              d[p + 3] = Math.min(d[p + 3], 26);
            }
          }
        }
        // Final guarantee cleanup for night watermark: force-clear very corner
        // strips regardless of color analysis so watermark never leaks through.
        // This is limited to edge bands away from centered subject.
        const clearRectAlpha = (x1: number, y1: number, x2: number, y2: number) => {
          for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
              const i = (y * size + x) * 4 + 3;
              d[i] = 0;
            }
          }
        };
        clearRectAlpha(0, 0, Math.round(size * 0.18), Math.round(size * 0.12));
        clearRectAlpha(size - 1 - Math.round(size * 0.145), size - 1 - Math.round(size * 0.072), size - 1, size - 1);
      }

      for (let i = 0; i < visited.length; i++) {
        if (!visited[i]) continue;
        d[i * 4 + 3] = 0;
      }
      ctx.putImageData(img, 0, 0);
    };

    const onPlay = () => {
      if (!raf) render();
    };
    video.addEventListener("play", onPlay);
    // Autoplay attempt (muted videos are allowed on most mobile browsers).
    void video.play().catch(() => {});
    // Try start immediately.
    if (!video.paused) render();
    return () => {
      video.removeEventListener("play", onPlay);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [isDarkTheme]);

  useEffect(() => {
    // "Obi Island style" feel: springy pet chasing cursor with inertia.
    const state = petStateRef.current;
    if (state.x === 0 && state.y === 0 && typeof window !== "undefined") {
      state.x = Math.max(24, window.innerWidth * 0.16);
      state.y = Math.max(24, window.innerHeight * 0.72);
      setPetPos({ x: state.x, y: state.y });
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      const px = pointerPxRef.current;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const idleFor = now - lastPointerTsRef.current;

      // 计算弹窗区域边界
      let gateRect: DOMRect | null = null;
      if (gateContentRef.current) {
        gateRect = gateContentRef.current.getBoundingClientRect();
      }

      // 如果鼠标在弹窗内（petAvoidGateContent=true），
      // 把宠物目标设到弹窗外围
      if (petAvoidGateContent && gateRect) {
        // 计算宠物的理想位置：在弹窗外部附近跳动
        const t = now * 0.001;
        // 围绕弹窗外围的环上选择一个点
        const margin = 70; // 宠物离弹窗边缘的距离
        const outerW = gateRect.width + margin * 2;
        const outerH = gateRect.height + margin * 2;
        const perimeter = outerW * 2 + outerH * 2;
        // 随时间在周长上游走
        const pos = ((t * 18) % perimeter) / perimeter;
        let tx: number, ty: number;
        const p = pos * perimeter;
        if (p < outerW) {
          // 上边
          tx = gateRect.left - margin + p;
          ty = gateRect.top - margin;
        } else if (p < outerW + outerH) {
          // 右边
          tx = gateRect.right + margin;
          ty = gateRect.top - margin + (p - outerW);
        } else if (p < outerW * 2 + outerH) {
          // 下边
          tx = gateRect.right + margin - (p - outerW - outerH);
          ty = gateRect.bottom + margin;
        } else {
          // 左边
          tx = gateRect.left - margin;
          ty = gateRect.bottom + margin - (p - outerW * 2 - outerH);
        }
        // 添加一些随机抖动使运动更自然
        tx += Math.sin(t * 5.3 + 1) * 10;
        ty += Math.cos(t * 4.7 + 2) * 10;
        px.x = Math.max(54, Math.min(w - 54, tx));
        px.y = Math.max(54, Math.min(h - 54, ty));
      } else if (idleFor > 900) {
        // 鼠标长时间未移动，自动漫游
        const t = now * 0.001;
        px.x = w * (0.3 + Math.cos(t * 0.4) * 0.25);
        px.y = h * (0.3 + Math.sin(t * 0.5) * 0.2);
      }

      let targetX = Math.max(54, Math.min(w - 54, px.x + 12));
      let targetY = Math.max(54, Math.min(h - 54, px.y + 18));
      if (!petAvoidGateContent && idleFor > 900) {
        targetX = Math.max(54, Math.min(w - 54, w * 0.55 + Math.cos(now * 0.0012) * w * 0.18));
        targetY = Math.max(54, Math.min(h - 54, h * 0.45 + Math.sin(now * 0.0017) * h * 0.14));
      }

      // Spring parameters
      const k = 26;
      const c = 9.5;
      const ax = (targetX - state.x) * k - state.vx * c;
      const ay = (targetY - state.y) * k - state.vy * c;
      state.vx += ax * dt;
      state.vy += ay * dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;

      const dist = Math.hypot(targetX - state.x, targetY - state.y);
      if (dist < 26) state.popT = Math.min(1, state.popT + dt * 0.7);
      else state.popT = Math.max(0, state.popT - dt * 1.2);

      setPetPos({ x: state.x, y: state.y });
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [petAvoidGateContent]);

  useEffect(() => {
    const video = petVideoRef.current;
    if (!video) return;
    video.src = isDarkTheme ? "/welcome-pet-night.mp4" : "/welcome-pet.mp4";
    video.load();
    void video.play().catch(() => {});
  }, [isDarkTheme]);

  useEffect(() => {
    try {
      setBgmEnabled(localStorage.getItem("bgm_preferred") === "1");
    } catch {
      setBgmEnabled(false);
    }
  }, []);

  useEffect(() => {
    audioElRef.current = ensureSharedAudio();
    return () => {};
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      const isDark = root.classList.contains("dark") || root.getAttribute("data-theme") === "dark";
      setIsDarkTheme(isDark);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Sync with resolvedTheme from context
    setIsDarkTheme(resolvedTheme === "dark");
  }, [resolvedTheme]);

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
    if (!bgmEnabled) stopPreviewMusic();
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

  const PET_SIZE = isMobile ? 88 : 108;
  const PET_HALF = PET_SIZE / 2;
  const PET_HALO_SIZE = isMobile ? 150 : 184;
  const PET_HALO_HALF = PET_HALO_SIZE / 2;

  const ensureSharedAudio = () => {
    const w = window as typeof window & { __portfolioSharedAudio?: HTMLAudioElement };
    if (!w.__portfolioSharedAudio) {
      w.__portfolioSharedAudio = new Audio();
      w.__portfolioSharedAudio.preload = "auto";
    }
    return w.__portfolioSharedAudio;
  };

  const stopPreviewMusic = () => {
    const audio = audioElRef.current;
    if (!audio) return;
    audio.pause();
  };

  const startPreviewMusic = async () => {
    const audio = ensureSharedAudio();
    audioElRef.current = audio;
    const nextSrc = new URL(PREVIEW_TRACK_SRC, window.location.origin).href;
    if (audio.src !== nextSrc) {
      audio.src = nextSrc;
      audio.load();
    }
    audio.loop = true;
    audio.volume = 0.25;
    try {
      await audio.play();
    } catch {
      // ignore autoplay restrictions before user gesture
    }
  };

  const playToggleClick = (nextEnabled: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = nextEnabled ? 560 : 300;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
      window.setTimeout(() => {
        void ctx.close();
      }, 320);
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
      void startPreviewMusic();
    } else {
      stopPreviewMusic();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9500] flex items-center justify-center"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setGatePointer({
          x: Math.max(8, Math.min(92, x)),
          y: Math.max(8, Math.min(92, y)),
        });
        pointerPxRef.current = { x: e.clientX, y: e.clientY };
        lastPointerTsRef.current = performance.now();
      }}
      onTouchStart={(e) => {
        const t = e.touches?.[0];
        if (t) {
          pointerPxRef.current = { x: t.clientX, y: t.clientY };
          lastPointerTsRef.current = performance.now();
        }
        const video = petVideoRef.current;
        if (video) void video.play().catch(() => {});
      }}
      onPointerDown={() => {
        // Jelly "pop" impulse
        const s = petStateRef.current;
        s.vy -= 160;
        s.vx += (Math.random() - 0.5) * 120;
        s.popT = 0;
      }}
      style={{
        background: "transparent",
        backdropFilter: "none",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "transparent",
          transition: "background 260ms ease-out",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none rounded-full"
        style={{
          left: `calc(${gatePointer.x}% - 120px)`,
          top: `calc(${gatePointer.y}% - 120px)`,
          width: "240px",
          height: "240px",
          background: isDarkTheme
            ? "radial-gradient(circle, rgba(176,120,255,0.2) 0%, rgba(136,104,255,0.12) 34%, rgba(126,110,255,0.04) 58%, rgba(126,110,255,0) 80%)"
            : "radial-gradient(circle, rgba(214,170,246,0.12) 0%, rgba(206,176,255,0.06) 42%, rgba(238,214,250,0.018) 66%, rgba(255,255,255,0) 84%)",
          filter: "blur(10px)",
          opacity: isDarkTheme ? 0.86 : 0.66,
          transformOrigin: "50% 50%",
          animation: "gateGlowPulse 2.4s ease-in-out infinite",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          backgroundImage: "none",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: `${petPos.x - PET_HALF}px`,
          top: `${petPos.y - PET_HALF}px`,
          width: `${PET_SIZE}px`,
          height: `${PET_SIZE}px`,
          opacity: isDarkTheme ? 0.95 : 0.9,
          filter: isDarkTheme
            ? "drop-shadow(0 0 14px rgba(168,85,247,0.5)) drop-shadow(0 12px 18px rgba(0,0,0,0.26))"
            : "drop-shadow(0 0 10px rgba(168,85,247,0.34)) drop-shadow(0 10px 14px rgba(73,42,122,0.2))",
          transform: `scale(${1 + petStateRef.current.popT * 0.06})`,
          transition: "opacity 180ms ease",
          zIndex: 0,
        }}
      >
        <video
          ref={petVideoRef}
          src={isDarkTheme ? "/welcome-pet-night.mp4" : "/welcome-pet.mp4"}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
        <canvas ref={petCanvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        aria-hidden
        className="absolute pointer-events-none rounded-full"
        style={{
          left: `${petPos.x - PET_HALO_HALF}px`,
          top: `${petPos.y - PET_HALO_HALF}px`,
          width: `${PET_HALO_SIZE}px`,
          height: `${PET_HALO_SIZE}px`,
          background: isDarkTheme
            ? "radial-gradient(circle, rgba(168,85,247,0.42) 0%, rgba(138,108,255,0.24) 34%, rgba(126,110,255,0.08) 58%, rgba(126,110,255,0) 78%)"
            : "radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)",
          filter: isDarkTheme ? "blur(5px)" : "none",
          transform: `scale(${1 + petStateRef.current.popT * 0.1})`,
          transition: "transform 170ms ease-out, opacity 260ms ease-out",
          opacity: isDarkTheme ? 0.86 : 0,
          zIndex: 0,
        }}
      />
      <div
        className="relative w-full max-w-md mx-6 rounded-3xl border overflow-hidden"
        style={{
          background: "var(--card)",
          borderColor: isDarkTheme ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.2)",
          boxShadow: isDarkTheme ? "0 40px 120px rgba(0,0,0,0.62)" : "0 30px 86px rgba(126,102,180,0.22)",
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

        <div
          ref={gateContentRef}
          className="relative p-8"
          onPointerEnter={() => setPetAvoidGateContent(true)}
          onPointerLeave={() => setPetAvoidGateContent(false)}
        >
          <button
            type="button"
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
            className="absolute top-4 right-4 flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "999px",
              background: isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.72)",
              border: isDarkTheme ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(184,171,228,0.44)",
              color: isDarkTheme ? "rgba(248,250,252,0.94)" : "rgba(102,84,160,0.9)",
              boxShadow: isDarkTheme ? "0 6px 16px rgba(5,7,12,0.3)" : "0 6px 16px rgba(132,112,186,0.22)",
            }}
            aria-label={isDarkTheme ? "切换到白天模式" : "切换到黑夜模式"}
          >
            {isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
          </button>
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

          <h2 className="text-center font-semibold text-foreground mb-2" style={{ fontSize: "var(--text-xl)" }}>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
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
                    border: "none",
                    animationDuration: "2.8s",
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    transform: vinylPop ? "scale(1.18) rotate(8deg)" : bgmHovered ? "scale(1.08)" : "scale(1)",
                    transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease",
                    boxShadow: bgmEnabled
                      ? "0 8px 18px rgba(15,23,42,0.32), 0 0 0 2px rgba(99,102,241,0.18)"
                      : "0 8px 16px rgba(15,23,42,0.26)",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "999px",
                      backgroundImage: "url('/vinyl-icon.png')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      filter: "saturate(1.06)",
                    }}
                  />
                  <span
                    className="absolute pointer-events-none"
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "999px",
                      background: "var(--primary)",
                      border: "1px solid color-mix(in srgb, var(--primary) 72%, white)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 3px rgba(0,0,0,0.35)",
                    }}
                  />
                  <span
                    className="absolute pointer-events-none"
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "999px",
                      background: "rgba(248,250,252,0.96)",
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
        <style>{`
          @keyframes gateGlowPulse {
            0% { transform: scale(0.97); opacity: 0.54; }
            50% { transform: scale(1.04); opacity: 0.82; }
            100% { transform: scale(0.97); opacity: 0.54; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default WelcomeGate;

