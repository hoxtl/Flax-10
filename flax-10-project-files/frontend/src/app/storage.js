import { ACTIVE_NAV_KEY, WELCOME_SEEN_KEY } from "./constants";

export function readUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export function isBannedFromStorage() {
  return localStorage.getItem("banned") === "1";
}

export function readActiveNav() {
  return localStorage.getItem(ACTIVE_NAV_KEY) || "home";
}

export function persistActiveNav(nav) {
  localStorage.setItem(ACTIVE_NAV_KEY, nav);
}

export function markWelcomeSeen() {
  localStorage.setItem(WELCOME_SEEN_KEY, "1");
}

export function hasSeenWelcome() {
  return localStorage.getItem(WELCOME_SEEN_KEY) === "1";
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(WELCOME_SEEN_KEY);
  localStorage.removeItem(ACTIVE_NAV_KEY);
}
