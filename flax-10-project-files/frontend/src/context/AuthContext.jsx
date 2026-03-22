/*
 * Shared auth session and profile context.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getUserProfile } from "../api/userApi";

const AuthContext = createContext(null);

function readStoredUser() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function mergeStoredUser(user, profile) {
  const nextUser = { ...(user || {}), ...profile };
  localStorage.setItem("user", JSON.stringify(nextUser));
  return nextUser;
}

function useAuthSessionState() {
  const [user, setUser] = useState(readStoredUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem("token"));
  return { user, setUser, profile, setProfile, loading, setLoading, authenticated, setAuthenticated };
}

function stopLoading(setLoading) {
  setLoading(false);
}

function syncProfile(setProfile, setUser, data) {
  setProfile(data);
  if (!data) return;
  setUser((current) => mergeStoredUser(current, data));
}

function logProfileError(error) {
  console.error("Failed to fetch user profile:", error);
}

function useRefreshProfile(authenticated, setLoading, setProfile, setUser) {
  return useCallback(() => {
    if (!authenticated) return stopLoading(setLoading);
    return getUserProfile()
      .then((data) => syncProfile(setProfile, setUser, data))
      .catch(logProfileError)
      .finally(() => stopLoading(setLoading));
  }, [authenticated, setLoading, setProfile, setUser]);
}

function clearAuthState(setProfile, setUser) {
  setProfile(null);
  setUser(null);
}

function syncAuthChange(setAuthenticated, setProfile, setUser) {
  const isAuthenticated = !!localStorage.getItem("token");
  setAuthenticated(isAuthenticated);
  if (!isAuthenticated) clearAuthState(setProfile, setUser);
}

function useAuthChangeListener(setAuthenticated, setProfile, setUser) {
  useEffect(() => {
    const handleAuthChange = () =>
      syncAuthChange(setAuthenticated, setProfile, setUser);
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, [setAuthenticated, setProfile, setUser]);
}

function getContextValue(state, refreshProfile) {
  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    authenticated: state.authenticated,
    refreshProfile,
    setAuthenticated: state.setAuthenticated,
  };
}

export function AuthProvider({ children }) {
  const state = useAuthSessionState();
  const refreshProfile = useRefreshProfile(
    state.authenticated,
    state.setLoading,
    state.setProfile,
    state.setUser,
  );
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);
  useAuthChangeListener(state.setAuthenticated, state.setProfile, state.setUser);
  return <AuthContext.Provider value={getContextValue(state, refreshProfile)}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
