/*
 * Root app state wiring for auth, theme, and nav.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasSeenWelcome, isBannedFromStorage, persistActiveNav, readActiveNav } from "../storage";
import { useThemeState } from "./useThemeState";

function useActiveNavState() {
  const [activeNav, setActiveNavState] = useState(readActiveNav);
  const setActiveNav = useCallback((nav) => {
    persistActiveNav(nav);
    setActiveNavState(nav);
  }, []);
  return { activeNav, setActiveNav };
}

function useAuthSnapshot() {
  const { authenticated: authed, loading: authLoading, profile, user } = useAuth();
  return { authLoading, authed, profile, user };
}

export function useAppState() {
  const { activeNav, setActiveNav } = useActiveNavState();
  const { authLoading, authed, profile, user } = useAuthSnapshot();
  const previousAuthed = useRef(authed);
  const [isBanned] = useState(isBannedFromStorage());
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome());
  const { initialMode, initialTheme, isLoadingTheme } = useThemeState(authed);
  useEffect(() => {
    if (previousAuthed.current === authed) return;
    previousAuthed.current = authed;
    setActiveNav("home");
  }, [authed, setActiveNav]);
  return { activeNav, setActiveNav, initialTheme, initialMode, isLoadingTheme: isLoadingTheme || authLoading, user, profile, authed, showWelcome, setShowWelcome, isBanned };
}
