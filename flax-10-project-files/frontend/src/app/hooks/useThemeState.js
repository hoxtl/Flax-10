import { useState, useEffect } from "react";
import { loadTheme, readStoredThemePrefs } from "../theme";

export function useThemeState(authed) {
  const stored = readStoredThemePrefs();
  const [initialTheme, setInitialTheme] = useState(stored.theme);
  const [initialMode, setInitialMode] = useState(stored.mode);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  useEffect(() => {
    loadTheme(authed, setInitialTheme, setInitialMode, setIsLoadingTheme);
  }, [authed]);
  return { initialTheme, initialMode, isLoadingTheme };
}
