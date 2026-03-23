import { useState, useEffect } from "react";
import { loadTheme } from "../theme";

export function useThemeState(authed) {
  const [initialTheme, setInitialTheme] = useState("flax");
  const [initialMode, setInitialMode] = useState("light");
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  useEffect(() => {
    loadTheme(authed, setInitialTheme, setInitialMode, setIsLoadingTheme);
  }, [authed]);
  return { initialTheme, initialMode, isLoadingTheme };
}
