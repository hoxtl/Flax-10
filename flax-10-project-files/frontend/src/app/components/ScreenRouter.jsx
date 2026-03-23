import BannedPage from "../../pages/Banned/BannedPage";
import { AuthScreen } from "./AuthScreens";
import { WelcomeScreen } from "./WelcomeScreen";
import { AppScreen } from "./AppScreen";

export function ScreenRouter({ screen, state }) {
  if (state.isBanned) return <BannedPage key="banned" reason={localStorage.getItem("ban_reason") || ""} />;
  if (screen === "auth") return <AuthScreen key="auth" />;
  if (screen === "welcome") return <WelcomeScreen key="welcome" user={state.user} setShowWelcome={state.setShowWelcome} setActiveNav={state.setActiveNav} />;
  return <AppScreen key="app" activeNav={state.activeNav} setActiveNav={state.setActiveNav} user={state.user} />;
}
