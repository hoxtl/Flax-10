import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const TOUR_KEY = (id) => `flax_tour_done_${id}`;

export function useTourCheck() {
  const { profile, user, loading } = useAuth();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (loading || !profile?.id) return;
    if (!user?.has_completed_onboarding) return;
    const done = localStorage.getItem(TOUR_KEY(profile.id));
    if (!done) setShowTour(true);
  }, [profile?.id, user?.has_completed_onboarding, loading]);

  function completeTour() {
    if (profile?.id) localStorage.setItem(TOUR_KEY(profile.id), "1");
    setShowTour(false);
  }

  return [showTour, completeTour];
}
