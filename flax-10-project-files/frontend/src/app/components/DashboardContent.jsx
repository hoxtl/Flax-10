import Settings from "../../pages/Settings/Settings";
import Profile from "../../pages/Profile/Profile";
import { resolveRouteContent } from "../navigation/helpers";

export function DashboardContent({ activeNav, setActiveNav, user, onNavChange }) {
  if (activeNav === "settings") {
    return <Settings user={user} onBack={() => setActiveNav("home")} />;
  }

  if (activeNav === "profile") {
    return <Profile user={user} onBack={() => setActiveNav("home")} onNavigate={onNavChange} />;
  }

  if (activeNav.startsWith("profile_")) {
    return renderProfileView(activeNav, setActiveNav, user, onNavChange);
  }

  return resolveRouteContent(activeNav, user, setActiveNav);
}

function renderProfileView(activeNav, setActiveNav, user, onNavChange) {
  const viewedUserId = activeNav.split("_")[1];
  return (
    <Profile
      user={user}
      viewedUserId={viewedUserId}
      onBack={() => setActiveNav("users")}
      backLabel="Back to All Users"
      onNavigate={onNavChange}
    />
  );
}
