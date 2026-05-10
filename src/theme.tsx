import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
  isTransitioning: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getThemeByTime = (): ResolvedTheme => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const PHASE_MS = 520;
  const [mode, setModeState] = useState<ThemeMode>(getThemeByTime());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(getThemeByTime());
  const [transitionTo, setTransitionTo] = useState<ThemeMode | null>(null);
  const [transitionActive, setTransitionActive] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("portfolio_theme_mode");
      if (stored === "light" || stored === "dark") setModeState(stored);
      if (stored === "auto") setModeState(getThemeByTime());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setResolvedTheme(mode);
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const setMode = (next: ThemeMode) => {
    if (next === mode || transitionTo) return;
    // Sequential animation: outgoing finishes, then incoming starts (no overlap).
    const SWITCH_AT_MS = 520;
    const HOLD_MS = 260;
    const END_AT_MS = PHASE_MS * 2 + HOLD_MS;

    setTransitionTo(next);
    setTransitionActive(false);
    window.requestAnimationFrame(() => {
      setTransitionActive(true);
    });

    window.setTimeout(() => {
      setModeState(next);
      try {
        localStorage.setItem("portfolio_theme_mode", next);
      } catch {
        // ignore
      }
    }, SWITCH_AT_MS);

    window.setTimeout(() => {
      setTransitionActive(false);
      setTransitionTo(null);
    }, END_AT_MS);

    return;
  };

  const persistMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem("portfolio_theme_mode", next);
    } catch {
      // ignore
    }
  };

  const cycleMode = () => {
    persistMode(mode === "light" ? "dark" : "light");
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedTheme, setMode, cycleMode, isTransitioning: Boolean(transitionTo) }),
    [mode, resolvedTheme, transitionTo],
  );

  const goingDark = transitionTo === "dark";

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {transitionTo && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 10001,
            opacity: transitionActive && transitionTo ? 1 : 0,
            transition: "opacity 320ms ease",
            background:
              transitionTo === "dark"
                ? "linear-gradient(180deg, rgba(28,30,45,0.32) 0%, rgba(8,9,14,0.5) 100%)"
                : "linear-gradient(180deg, rgba(120,190,255,0.22) 0%, rgba(255,236,169,0.22) 100%)",
          }}
        >
          <style>
            {`
              /* Phase-based: first element exits, then second enters (no overlap). */
              @keyframes themeExitDown {
                0% { transform: translate(-50%, -50%) translateY(0px) scale(1) rotate(0deg); opacity: 1; }
                52% { transform: translate(-50%, -50%) translateY(58px) scale(0.9) rotate(10deg); opacity: 0.7; }
                100% { transform: translate(-50%, -50%) translateY(120px) scale(0.72) rotate(18deg); opacity: 0; }
              }
              @keyframes themeEnterUp {
                0% { transform: translate(-50%, -50%) translateY(120px) scale(0.72) rotate(-14deg); opacity: 0; }
                68% { transform: translate(-50%, -50%) translateY(-10px) scale(1.1) rotate(6deg); opacity: 1; }
                100% { transform: translate(-50%, -50%) translateY(0px) scale(1) rotate(0deg); opacity: 1; }
              }
            `}
          </style>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              style={{
                position: "relative",
                width: "180px",
                height: "180px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(2px)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) ${goingDark ? "translateY(0px)" : "translateY(112px)"}`,
                  opacity: 0,
                  willChange: "transform, opacity",
                  animation: transitionActive
                    ? goingDark
                      ? `themeExitDown ${PHASE_MS}ms cubic-bezier(0.22, 1, 0.32, 1) forwards`
                      : `themeEnterUp ${PHASE_MS}ms cubic-bezier(0.22, 1, 0.32, 1) ${PHASE_MS}ms both`
                    : "none",
                  fontSize: "64px",
                  filter: "drop-shadow(0 8px 12px rgba(255,176,64,0.28))",
                }}
              >
                ☀️
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) ${goingDark ? "translateY(112px)" : "translateY(0px)"}`,
                  opacity: 0,
                  willChange: "transform, opacity",
                  animation: transitionActive
                    ? goingDark
                      ? `themeEnterUp ${PHASE_MS}ms cubic-bezier(0.22, 1, 0.32, 1) ${PHASE_MS}ms both`
                      : `themeExitDown ${PHASE_MS}ms cubic-bezier(0.22, 1, 0.32, 1) forwards`
                    : "none",
                  fontSize: "56px",
                  filter: "drop-shadow(0 7px 10px rgba(148,163,184,0.34))",
                }}
              >
                🌙
              </div>
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return ctx;
}

