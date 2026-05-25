import { useEffect, useRef, useState } from "react";
import { Check, Gamepad2, Languages, Menu, Moon, Sun, X } from "lucide-react";
import { useI18n, useSiteContent } from "../i18n";
import { useThemeMode } from "../theme";

interface NavProps {}

const Nav = ({}: NavProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [resumeDownloaded, setResumeDownloaded] = useState(false);
  const resumeToastTimerRef = useRef<number | null>(null);
  const { lang, setLang } = useI18n();
  const { mode, setMode, isTransitioning } = useThemeMode();
  const siteContent = useSiteContent();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setVisible(window.scrollY > window.innerHeight * 0.85);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeToastTimerRef.current) {
        window.clearTimeout(resumeToastTimerRef.current);
      }
    };
  }, []);

  const handleNav = (href: string) => {
    setActive(href);
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };
  const toggleTheme = () => setMode(mode === "light" ? "dark" : "light");

  return (
    <header
      data-cmp="Nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl border-b border-border" : ""
      }`}
      style={{ background: scrolled ? "var(--nav-bg-scrolled)" : "transparent", transition: "background 500ms ease, border-color 500ms ease" }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth: "var(--max-w-content)",
          paddingLeft: "clamp(16px, 3.5vw, var(--space-12))",
          paddingRight: "clamp(16px, 3.5vw, var(--space-12))",
          height: "64px",
        }}
      >
        {/* Desktop Nav */}
        <nav className={`hidden xl:flex items-center justify-center flex-1 transition-all duration-500 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`} style={{ gap: "var(--space-8)" }}>
          <button
            onClick={() => { const el = document.querySelector("#hero-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); else window.scrollTo({ top: window.innerHeight, behavior: "smooth" }); }}
            className="flex items-center transition-all duration-200 hover:scale-105"
            style={{
              gap: "5px",
              fontSize: "var(--text-xs)",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              background: "transparent",
              border: "1px solid rgba(168, 85, 247, 0.5)",
              color: "rgb(168, 85, 247)",
              letterSpacing: "0.04em",
              boxShadow: "0 0 8px rgba(168, 85, 247, 0.2), inset 0 0 6px rgba(168, 85, 247, 0.06)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 14px rgba(168, 85, 247, 0.4), inset 0 0 8px rgba(168, 85, 247, 0.1)"; e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.8)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 8px rgba(168, 85, 247, 0.2), inset 0 0 6px rgba(168, 85, 247, 0.06)"; e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)"; }}
          >
            <Gamepad2 size={13} />
            {lang === "zh" ? "首页" : "Home"}
          </button>
          {siteContent.nav.items.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={`relative group transition-all duration-200 text-center ${
                active === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontSize: "var(--text-sm)", letterSpacing: "0.05em" }}
            >
              {item.label}
              {item.badgeDot && (
                <span
                  className="absolute -top-1.5 -right-2.5 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "rgb(255, 107, 157)" }}
                />
              )}
              <span
                className={`absolute -bottom-0.5 left-0 h-px transition-all duration-300 ${
                  active === item.href ? "w-full bg-primary" : "w-0 bg-primary group-hover:w-full"
                }`}
              />
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden xl:flex items-center" style={{ gap: "var(--space-4)" }}>
          <button
            type="button"
            onClick={toggleTheme}
            disabled={isTransitioning}
            className="flex items-center justify-center border transition-all duration-500 hover:scale-105"
            title={mode === "light" ? (lang === "en" ? "Switch to night mode" : "切换到黑夜模式") : lang === "en" ? "Switch to day mode" : "切换到白天模式"}
            aria-label={mode === "light" ? (lang === "en" ? "Switch to night mode" : "切换到黑夜模式") : lang === "en" ? "Switch to day mode" : "切换到白天模式"}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-full)",
              background: "var(--glass-soft)",
              borderColor: "var(--border)",
              boxShadow: "none",
              opacity: isTransitioning ? 0.75 : 1,
            }}
          >
            <span className="relative overflow-hidden" style={{ width: "20px", height: "20px" }}>
              <Sun
                size={18}
                className="absolute left-1/2 top-1/2"
                style={{
                  color: "rgb(245, 158, 11)",
                  transform: `translate(-50%, -50%) ${mode === "light" ? "translateY(0) rotate(0deg)" : "translateY(140%) rotate(45deg)"}`,
                  opacity: mode === "light" ? 1 : 0,
                  transition: "transform 520ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease",
                }}
              />
              <Moon
                size={18}
                className="absolute left-1/2 top-1/2"
                style={{
                  color: "rgb(148, 163, 184)",
                  transform: `translate(-50%, -50%) ${mode === "dark" ? "translateY(0) rotate(0deg)" : "translateY(-140%) rotate(-35deg)"}`,
                  opacity: mode === "dark" ? 1 : 0,
                  transition: "transform 520ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease",
                }}
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center border transition-all duration-300 hover:scale-105 hover:border-primary text-muted-foreground hover:text-foreground"
            style={{
              gap: "8px",
              fontSize: "var(--text-xs)",
              padding: "8px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--glass-soft)",
              borderColor: "var(--border)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
            title={lang === "zh" ? "Switch to English" : "切换到中文"}
          >
            <Languages size={14} />
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <a
            href={siteContent.nav.cta.href}
            onClick={(e) => {
              e.preventDefault();
              handleNav(siteContent.nav.cta.href);
            }}
            className="font-medium transition-all duration-300 hover:scale-105 kz-shine-btn relative overflow-hidden"
            style={{
              fontSize: "var(--text-sm)",
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              background: "var(--btn-primary-bg)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--btn-primary-shadow)",
              whiteSpace: "nowrap",
            }}
          >
            {siteContent.nav.cta.label}
          </a>
          <div className="relative">
            <a
              href="/resume.pdf"
              download={lang === "zh" ? "谭凯洵简历.pdf" : "Kaixun-Tan-Resume.pdf"}
              onClick={() => {
                setResumeDownloaded(true);
                if (resumeToastTimerRef.current) {
                  window.clearTimeout(resumeToastTimerRef.current);
                }
                resumeToastTimerRef.current = window.setTimeout(() => {
                  setResumeDownloaded(false);
                }, 1800);
              }}
              className={`font-medium transition-all duration-300 hover:scale-105 kz-shine-btn relative overflow-hidden ${
                resumeDownloaded ? "scale-105" : ""
              }`}
              style={{
                fontSize: "var(--text-sm)",
                padding: "8px 20px",
                borderRadius: "var(--radius-full)",
                background: "var(--btn-primary-bg)",
                color: "var(--primary-foreground)",
                boxShadow: "var(--btn-primary-shadow)",
                whiteSpace: "nowrap",
              }}
            >
              {lang === "zh" ? "下载简历" : "Download Resume"}
            </a>
            <span
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 flex items-center transition-all duration-300 ${
                resumeDownloaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-95"
              }`}
              style={{
                gap: "6px",
                fontSize: "var(--text-xs)",
                padding: "6px 10px",
                borderRadius: "var(--radius-full)",
                background: "var(--glass-strong)",
                border: "1px solid var(--accent-soft-border)",
                color: "var(--primary)",
                whiteSpace: "nowrap",
              }}
            >
              <Check size={12} />
              {lang === "zh" ? "下载成功" : "Downloaded"}
            </span>
          </div>
        </div>

        {/* Compact controls for small screens */}
        <div className="xl:hidden flex items-center" style={{ gap: "10px" }}>
          <a
            href="/resume.pdf"
            download={lang === "zh" ? "谭凯洵简历.pdf" : "Kaixun-Tan-Resume.pdf"}
            className="flex items-center font-medium transition-all duration-300"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--glass-soft)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              whiteSpace: "nowrap",
            }}
          >
            {lang === "zh" ? "下载简历" : "Resume"}
          </a>
          <a
            href="tel:+8615305029987"
            className="flex items-center font-medium transition-all duration-300"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--btn-primary-bg)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--btn-primary-shadow)",
              whiteSpace: "nowrap",
            }}
          >
            {lang === "zh" ? "联系我" : "Contact"}
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            disabled={isTransitioning}
            className="flex items-center justify-center border transition-all duration-300 hover:scale-105"
            title={mode === "light" ? (lang === "en" ? "Switch to night mode" : "切换到黑夜模式") : lang === "en" ? "Switch to day mode" : "切换到白天模式"}
            aria-label={mode === "light" ? (lang === "en" ? "Switch to night mode" : "切换到黑夜模式") : lang === "en" ? "Switch to day mode" : "切换到白天模式"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-full)",
              background: "var(--glass-soft)",
              borderColor: "var(--border)",
              opacity: isTransitioning ? 0.75 : 1,
            }}
          >
            {mode === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center border transition-all duration-300 hover:scale-105 hover:border-primary text-muted-foreground hover:text-foreground"
            style={{
              gap: "6px",
              fontSize: "11px",
              padding: "6px 10px",
              borderRadius: "var(--radius-full)",
              background: "var(--glass-soft)",
              borderColor: "var(--border)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
            title={lang === "zh" ? "Switch to English" : "切换到中文"}
          >
            <Languages size={12} />
            {lang === "zh" ? "EN" : "中文"}
          </button>

          <button className={`text-foreground transition-all duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setOpen(!open)} aria-label={lang === "en" ? "Open menu" : "打开菜单"}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div
          className="xl:hidden border-t border-border flex flex-col"
          style={{
            background: "var(--nav-panel-bg)",
            padding: "var(--space-6) clamp(16px, 3.5vw, var(--space-12))",
            gap: "var(--space-4)",
            transition: "background 500ms ease, border-color 500ms ease",
          }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            disabled={isTransitioning}
            className="text-left text-muted-foreground hover:text-primary transition-colors flex items-center"
            style={{ fontSize: "var(--text-sm)", gap: "var(--space-2)" }}
          >
            {mode === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            {mode === "dark" ? (lang === "en" ? "Night mode" : "黑夜模式") : lang === "en" ? "Day mode" : "白天模式"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); const el = document.querySelector("#hero-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); else window.scrollTo({ top: window.innerHeight, behavior: "smooth" }); }}
            className="flex items-center transition-all duration-200"
            style={{
              gap: "6px",
              fontSize: "var(--text-xs)",
              padding: "5px 14px",
              borderRadius: "var(--radius-full)",
              background: "transparent",
              border: "1px solid rgba(168, 85, 247, 0.5)",
              color: "rgb(168, 85, 247)",
              width: "fit-content",
              boxShadow: "0 0 8px rgba(168, 85, 247, 0.2), inset 0 0 6px rgba(168, 85, 247, 0.06)",
            }}
          >
            <Gamepad2 size={13} />
            {lang === "zh" ? "首页" : "Home"}
          </button>
          {siteContent.nav.items.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="text-left text-muted-foreground hover:text-primary transition-colors flex items-center"
              style={{ fontSize: "var(--text-sm)", gap: "var(--space-2)" }}
            >
              {item.label}
              {item.badgeDot && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgb(255, 107, 157)" }} />
              )}
            </button>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <a
              href={siteContent.nav.cta.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(siteContent.nav.cta.href);
              }}
              className="font-medium transition-all duration-300 kz-shine-btn relative overflow-hidden"
              style={{
                fontSize: "var(--text-sm)",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                background: "var(--btn-primary-bg)",
                color: "var(--primary-foreground)",
                boxShadow: "var(--btn-primary-shadow)",
                whiteSpace: "nowrap",
              }}
            >
              {siteContent.nav.cta.label}
            </a>
            <a
              href="/resume.pdf"
              download={lang === "zh" ? "谭凯洵简历.pdf" : "Kaixun-Tan-Resume.pdf"}
              onClick={() => {
                setResumeDownloaded(true);
                if (resumeToastTimerRef.current) {
                  window.clearTimeout(resumeToastTimerRef.current);
                }
                resumeToastTimerRef.current = window.setTimeout(() => {
                  setResumeDownloaded(false);
                }, 1800);
              }}
              className="font-medium transition-all duration-300 kz-shine-btn relative overflow-hidden"
              style={{
                fontSize: "var(--text-sm)",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                background: "var(--btn-primary-bg)",
                color: "var(--primary-foreground)",
                boxShadow: "var(--btn-primary-shadow)",
                whiteSpace: "nowrap",
              }}
            >
              {lang === "zh" ? "下载简历" : "Resume"}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Nav;

