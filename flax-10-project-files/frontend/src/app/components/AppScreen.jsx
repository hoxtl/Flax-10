import { useLocation } from "react-router-dom";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import DashboardLayout from "../../layout/DashboardLayout";
import { ScreenWrap } from "./ScreenWrap";
import { AppProviders } from "./AppProviders";
import { AnimatedDashboardContent } from "./AnimatedDashboardContent";
import { OnboardingWrapper } from "./OnboardingWrapper";
import { useSyncNavFromUrl } from "../hooks/useSyncNavFromUrl";
import { useNavHandler } from "../navigation/useNavHandler";
import { useTourCheck } from "../hooks/useTourCheck";
import AppTour from "../../components/common/AppTour/AppTour";

function TourWrapper() {
  const [showTour, completeTour] = useTourCheck();
  if (!showTour) return null;
  return <AppTour onDone={completeTour} />;
}

export function AppScreen({ activeNav, setActiveNav, user }) {
  const location = useLocation();
  const handleNavChange = useNavHandler(setActiveNav);
  useSyncNavFromUrl(location.pathname, setActiveNav);
  return (
    <ScreenWrap animKey="app">
      <AppProviders>
        <ScrollToTop />
        <DashboardLayout activeNav={activeNav} onNavChange={handleNavChange} user={user}>
          <AnimatedDashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} onNavChange={handleNavChange} />
        </DashboardLayout>
        <OnboardingWrapper />
        <TourWrapper />
      </AppProviders>
    </ScreenWrap>
  );
}
