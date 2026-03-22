import { useEffect } from "react";
import { APP_ROUTES } from "../../lib/routes";

export function useSyncNavFromUrl(pathname, setActiveNav) {
  useEffect(() => {
    const path = pathname || "/";
    if (path === "/profile") {
      setActiveNav("profile");
      return;
    }
    const viewedUserId = path.startsWith("/profile/") ? path.split("/")[2] : "";
    if (viewedUserId) {
      setActiveNav(`profile_${viewedUserId}`);
      return;
    }
    if (path === "/settings") {
      setActiveNav("settings");
      return;
    }
    const route = APP_ROUTES.find((entry) => entry.path === path);
    if (route) setActiveNav(route.id);
  }, [pathname, setActiveNav]);
}
