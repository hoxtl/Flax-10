/**
 * Est-time help banner state hook.
 */

import { useEffect, useState } from "react";
import { persistDismissedState, readDismissedState } from "./estTimeHelpBannerUtils";

export function useEstTimeHelpBanner(persistDismiss) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readDismissedState(persistDismiss));
  }, [persistDismiss]);

  return {
    dismissed,
    dismissBanner: () => dismissBanner(persistDismiss, setDismissed),
  };
}

function dismissBanner(persistDismiss, setDismissed) {
  setDismissed(true);
  persistDismissedState(persistDismiss);
}
