import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n";

interface MusicPlayerProps {
  playing: boolean;
  onToggle: (nextPlaying: boolean) => void;
}

const PLAYLIST = [
  {
    src: "/music/bgm.mp3",
    subtitle: "Joji · NITROUS",
  },
];

let sharedAudio: HTMLAudioElement | null = null;
let sharedTrackIndex = 0;
const ensureSharedAudio = () => {
  if (typeof window !== "undefined") {
    const w = window as typeof window & { __portfolioSharedAudio?: HTMLAudioElement; __portfolioSharedTrackIndex?: number };
    if (!w.__portfolioSharedAudio) {
      w.__portfolioSharedAudio = new Audio();
      w.__portfolioSharedAudio.preload = "auto";
      w.__portfolioSharedAudio.volume = 0.25;
    }
    sharedAudio = w.__portfolioSharedAudio;
    if (typeof w.__portfolioSharedTrackIndex === "number") {
      sharedTrackIndex = w.__portfolioSharedTrackIndex;
    }
  }
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "auto";
    sharedAudio.volume = 0.25;
  }
  return sharedAudio;
};

const PANEL_WIDTH = 228;
const PANEL_HEIGHT = 58;
const COLLAPSED_SIZE = 52;
const COLLAPSED_PEEK = 52;
const EDGE_MARGIN = 24;

const getAvoidBottomY = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const avoidEls = Array.from(document.querySelectorAll<HTMLElement>("[data-avoid-music-player='true']"));
  if (!avoidEls.length) return null;
  let topMost = Number.POSITIVE_INFINITY;
  for (const el of avoidEls) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    topMost = Math.min(topMost, rect.top);
  }
  return Number.isFinite(topMost) ? topMost : null;
};

const getAvoidRects = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return [] as DOMRect[];
  const avoidEls = Array.from(document.querySelectorAll<HTMLElement>("[data-avoid-music-player='true']"));
  return avoidEls
    .map((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return rect;
    })
    .filter((v): v is DOMRect => v !== null);
};

const intersectsRect = (
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number },
) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const MusicPlayer = ({ playing = false, onToggle = () => {} }: MusicPlayerProps) => {
  const { lang } = useI18n();
  const location = useLocation();
  const isWorkCase = location.pathname.startsWith("/works/");
  const [visible, setVisible] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window === "undefined") return null;
    return {
      x: Math.max(EDGE_MARGIN, window.innerWidth - PANEL_WIDTH - EDGE_MARGIN),
      y: Math.max(EDGE_MARGIN, window.innerHeight - PANEL_HEIGHT - EDGE_MARGIN),
    };
  });
  const [trackIndex, setTrackIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(playing);
  const [expanded, setExpanded] = useState(false);
  const [showCollapsedHint, setShowCollapsedHint] = useState(false);
  const [dockSide, setDockSide] = useState<"left" | "right">("right");
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean; pointerId: number | null }>({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    pointerId: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const dragHoldTimerRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const rangeRafRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const expandedRef = useRef(false);
  const draggingRef = useRef(false);
  const bars = [1, 2, 3, 4, 5];
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      setIsDarkTheme(root.classList.contains("dark") || root.getAttribute("data-theme") === "dark");
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    draggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    if (dragPointerId == null) return;
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragPointerId || !pos) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragRef.current.moved = true;
      setPos(clampPos(dragRef.current.originX + dx, dragRef.current.originY + dy));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragPointerId) return;
      setIsDragging(false);
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const raw = clampPos(dragRef.current.originX + dx, dragRef.current.originY + dy);
      const margin = EDGE_MARGIN;
      const side = raw.x + PANEL_WIDTH / 2 > window.innerWidth / 2 ? "right" : "left";
      setDockSide(side);
      const snappedX = side === "right" ? window.innerWidth - PANEL_WIDTH - margin : margin;
      const snapped = { x: snappedX, y: raw.y };
      setPos(snapped);
      if (dragRef.current.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 200);
      }
      dragRef.current.pointerId = null;
      setDragPointerId(null);
      try {
        localStorage.setItem("music_player_pos", JSON.stringify(snapped));
      } catch {
        // ignore
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragPointerId, pos]);

  useEffect(() => {
    setVisible(true);
    audioElRef.current = ensureSharedAudio();
    // Keep state in sync on mount, but do not overwrite an explicit "play on enter" intent.
    if (audioElRef.current) {
      const currentlyPlaying = !audioElRef.current.paused;
      setIsAudioPlaying(currentlyPlaying);
      if (!playing) {
        syncPlaying(currentlyPlaying);
      }
    }
    try {
      const raw = localStorage.getItem("music_track_index");
      const idx = raw ? Number(raw) : 0;
      if (Number.isFinite(idx) && idx >= 0) setTrackIndex(idx % PLAYLIST.length);
      else setTrackIndex(sharedTrackIndex % PLAYLIST.length);
    } catch {
      // ignore
    }

    // Show helper at most once per day.
    let showTimer: number | null = null;
    let hideTimer: number | null = null;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const key = "music_widget_hint_date";
      const seenDate = localStorage.getItem(key);
      if (seenDate !== today) {
        localStorage.setItem(key, today);
        showTimer = window.setTimeout(() => {
          setShowCollapsedHint(true);
        }, 700);
        hideTimer = window.setTimeout(() => {
          setShowCollapsedHint(false);
        }, 2700);
      }
    } catch {
      // fallback: still show if storage unavailable
      showTimer = window.setTimeout(() => {
        setShowCollapsedHint(true);
      }, 700);
      hideTimer = window.setTimeout(() => {
        setShowCollapsedHint(false);
      }, 2700);
    }
    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const restore = () => {
      if (isWorkCase) {
        setDockSide("left");
        setExpanded(false);
        setPos({
          x: EDGE_MARGIN,
          y: Math.max(EDGE_MARGIN, window.innerHeight - PANEL_HEIGHT - EDGE_MARGIN),
        });
        return;
      }
      try {
        const raw = localStorage.getItem("music_player_pos");
        if (raw) {
          const parsed = JSON.parse(raw) as { x: number; y: number };
          if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
            const clamped = clampPos(parsed.x, parsed.y);
            const side = clamped.x + PANEL_WIDTH / 2 > window.innerWidth / 2 ? "right" : "left";
            const snappedX = side === "right" ? window.innerWidth - PANEL_WIDTH - EDGE_MARGIN : EDGE_MARGIN;
            const snapped = { x: snappedX, y: clamped.y };
            setPos(snapped);
            setDockSide(side);
            return;
          }
        }
      } catch {
        // ignore
      }
      const margin = EDGE_MARGIN;
      setPos({ x: Math.max(margin, window.innerWidth - PANEL_WIDTH - margin), y: Math.max(margin, window.innerHeight - PANEL_HEIGHT - margin) });
      setDockSide("right");
    };
    restore();
  }, [isWorkCase]);

  useEffect(() => {
    const keepVisibleOnResize = () => {
      if (isWorkCase) {
        setDockSide("left");
        setPos({
          x: EDGE_MARGIN,
          y: Math.max(EDGE_MARGIN, window.innerHeight - PANEL_HEIGHT - EDGE_MARGIN),
        });
        return;
      }
      setPos((prev) => {
        if (!prev) return prev;
        const clampedY = Math.max(EDGE_MARGIN, Math.min(window.innerHeight - PANEL_HEIGHT - EDGE_MARGIN, prev.y));
        const snappedX = dockSide === "right" ? window.innerWidth - PANEL_WIDTH - EDGE_MARGIN : EDGE_MARGIN;
        return { x: snappedX, y: clampedY };
      });
    };
    window.addEventListener("resize", keepVisibleOnResize, { passive: true });
    return () => window.removeEventListener("resize", keepVisibleOnResize);
  }, [dockSide, isWorkCase]);

  useEffect(() => {
    if (isWorkCase) return;
    const resolveCollision = () => {
      setPos((prev) => {
        if (!prev) return prev;
        let next = clampPos(prev.x, prev.y);
        const avoidRects = getAvoidRects();
        if (!avoidRects.length) return next;
        const margin = 12;
        const playerRect = {
          left: next.x,
          top: next.y,
          right: next.x + PANEL_WIDTH,
          bottom: next.y + PANEL_HEIGHT,
        };
        let hasCollision = false;
        for (const avoid of avoidRects) {
          if (intersectsRect(playerRect, avoid)) {
            hasCollision = true;
            break;
          }
        }
        if (!hasCollision) return next;
        // First try to move up, then fallback to left dock.
        const topMostAvoid = avoidRects.reduce((m, r) => Math.min(m, r.top), Number.POSITIVE_INFINITY);
        const moveUpY = Math.max(EDGE_MARGIN, topMostAvoid - PANEL_HEIGHT - margin);
        next = clampPos(next.x, moveUpY);
        const movedUpRect = {
          left: next.x,
          top: next.y,
          right: next.x + PANEL_WIDTH,
          bottom: next.y + PANEL_HEIGHT,
        };
        const stillCollision = avoidRects.some((avoid) => intersectsRect(movedUpRect, avoid));
        if (!stillCollision) return next;
        setDockSide("left");
        return clampPos(EDGE_MARGIN, next.y);
      });
    };

    resolveCollision();
    const t = window.setInterval(resolveCollision, 600);
    window.addEventListener("resize", resolveCollision, { passive: true });
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", resolveCollision);
    };
  }, [isWorkCase]);

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
      if (dragHoldTimerRef.current) window.clearTimeout(dragHoldTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const cancelPendingDrag = () => {
      if (dragHoldTimerRef.current) {
        window.clearTimeout(dragHoldTimerRef.current);
        dragHoldTimerRef.current = null;
      }
      pendingDragRef.current = null;
    };
    window.addEventListener("pointerup", cancelPendingDrag, { passive: true });
    window.addEventListener("pointercancel", cancelPendingDrag, { passive: true });
    window.addEventListener("blur", cancelPendingDrag);
    return () => {
      window.removeEventListener("pointerup", cancelPendingDrag);
      window.removeEventListener("pointercancel", cancelPendingDrag);
      window.removeEventListener("blur", cancelPendingDrag);
    };
  }, []);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    sharedTrackIndex = trackIndex;
    if (typeof window !== "undefined") {
      (window as typeof window & { __portfolioSharedTrackIndex?: number }).__portfolioSharedTrackIndex = trackIndex;
    }
    const nextSrc = new URL(PLAYLIST[trackIndex]?.src ?? PLAYLIST[0].src, window.location.origin).href;
    if (el.src !== nextSrc) {
      el.src = nextSrc;
      el.load();
    }
    el.loop = PLAYLIST.length <= 1;
    try {
      localStorage.setItem("music_track_index", String(trackIndex));
    } catch {
      // ignore
    }
    if (playing) void el.play();
  }, [trackIndex, playing]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    el.volume = 0.25;
    if (playing) {
      void el.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(!el.paused));
    } else {
      el.pause();
      setIsAudioPlaying(false);
    }
  }, [playing]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    const onPlay = () => {
      setIsAudioPlaying(true);
      syncPlaying(true);
    };
    const onPause = () => {
      setIsAudioPlaying(false);
      syncPlaying(false);
    };
    const onEnded = () => handleEnded();
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
    // Only rebind when relevant reactive values change.
  }, [playing, onToggle, trackIndex]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (rangeRafRef.current != null) return;
      rangeRafRef.current = window.requestAnimationFrame(() => {
        rangeRafRef.current = null;
        const el = containerRef.current;
        if (!el || draggingRef.current || !expandedRef.current) return;
        const r = el.getBoundingClientRect();
        const dx =
          e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0;
        const dy =
          e.clientY < r.top ? r.top - e.clientY : e.clientY > r.bottom ? e.clientY - r.bottom : 0;
        const dist = Math.hypot(dx, dy);
        if (dist > 140) {
          if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = null;
          setExpanded(false);
        }
      });
    };
    const onTouch = (e: TouchEvent) => {
      const el = containerRef.current;
      if (!el || draggingRef.current || !expandedRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const r = el.getBoundingClientRect();
      const inside = touch.clientX >= r.left && touch.clientX <= r.right && touch.clientY >= r.top && touch.clientY <= r.bottom;
      if (!inside) {
        setExpanded(false);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onTouch);
      if (rangeRafRef.current != null) window.cancelAnimationFrame(rangeRafRef.current);
    };
  }, []);

  const syncPlaying = (next: boolean) => {
    if (next !== playing) onToggle(next);
  };

  const handleEnded = () => {
    if (PLAYLIST.length <= 1) {
      const el = audioElRef.current;
      if (el && playing) {
        el.currentTime = 0;
        void el.play();
      }
      return;
    }
    setTrackIndex((i) => (i + 1) % PLAYLIST.length);
  };

  const handleToggle = async () => {
    if (suppressClickRef.current) return;
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
        syncPlaying(true);
      } catch {
        // autoplay policy
      }
      return;
    }
    el.pause();
    syncPlaying(false);
  };

  const handlePlayPauseButton = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClickRef.current) return;
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    await handleToggle();
  };

  const clampPos = (x: number, y: number) => {
    const margin = EDGE_MARGIN;
    const avoidTop = getAvoidBottomY();
    const maxYByViewport = window.innerHeight - PANEL_HEIGHT - margin;
    const maxYByAvoid = avoidTop != null ? avoidTop - PANEL_HEIGHT - 12 : maxYByViewport;
    const maxY = Math.max(margin, Math.min(maxYByViewport, maxYByAvoid));
    return {
      x: Math.max(margin, Math.min(window.innerWidth - PANEL_WIDTH - margin, x)),
      y: Math.max(margin, Math.min(maxY, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pos || isWorkCase) return;
    setExpanded(true);
    if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = null;
    pendingDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: expanded ? pos.x : (dockSide === "right" ? window.innerWidth - COLLAPSED_SIZE - EDGE_MARGIN : EDGE_MARGIN),
      originY: pos.y,
    };
    if (dragHoldTimerRef.current) window.clearTimeout(dragHoldTimerRef.current);
    dragHoldTimerRef.current = window.setTimeout(() => {
      const pending = pendingDragRef.current;
      if (!pending) return;
      dragRef.current = {
        startX: pending.startX,
        startY: pending.startY,
        originX: pending.originX,
        originY: pending.originY,
        moved: false,
        pointerId: pending.pointerId,
      };
      setIsDragging(true);
      setDragPointerId(pending.pointerId);
      pendingDragRef.current = null;
      dragHoldTimerRef.current = null;
    }, 170);
  };

  const collapsedX = dockSide === "right"
    ? Math.max(EDGE_MARGIN, window.innerWidth - COLLAPSED_SIZE - EDGE_MARGIN)
    : EDGE_MARGIN;
  const visualLeft = isWorkCase ? EDGE_MARGIN : pos ? (expanded ? pos.x : collapsedX) : undefined;
  const visualTop = isWorkCase
    ? Math.max(EDGE_MARGIN, window.innerHeight - PANEL_HEIGHT - EDGE_MARGIN)
    : pos?.y;
  const collapsedDiscStyle = {
    background: "transparent",
    border: "none",
    boxShadow: "none",
  } as const;

  return (
    <div
      ref={containerRef}
      className={`fixed ${isWorkCase ? "z-[6500]" : "z-[6800]"}`}
      style={{
        left: visualLeft != null ? `${visualLeft}px` : undefined,
        top: visualTop != null ? `${visualTop}px` : undefined,
        width: `${expanded ? PANEL_WIDTH : COLLAPSED_SIZE}px`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) translateX(0px)" : "translateY(20px)",
        transition: "transform 420ms cubic-bezier(0.16,1,0.3,1), opacity 420ms ease",
      }}
      onMouseEnter={() => {
        if (isWorkCase) return;
        if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
        if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
        setExpanded(true);
        setShowCollapsedHint(false);
      }}
      onMouseLeave={() => {
        if (isWorkCase) return;
        if (!isDragging) {
          if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = window.setTimeout(() => {
            setExpanded(false);
          }, 1000);
        }
      }}
    >
      <div
        className="relative overflow-hidden flex items-center"
        onPointerDown={onPointerDown}
        style={{
          justifyContent: !expanded && dockSide === "left" ? "flex-end" : "flex-start",
          borderRadius: "999px",
          padding: expanded ? "2px" : "0px",
          gap: expanded ? "5px" : "0px",
          background: expanded
            ? "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.11) 60%, rgba(255,255,255,0.08) 100%)"
            : "transparent",
          border: expanded ? "1px solid rgba(255,255,255,0.3)" : "none",
          boxShadow: expanded
            ? "0 10px 22px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.58)"
            : "none",
          backdropFilter: expanded ? "blur(16px) saturate(1.14)" : "none",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <button
          type="button"
          onClick={async () => {
            await handleToggle();
          }}
          className="relative group flex items-center rounded-full border transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: playing ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.16)",
            borderColor: playing ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.25)",
            color: isDarkTheme ? "rgba(248,250,252,0.96)" : "rgba(15,23,42,0.9)",
            padding: expanded ? "7px 9px" : "0px",
            cursor: "pointer",
            width: `${expanded ? 186 : COLLAPSED_SIZE}px`,
            height: `${expanded ? 34 : COLLAPSED_SIZE}px`,
            borderRadius: "999px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "width 320ms cubic-bezier(0.16,1,0.3,1), transform 220ms ease, height 220ms ease",
            transformOrigin: "50% 50%",
            ...(expanded ? {} : collapsedDiscStyle),
          }}
          data-sfx="click"
          title={lang === "en" ? "Play / Pause" : "播放 / 暂停"}
          aria-label={lang === "en" ? "Play / Pause" : "播放 / 暂停"}
        >
          <span className="inline-flex items-center justify-center flex-shrink-0" style={{ width: expanded ? "0px" : "52px", marginRight: 0 }}>
            {null}
          </span>

          {expanded ? (
            <>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0, marginLeft: "8px" }}>
                <span className="text-[11px] font-semibold" style={{ color: isDarkTheme ? "rgba(248,250,252,0.98)" : "rgba(15,23,42,0.92)" }}>
                  {playing ? (lang === "en" ? "Playing" : "播放中") : (lang === "en" ? "Music" : "音乐")}
                </span>
                <span
                  className="text-[10px]"
                  style={{
                    color: isDarkTheme ? "rgba(248,250,252,0.86)" : "rgba(15,23,42,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {PLAYLIST[trackIndex]?.subtitle ?? ""}
                </span>
              </span>
              <span className="inline-flex items-end gap-0.5 h-3 ml-auto" style={{ opacity: playing ? 1 : 0.45 }}>
                {bars.map((b) => (
                  <span
                    key={b}
                    className="w-0.5 rounded-full"
                    style={{
                      background: playing ? "rgba(99,102,241,0.9)" : "rgba(15,23,42,0.34)",
                      height: `${4 + (b % 3) * 2}px`,
                      animation: playing ? "musicBar 0.8s ease-in-out infinite" : "none",
                      animationDelay: `${b * 0.12}s`,
                    }}
                  />
                ))}
              </span>
            </>
          ) : null}
        </button>

        {!expanded ? (
          <>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "52px",
                height: "52px",
                borderRadius: "999px",
                border: "none",
                boxShadow: isAudioPlaying
                  ? "0 10px 22px rgba(15,23,42,0.34), 0 0 0 2px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(2,6,23,0.28)"
                  : "0 10px 22px rgba(15,23,42,0.3), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(2,6,23,0.28)",
                pointerEvents: "none",
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
                  transformOrigin: "50% 50%",
                  animation: isAudioPlaying ? "vinylSpin 1.9s linear infinite" : "none",
                  filter: "saturate(1.06)",
                }}
              />
            </span>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "42px",
                height: "42px",
                display: "none",
                borderRadius: "999px",
                border: "1px solid #ffffff",
                opacity: 0.82,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "33px",
                height: "33px",
                display: "none",
                borderRadius: "999px",
                border: "1px solid #ffffff",
                opacity: 0.78,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "20px",
                height: "20px",
                borderRadius: "999px",
                background: "var(--primary)",
                border: "1px solid color-mix(in srgb, var(--primary) 72%, white)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), 0 1px 3px rgba(15,23,42,0.32)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "22px",
                height: "22px",
                display: "none",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(2,6,23,0.2)",
                pointerEvents: "none",
                zIndex: 3,
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "4px",
                height: "4px",
                borderRadius: "999px",
                background: "rgba(248,250,252,0.95)",
                opacity: 1,
                pointerEvents: "none",
                zIndex: 4,
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "18px",
                height: "18px",
                borderRadius: "999px",
                background: "var(--primary)",
                border: "1px solid color-mix(in srgb, var(--primary) 72%, white)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 4px rgba(0,0,0,0.35)",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "5px",
                height: "5px",
                borderRadius: "999px",
                background: "rgba(248,250,252,0.96)",
                pointerEvents: "none",
                zIndex: 6,
              }}
            />
          </>
        ) : null}

        <button
          type="button"
          onClick={handlePlayPauseButton}
          className="flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
          style={{
            width: expanded ? "30px" : "0px",
            height: expanded ? "30px" : "0px",
            background: expanded ? "rgba(255,255,255,0.18)" : "transparent",
            border: expanded ? "1px solid rgba(255,255,255,0.36)" : "none",
            color: isDarkTheme ? "rgba(248,250,252,0.96)" : "rgba(15,23,42,0.84)",
            marginRight: expanded ? "4px" : "0px",
            opacity: expanded ? 1 : 0,
            pointerEvents: expanded ? "auto" : "none",
            overflow: "hidden",
            transition: "opacity 180ms ease, transform 220ms ease, width 180ms ease, height 180ms ease, margin-right 180ms ease",
          }}
          data-sfx="click"
          title={lang === "en" ? "Play / Pause" : "播放 / 暂停"}
          aria-label={lang === "en" ? "Play / Pause" : "播放 / 暂停"}
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>
      {showCollapsedHint && !expanded ? (
        <div
          style={{
            position: "absolute",
            [dockSide === "right" ? "left" : "right"]: "-236px",
            top: "-54px",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "10px",
            fontWeight: 500,
            padding: "7px 10px",
            borderRadius: "14px",
            background: isDarkTheme
              ? "linear-gradient(135deg, rgba(15,23,42,0.28) 0%, rgba(30,41,59,0.22) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.44) 100%)",
            color: isDarkTheme ? "rgba(248,250,252,0.84)" : "rgba(15,23,42,0.78)",
            border: isDarkTheme ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(148,163,184,0.28)",
            whiteSpace: "nowrap",
            boxShadow: isDarkTheme
              ? "0 8px 20px rgba(2,6,23,0.2), inset 0 1px 0 rgba(255,255,255,0.12)"
              : "0 8px 20px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.48)",
            backdropFilter: "blur(10px) saturate(1.08)",
            WebkitBackdropFilter: "blur(10px) saturate(1.08)",
            pointerEvents: "none",
            animation: "hintFloat 2.2s ease-in-out 1",
          }}
        >
          <span>{lang === "en" ? "Music lives here: drag / hover / click" : "这里是音乐控件：可拖动 / 靠近展开 / 点击播放"}</span>
        </div>
      ) : null}
      <style>{`
        @keyframes hintFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
