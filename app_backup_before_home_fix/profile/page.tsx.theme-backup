"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "nightnow-theme";
const THEME_EVENT = "nightnow-theme-change";

function getSystemDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyNightNowTheme(value: ThemeMode) {
  if (typeof document === "undefined") return;

  const shouldBeDark =
    value === "dark" ||
    (value === "system" && getSystemDark());

  document.documentElement.classList.toggle("dark", shouldBeDark);
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = shouldBeDark ? "dark" : "light";
}

export function setNightNowTheme(value: ThemeMode) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, value);
  applyNightNowTheme(value);
  window.dispatchEvent(
    new CustomEvent(THEME_EVENT, { detail: value })
  );
}

export function getNightNowTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" || saved === "system"
    ? saved
    : "system";
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const initial = getNightNowTheme();
    setTheme(initial);
    applyNightNowTheme(initial);

    const onThemeChange = (event: Event) => {
      const value = (event as CustomEvent<ThemeMode>).detail;
      if (value !== "light" && value !== "dark" && value !== "system") return;
      setTheme(value);
      applyNightNowTheme(value);
    };

    const onSystemChange = () => {
      const current = getNightNowTheme();
      if (current === "system") applyNightNowTheme("system");
    };

    window.addEventListener(THEME_EVENT, onThemeChange);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onSystemChange);

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChange);
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  void theme;
  return <>{children}</>;
}