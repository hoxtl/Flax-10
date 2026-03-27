<<<<<<< HEAD
import OnboardingModal from "../../components/onboarding/components/OnboardingModal";
=======
import OnboardingModal from "../../components/onboarding/OnboardingModal";
>>>>>>> main
import { useOnboardingCheck } from "../hooks/useOnboardingCheck";

export function OnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useOnboardingCheck();
  const handleComplete = () => {
    setShowOnboarding(false);
    window.dispatchEvent(new CustomEvent("navigate", { detail: "settings" }));
  };
  return <OnboardingModal isOpen={showOnboarding} onComplete={handleComplete} />;
}
