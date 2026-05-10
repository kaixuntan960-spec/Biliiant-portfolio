import { useEffect, useRef } from "react";

/**
 * SoundEffect — 为页面交互元素（按钮/链接）加入微音效
 * 挂载后自动监听全局点击/hover事件
 */
const SoundEffect = ({ enabled = false }: { enabled?: boolean }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<Record<string, number>>({});

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const canPlay = (key: string, minIntervalMs: number) => {
    const now = performance.now();
    const last = lastPlayedRef.current[key] ?? 0;
    if (now - last < minIntervalMs) return false;
    lastPlayedRef.current[key] = now;
    return true;
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.04, detuneCents = 0) => {
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 5200;
      filter.Q.value = 0.65;
      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      osc.detune.value = detuneCents;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // silently fail
    }
  };

  type SfxKind = "click" | "hover" | "glow" | "yay" | "flip" | "pop" | "type";

  const play = (kind: SfxKind) => {
    if (kind === "type") {
      if (!canPlay("type", 38)) return;
      playTone(1760, "sine", 0.012, 0.008, 6);
      return;
    }
    if (kind === "hover") {
      if (!canPlay("hover", 90)) return;
      playTone(1040, "sine", 0.02, 0.014, 10);
      return;
    }
    if (kind === "glow") {
      if (!canPlay("glow", 160)) return;
      playTone(660, "sine", 0.03, 0.012, -12);
      playTone(1760, "sine", 0.02, 0.01, 16);
      return;
    }
    if (kind === "flip") {
      if (!canPlay("flip", 140)) return;
      // soft "woosh" via quick pitch drop
      playTone(920, "triangle", 0.05, 0.028, -18);
      playTone(520, "sine", 0.06, 0.018, -28);
      return;
    }
    if (kind === "pop") {
      if (!canPlay("pop", 160)) return;
      // pop / modal appear
      playTone(740, "sine", 0.03, 0.02, 8);
      playTone(1480, "triangle", 0.018, 0.014, 18);
      return;
    }
    if (kind === "yay") {
      if (!canPlay("yay", 180)) return;
      // "yeah!" bright confirmation (tiny up-chord)
      playTone(784, "triangle", 0.05, 0.03, -6); // G5
      playTone(988, "sine", 0.04, 0.018, 6); // B5-ish
      playTone(1175, "sine", 0.035, 0.016, 10); // D6-ish
      return;
    }
    // default click
    if (!canPlay("click", 70)) return;
    playTone(880, "triangle", 0.04, 0.045, -6);
    playTone(1320, "sine", 0.028, 0.018, 8);
  };

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-sfx-off='true']")) return;
      const explicit = target.closest("[data-sfx]")?.getAttribute("data-sfx") as SfxKind | null;
      if (explicit) {
        play(explicit);
        return;
      }
      const isInteractive = Boolean(
        target.closest("button") ||
          target.closest("a") ||
          target.getAttribute("role") === "button" ||
          target.getAttribute("data-sfx") === "click",
      );
      if (isInteractive) play("click");
    };

    const handlePointerOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // avoid noisy hover on mobile
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-sfx-off='true']")) return;

      const explicit = target.closest("[data-sfx-hover]")?.getAttribute("data-sfx-hover");
      if (explicit === "glow") {
        play("glow");
        return;
      }

      const isBtn = Boolean(target.closest("button") || target.closest("a") || target.getAttribute("role") === "button");
      if (isBtn) play("hover");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-sfx-off='true']")) return;
      const isTypingTarget =
        target.tagName === "TEXTAREA" ||
        (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "checkbox" && (target as HTMLInputElement).type !== "radio") ||
        target.getAttribute("contenteditable") === "true";
      if (!isTypingTarget) return;
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
        play("type");
      }
    };

    const handleSfxEvent = (e: Event) => {
      const ce = e as CustomEvent<{ kind?: SfxKind }>;
      const kind = ce.detail?.kind;
      if (!kind) return;
      play(kind);
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("sfx", handleSfxEvent as EventListener);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("sfx", handleSfxEvent as EventListener);
    };
  }, [enabled]);

  return null;
};

export default SoundEffect;
