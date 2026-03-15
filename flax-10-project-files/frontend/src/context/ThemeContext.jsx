import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchApi } from '../api/client';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

async function logThemeSession(theme, startedAt) {
  const endedAt = new Date().toISOString();
  if (new Date(endedAt) - new Date(startedAt) < 60000) return;
  try {
    await fetchApi('/analytics/theme-session/', {
      method: 'POST',
      body: JSON.stringify({ theme, started_at: startedAt, ended_at: endedAt }),
    });
  } catch { /* silently fail */ }
}

function getStored(key, valid, fallback) {
  const stored = localStorage.getItem(key);
  return valid.includes(stored) ? stored : fallback;
}

const VALID_MODES = ['light', 'dark'];
const VALID_THEMES = ['flax', 'coral', 'rust', 'amber', 'ocean', 'indigo', 'teal', 'forest', 'rose', 'lavender', 'mint', 'sand'];

export function ThemeProvider({ children, initialTheme, initialMode }) {
  const [mode, setModeState] = useState(() => initialMode || getStored('mode', VALID_MODES, 'light'));
  const [theme, setThemeState] = useState(() => initialTheme || getStored('colorTheme', VALID_THEMES, 'flax'));
  const sessionStart = useRef(new Date().toISOString());
  const currentTheme = useRef(theme);

  // Sync state if props change (e.g. after backend fetch completes)
  useEffect(() => {
    if (initialMode && VALID_MODES.includes(initialMode)) setModeState(initialMode);
    if (initialTheme && VALID_THEMES.includes(initialTheme)) setThemeState(initialTheme);
  }, [initialMode, initialTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('colorTheme', theme);
  }, [theme]);

  useEffect(() => {
    const handleUnload = () => logThemeSession(currentTheme.current, sessionStart.current);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  function setMode(newMode) {
    if (newMode === mode) return;
    setModeState(newMode);
  }

  function setTheme(newTheme) {
    if (newTheme === theme) return;
    logThemeSession(currentTheme.current, sessionStart.current);
    sessionStart.current = new Date().toISOString();
    currentTheme.current = newTheme;
    setThemeState(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}