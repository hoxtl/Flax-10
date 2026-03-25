import { APP_ROUTES } from "../../lib/routes";
import { markWelcomeSeen, clearAuthStorage } from "../storage";

export function resolveScreen(authed, user, showWelcome) {
  if (!authed || !user) return "auth";
  if (showWelcome) return "welcome";
  return "app";
}

export function resolveRouteContent(activeNav, user, setActiveNav) {
  const [base, ...rest] = activeNav.split("_");
  const navParam = rest.join("_");
  const route = APP_ROUTES.find((entry) => entry.id === base) || APP_ROUTES[0];
  if (!route?.element || typeof route.element !== "object") return route?.element;
  const props = buildRouteProps(base, navParam, user, setActiveNav, route.element.props);
  return { ...route.element, props };
}

function buildRouteProps(baseNav, navParam, user, setActiveNav, existingProps = {}) {
  const extra = { user, onNavChange: setActiveNav, onBack: () => setActiveNav("home") };
  if (baseNav === "modules" && navParam === "create") extra.initialCreate = true;
  if (baseNav === "modules" && navParam && navParam !== "create") extra.initialSearch = navParam;
  return { ...existingProps, ...extra };
}

export function onExplore(setShowWelcome, setActiveNav) {
  markWelcomeSeen();
  setShowWelcome(false);
  setActiveNav("home");
}

export function onBackToAuth() {
  clearAuthStorage();
  window.dispatchEvent(new Event("auth-changed"));
}
