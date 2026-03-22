import { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { readActiveNav, persistActiveNav, isBannedFromStorage, hasSeenWelcome } from "../storage";
import { useThemeState } from "./useThemeState";

export function useAppState() {
  const { user, authenticated: authed, profile, loading: authLoading } = useAuth();
  const [activeNav, setActiveNavState] = useState(readActiveNav);
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome());
  const [isBanned] = useState(isBannedFromStorage());
  const { initialTheme, initialMode, isLoadingTheme } = useThemeState(authed);
  const setActiveNav = useCallback((nav) => {
    persistActiveNav(nav);
    setActiveNavState(nav);
  }, []);
  return {
    activeNav,
    setActiveNav,
    initialTheme,
    initialMode,
    isLoadingTheme: isLoadingTheme || authLoading,
    user,
    profile,
    authed,
    showWelcome,
    setShowWelcome,
    isBanned,
  };
}
