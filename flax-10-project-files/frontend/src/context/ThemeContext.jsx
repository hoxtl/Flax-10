/*
 * Theme mode and palette context.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchApi } from "../api/client";
import { updateUserSettings } from "../api/userApi";

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

function useThemeSession(mode, setModeState) {
  const currentMode = useRef(mode);
  const sessionStart = useRef(new Date().toISOString());
  useEffect(() => bindThemeUnload(currentMode, sessionStart), []);
  return { applyModeChange: (nextMode) => applyThemeChange(currentMode, sessionStart, nextMode, setModeState) };
}

function bindThemeUnload(currentMode, sessionStart) {
  const handleUnload = () => logThemeSession(currentMode.current, sessionStart.current);
  window.addEventListener("beforeunload", handleUnload);
  return () => window.removeEventListener("beforeunload", handleUnload);
}

function applyThemeChange(currentMode, sessionStart, nextMode, setModeState) {
  logThemeSession(currentMode.current, sessionStart.current);
  currentMode.current = nextMode;
  sessionStart.current = new Date().toISOString();
  setModeState(nextMode);
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
    // Explicitly declare color-scheme so the browser never applies automatic
    // dark-mode inversion (e.g. Chrome "Auto Dark Mode for Web Contents").
    if (attribute === "data-mode") {
      document.documentElement.style.colorScheme = value;
    }
  }, [attribute, storageKey, value]);
}

function usePersistedTheme(theme) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("colorTheme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
}

function isValidChange(nextValue, currentValue, validValues) {
  return nextValue !== currentValue && validValues.includes(nextValue);
}

function useThemeControls(mode, applyModeChange, theme, setThemeState) {
  const setMode = (nextMode) => isValidChange(nextMode, mode, VALID_MODES) && applyModeChange(nextMode);
  const setTheme = (nextTheme) => isValidChange(nextTheme, theme, VALID_THEMES) && setThemeState(nextTheme);
  return { setMode, setTheme, toggleMode: () => setMode(mode === "light" ? "dark" : "light") };
}

function useThemePersistence(mode, theme) {
  const lastSaved = useRef({ mode: null, theme: null });
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (lastSaved.current.mode === mode && lastSaved.current.theme === theme) return;
    lastSaved.current = { mode, theme };
    updateUserSettings({ mode, theme }).catch(() => {});
  }, [mode, theme]);
}

export function ThemeProvider({ children, initialTheme, initialMode }) {
  const { mode, setModeState, theme, setThemeState } = useThemePreferences(initialTheme, initialMode);
  const { applyModeChange } = useThemeSession(mode, setModeState);
  const controls = useThemeControls(mode, applyModeChange, theme, setThemeState);
  usePersistedAttribute("data-mode", "mode", mode);
  usePersistedTheme(theme);
  useThemePersistence(mode, theme);
  return <ThemeContext.Provider value={{ mode, theme, ...controls }}>{children}</ThemeContext.Provider>;
}
