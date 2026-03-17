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

function useThemeSession(theme, setThemeState) {
  const sessionStart = useRef(new Date().toISOString());
  const currentTheme = useRef(theme);

  useEffect(() => {
    const handleUnload = () => logThemeSession(currentTheme.current, sessionStart.current);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  function applyThemeChange(newTheme) {
    logThemeSession(currentTheme.current, sessionStart.current);
    sessionStart.current = new Date().toISOString();
    currentTheme.current = newTheme;
    setThemeState(newTheme);
  }

  return { applyThemeChange };
}

const VALID_MODES = ['light', 'dark'];
const VALID_THEMES = ['flax', 'coral', 'rust', 'amber', 'ocean', 'indigo', 'teal', 'forest', 'rose', 'lavender', 'mint', 'sand'];

export function ThemeProvider({ children, initialTheme, initialMode }) {
  const [mode, setModeState] = useState(() => initialMode || getStored('mode', VALID_MODES, 'light'));
  const [theme, setThemeState] = useState(() => initialTheme || getStored('colorTheme', VALID_THEMES, 'flax'));
  const { applyThemeChange } = useThemeSession(theme, setThemeState);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('colorTheme', theme);
  }, [theme]);

  function setMode(newMode) {
    if (newMode !== mode && VALID_MODES.includes(newMode)) {
        setModeState(newMode);
    }
  }

  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

  function setTheme(newTheme) {
    if (newTheme !== theme && VALID_THEMES.includes(newTheme)) {
        applyThemeChange(newTheme);
    }
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}