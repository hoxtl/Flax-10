/*
 * Hook for running admin actions.
 */

import { useState } from "react";

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export function useAsyncAction(setError) {
  const [busy, setBusy] = useState(null);
  const run = (id, action, onSuccess, fallback = "Action failed.") => {
    setBusy(id);
    action().then(onSuccess).catch((error) => setError(getErrorMessage(error, fallback))).finally(() => setBusy(null));
  };
  return { busy, run };
}
