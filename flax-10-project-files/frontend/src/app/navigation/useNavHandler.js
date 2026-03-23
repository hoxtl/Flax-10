import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../lib/routes";

const processors = [
  handleSocietyNav,
  handleGroupWorkNav,
  handleProfileNav,
  handleProfileUserNav,
  handleSettingsNav,
  handleAbsoluteNav,
  handleRouteNav,
  handleFallbackNav,
];

export function useNavHandler(setActiveNav) {
  const navigate = useNavigate();
  const handler = useCallback((id) => {
    processors.some((fn) => fn(id, setActiveNav, navigate));
  }, [navigate, setActiveNav]);
  useEffect(() => {
    const listener = (event) => handler(event.detail);
    window.addEventListener("navigate", listener);
    return () => window.removeEventListener("navigate", listener);
  }, [handler]);
  return handler;
}

function handleSocietyNav(id, setActiveNav, navigate) {
  if (!id.startsWith("societies_")) return false;
  const [, socId, tab] = id.split("_");
  const query = tab ? `?id=${socId}&tab=${tab}` : `?id=${socId}`;
  setActiveNav("societies");
  navigate(`/societies${query}`);
  return true;
}

function handleGroupWorkNav(id, _setActiveNav, navigate) {
  if (!id.startsWith("group-work_")) return false;
  const [, projectId, tab] = id.split("_");
  const query = tab ? `?project=${projectId}&tab=${tab}` : `?project=${projectId}`;
  navigate(`/group-work${query}`);
  return true;
}

function handleProfileNav(id, setActiveNav, navigate) {
  if (id !== "profile") return false;
  setActiveNav("profile");
  navigate("/profile");
  return true;
}

function handleProfileUserNav(id, setActiveNav, navigate) {
  if (!id.startsWith("profile_")) return false;
  const viewedUserId = id.split("_")[1];
  setActiveNav(id);
  navigate(`/profile/${viewedUserId}`);
  return true;
}

function handleSettingsNav(id, setActiveNav, navigate) {
  if (id !== "settings") return false;
  setActiveNav("settings");
  navigate("/settings");
  return true;
}

function handleAbsoluteNav(id, _setActiveNav, navigate) {
  if (!id.startsWith("/")) return false;
  navigate(id);
  return true;
}

function handleRouteNav(id, setActiveNav, navigate) {
  const [base] = id.split("?");
  const route = APP_ROUTES.find((entry) => entry.id === base);
  if (!route) return false;
  setActiveNav(base);
  const query = id.includes("?") ? id.slice(id.indexOf("?")) : "";
  navigate(`${route.path}${query}`);
  return true;
}

function handleFallbackNav(id, setActiveNav) {
  setActiveNav(id);
  return true;
}
