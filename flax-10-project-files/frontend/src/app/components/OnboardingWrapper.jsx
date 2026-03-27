import OnboardingModal from "../../components/onboarding/OnboardingModal";
import { useOnboardingCheck } from "../hooks/useOnboardingCheck";

export function OnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useOnboardingCheck();
  const handleComplete = () => {
    setShowOnboarding(false);
    window.dispatchEvent(new CustomEvent("navigate", { detail: "settings" }));
  };
  return <OnboardingModal isOpen={showOnboarding} onComplete={handleComplete} />;
}
