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

export function ThemeProvider({ children, initialTheme = 'light' }) {
  const [theme, setThemeState] = useState(initialTheme);
  const sessionStart = useRef(new Date().toISOString());
  const currentTheme = useRef(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleUnload = () => logThemeSession(currentTheme.current, sessionStart.current);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    logThemeSession(currentTheme.current, sessionStart.current);
    sessionStart.current = new Date().toISOString();
    currentTheme.current = newTheme;
    setThemeState(newTheme);
  }

  function setTheme(newTheme) {
    if (newTheme === theme) return;
    logThemeSession(currentTheme.current, sessionStart.current);
    sessionStart.current = new Date().toISOString();
    currentTheme.current = newTheme;
    setThemeState(newTheme);
  }

export function ThemeProvider({ children, initialTheme = 'light' }) {
  const { theme, setTheme, toggleTheme } = useThemeState(initialTheme);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
