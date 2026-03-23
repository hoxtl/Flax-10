/*
 * Tracks a short-lived saved state after a save signal changes.
 */

import { useEffect, useState } from "react";

export function useTransientSavedState(saveSignal, duration = 2000) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saveSignal) return undefined;
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), duration);
    return () => clearTimeout(timer);
  }, [duration, saveSignal]);

  return showSaved;
}
