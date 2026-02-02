"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "day" | "night";
type ThemePreset = "lilac" | "mint" | "ocean" | "sunset" | "aurora" | "berry" | "citrus";

type ThemeCtx = {
  theme: ThemeMode;
  preset: ThemePreset;
  setTheme: (t: ThemeMode) => void;
  setPreset: (p: ThemePreset) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyThemeToHtml(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

function applyPresetToHtml(preset: ThemePreset) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.preset = preset;
}

export default function ThemeClient({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "day";
    try {
      const saved = localStorage.getItem("asukaTheme");
      return saved === "night" ? "night" : "day";
    } catch {
      return "day";
    }
  });
  const [preset, setPresetState] = useState<ThemePreset>(() => {
    if (typeof window === "undefined") return "lilac";
    try {
      const saved = localStorage.getItem("asukaPreset");
      if (
        saved === "mint" ||
        saved === "ocean" ||
        saved === "sunset" ||
        saved === "lilac" ||
        saved === "aurora" ||
        saved === "berry" ||
        saved === "citrus"
      ) {
        return saved;
      }
      return "lilac";
    } catch {
      return "lilac";
    }
  });

  // persist + apply
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("asukaTheme", theme);
      } catch {
        // ignore storage errors
      }
    }
    applyThemeToHtml(theme);
  }, [theme]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("asukaPreset", preset);
      } catch {
        // ignore storage errors
      }
    }
    applyPresetToHtml(preset);
  }, [preset]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "asukaTheme" && (e.newValue === "day" || e.newValue === "night")) {
        setThemeState(e.newValue);
      }
      if (e.key === "asukaPreset") {
        if (
          e.newValue === "mint" ||
          e.newValue === "ocean" ||
          e.newValue === "sunset" ||
          e.newValue === "lilac" ||
          e.newValue === "aurora" ||
          e.newValue === "berry" ||
          e.newValue === "citrus"
        ) {
          setPresetState(e.newValue);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<ThemeCtx>(() => {
    return {
      theme,
      preset,
      setTheme: (t) => setThemeState(t),
      setPreset: (p) => setPresetState(p),
      toggleTheme: () => setThemeState((t) => (t === "day" ? "night" : "day")),
    };
  }, [theme, preset]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeClient");
  return ctx;
}
