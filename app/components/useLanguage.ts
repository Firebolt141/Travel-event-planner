"use client";

import { useEffect, useMemo, useState } from "react";
import { Language, translations } from "@/lib/translations";

const storageKey = "asuka_lang";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(storageKey);
    return stored === "ja" || stored === "en" ? stored : "en";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language === "ja" ? "ja" : "en";
  }, [language]);

  const strings = useMemo(() => translations[language], [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ja" : "en"));
  };

  return {
    language,
    strings,
    toggleLanguage,
  };
}
