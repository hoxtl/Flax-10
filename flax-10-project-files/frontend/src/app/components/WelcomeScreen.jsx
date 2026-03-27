import WelcomeLanding from "../../pages/welcome/WelcomeLanding";
import { onExplore, onBackToAuth } from "../navigation/helpers";
import { ScreenWrap } from "./ScreenWrap";

export function WelcomeScreen({ user, setShowWelcome, setActiveNav }) {
  return (
    <ScreenWrap animKey="welcome">
      <WelcomeLanding
        user={user}
        onExplore={() => onExplore(setShowWelcome, setActiveNav)}
        onBackToAuth={onBackToAuth}
      />
    </ScreenWrap>
  );
}
