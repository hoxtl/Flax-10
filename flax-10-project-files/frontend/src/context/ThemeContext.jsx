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

function getStoredTheme(fallback) {
    const stored = localStorage.getItem('theme');
    return stored === 'light' || stored === 'dark' ? stored : fallback;
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

export function ThemeProvider({ children, initialTheme = 'light' }) {
  const [theme, setThemeState] = useState(() => getStoredTheme(initialTheme));
  const { applyThemeChange } = useThemeSession(theme, setThemeState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => applyThemeChange(theme === 'light' ? 'dark' : 'light');
  const setTheme = (newTheme) => { if (newTheme !== theme) applyThemeChange(newTheme); };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}