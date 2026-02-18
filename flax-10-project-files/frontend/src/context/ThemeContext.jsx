import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function useThemeState(initialTheme) {
  const [theme, setThemeRaw] = useState(initialTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setThemeRaw((prev) => (prev === 'light' ? 'dark' : 'light'));
  return { theme, setTheme: setThemeRaw, toggleTheme };
}

export function ThemeProvider({ children, initialTheme = 'light' }) {
  const { theme, setTheme, toggleTheme } = useThemeState(initialTheme);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}