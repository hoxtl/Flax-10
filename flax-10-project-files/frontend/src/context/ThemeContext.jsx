/*
 * Theme mode and palette context.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchApi } from "../api/client";

const ThemeContext = createContext();
const VALID_MODES = ["light", "dark"];
const VALID_THEMES = ["flax", "coral", "rust", "amber", "ocean", "indigo", "teal", "forest", "rose", "lavender", "mint", "sand"];

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

async function logThemeSession(theme, startedAt) {
  const endedAt = new Date().toISOString();
  if (new Date(endedAt) - new Date(startedAt) < 60000) return;
  try {
    await fetchApi("/analytics/theme-session/", {
      method: "POST",
      body: JSON.stringify({ theme, started_at: startedAt, ended_at: endedAt }),
    });
  } catch {}
}

function getStored(key, valid, fallback) {
  const stored = localStorage.getItem(key);
  return valid.includes(stored) ? stored : fallback;
}

function useThemeSession(theme, setThemeState) {
  const currentTheme = useRef(theme);
  const sessionStart = useRef(new Date().toISOString());
  useEffect(() => bindThemeUnload(currentTheme, sessionStart), []);
  return { applyThemeChange: (nextTheme) => applyThemeChange(currentTheme, sessionStart, nextTheme, setThemeState) };
}

function bindThemeUnload(currentTheme, sessionStart) {
  const handleUnload = () => logThemeSession(currentTheme.current, sessionStart.current);
  window.addEventListener("beforeunload", handleUnload);
  return () => window.removeEventListener("beforeunload", handleUnload);
}

function applyThemeChange(currentTheme, sessionStart, nextTheme, setThemeState) {
  logThemeSession(currentTheme.current, sessionStart.current);
  currentTheme.current = nextTheme;
  sessionStart.current = new Date().toISOString();
  setThemeState(nextTheme);
}

function useThemePreferences(initialTheme, initialMode) {
  const [mode, setModeState] = useState(() => initialMode || getStored("mode", VALID_MODES, "light"));
  const [theme, setThemeState] = useState(() => initialTheme || getStored("colorTheme", VALID_THEMES, "flax"));
  return { mode, setModeState, theme, setThemeState };
}

function usePersistedAttribute(attribute, storageKey, value) {
  useEffect(() => {
    document.documentElement.setAttribute(attribute, value);
    localStorage.setItem(storageKey, value);
  }, [attribute, storageKey, value]);
}

function isValidChange(nextValue, currentValue, validValues) {
  return nextValue !== currentValue && validValues.includes(nextValue);
}

function useThemeControls(mode, setModeState, theme, applyThemeChange) {
  const setMode = (nextMode) => isValidChange(nextMode, mode, VALID_MODES) && setModeState(nextMode);
  const setTheme = (nextTheme) => isValidChange(nextTheme, theme, VALID_THEMES) && applyThemeChange(nextTheme);
  return { setMode, setTheme, toggleMode: () => setMode(mode === "light" ? "dark" : "light") };
}

export function ThemeProvider({ children, initialTheme, initialMode }) {
  const { mode, setModeState, theme, setThemeState } = useThemePreferences(initialTheme, initialMode);
  const { applyThemeChange } = useThemeSession(theme, setThemeState);
  const controls = useThemeControls(mode, setModeState, theme, applyThemeChange);
  usePersistedAttribute("data-mode", "mode", mode);
  usePersistedAttribute("data-theme", "colorTheme", theme);
  return <ThemeContext.Provider value={{ mode, theme, ...controls }}>{children}</ThemeContext.Provider>;
}
