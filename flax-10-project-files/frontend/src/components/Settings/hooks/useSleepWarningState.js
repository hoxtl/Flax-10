/*
 * State container for sleep warnings.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useState } from "react";

export default function useSleepWarningState() {
  const [sleepWarning, setSleepWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  return { sleepWarning, setSleepWarning, pendingAction, setPendingAction };
}
