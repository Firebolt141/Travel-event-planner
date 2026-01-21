"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "day" | "night";

type ThemeCtx = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyThemeToHtml(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export default function ThemeClient({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("day");

  // init
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("asukaTheme") : null;
    const initial: ThemeMode = saved === "night" ? "night" : "day";
    setThemeState(initial);
    applyThemeToHtml(initial);
  }, []);

  // persist + apply
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("asukaTheme", theme);
    applyThemeToHtml(theme);
  }, [theme]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "asukaTheme" && (e.newValue === "day" || e.newValue === "night")) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<ThemeCtx>(() => {
    return {
      theme,
      setTheme: (t) => setThemeState(t),
      toggleTheme: () => setThemeState((t) => (t === "day" ? "night" : "day")),
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeClient");
  return ctx;
}
