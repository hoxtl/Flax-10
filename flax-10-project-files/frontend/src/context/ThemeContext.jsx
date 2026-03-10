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
  } catch {
    // silently fail
  }
}

function getStoredMode(fallback) {
  const stored = localStorage.getItem('mode');
  return stored === 'light' || stored === 'dark' ? stored : fallback;
}

function getStoredTheme(fallback = 'flax') {
  return localStorage.getItem('theme') || fallback;
}

export function ThemeProvider({ children, initialMode = 'light' }) {
  const [mode, setModeState] = useState(() => getStoredMode(initialMode));
  const [theme, setThemeState] = useState(() => getStoredTheme());
  const sessionStart = useRef(new Date().toISOString());
  const currentTheme = useRef(theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
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