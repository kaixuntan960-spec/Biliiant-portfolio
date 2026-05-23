import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Save scroll position to sessionStorage on scroll, restore on page reload.
 * Retries via requestAnimationFrame until content height accommodates the saved
 * position, handling async-loaded images and manifest data.
 */
export function useScrollRestore() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `scroll:${location.pathname}`;

    // Prevent the browser's built-in (often unreliable) scroll restoration
    // from competing with our manual approach.
    if (history.scrollRestoration !== "manual") {
      history.scrollRestoration = "manual";
    }

    // --- Restore on hard reload ---
    try {
      const nav =
        performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === "reload") {
        const saved = sessionStorage.getItem(key);
        if (saved) {
          const targetY = parseInt(saved, 10);
          let attempts = 0;
          const tryRestore = () => {
            attempts++;
            const scrollHeight = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
            );
            if (scrollHeight > targetY || attempts > 300) {
              window.scrollTo(0, targetY);
            } else {
              requestAnimationFrame(tryRestore);
            }
          };
          requestAnimationFrame(tryRestore);
        }
      }
    } catch {
      // performance API or sessionStorage not available
    }

    // --- Save scroll position ---
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        try {
          sessionStorage.setItem(key, String(window.scrollY));
        } catch {
          // sessionStorage not available
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname]);
}
