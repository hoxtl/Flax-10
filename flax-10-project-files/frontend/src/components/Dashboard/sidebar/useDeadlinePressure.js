/*
 * Sidebar deadline pressure polling hook.
 */

import { useEffect, useState } from "react";

import { getUpcomingDeadlines } from "../../../api/calendar/deadlineApi";
import { hasDeadlineWithin48Hours } from "./sidebarUtils";

export default function useDeadlinePressure() {
  const [hasPressure, setHasPressure] = useState(false);
  useEffect(() => {
    syncDeadlinePressure(setHasPressure);
    const intervalId = setInterval(() => syncDeadlinePressure(setHasPressure), 60_000);
    return () => clearInterval(intervalId);
  }, []);
  return hasPressure;
}

function syncDeadlinePressure(setHasPressure) {
  getUpcomingDeadlines()
    .then((list) => setHasPressure(hasDeadlineWithin48Hours(Array.isArray(list) ? list : [])))
    .catch(() => setHasPressure(false));
}
