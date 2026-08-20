"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Language, translate } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const VALID_LANGUAGES: Language[] = ["uz", "en", "ru"];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "uz";
    const stored = localStorage.getItem("financeai_language");
    return stored && VALID_LANGUAGES.includes(stored as Language) ? (stored as Language) : "uz";
  });

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem("financeai_language", lang);
  }

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak");
  return ctx;
}
