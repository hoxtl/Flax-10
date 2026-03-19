/*
 * State container for sleep warnings.
 */
import { useState } from "react";

export default function useSleepWarningState() {
  const [sleepWarning, setSleepWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  return { sleepWarning, setSleepWarning, pendingAction, setPendingAction };
}
