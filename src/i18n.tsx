import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { siteContentEn, siteContentZh, type SiteContent } from "./content/site";

export type Language = "zh" | "en";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  content: SiteContent;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("zh");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("portfolio_lang");
      if (stored === "zh" || stored === "en") setLangState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem("portfolio_lang", next);
    } catch {
      // ignore
    }
  };

  const content = useMemo(() => (lang === "en" ? siteContentEn : siteContentZh), [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, content }), [lang, content]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

export function useSiteContent() {
  return useI18n().content;
}

