import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthenticationContext";

export function useOnboardingCheck() {
  const { profile, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    const missingMajor = !profile?.major || profile.major === "";
    if (!loading && profile && missingMajor) setShowOnboarding(true);
  }, [profile, loading]);
  return [showOnboarding, setShowOnboarding];
}
