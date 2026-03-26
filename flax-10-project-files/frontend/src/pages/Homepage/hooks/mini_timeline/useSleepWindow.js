/*
 * Loads the user's saved sleep window for timeline sleep warnings.
 */

import { useEffect, useState } from "react";
import { getUserSettings } from "../../../../api/userApi";

const DEFAULT_SLEEP_WINDOW = { sleepTime: "23:00", wakeTime: "07:00" };

function formatSleepWindow(data) {
  return {
    sleepTime: data?.sleep_time?.slice(0, 5) || DEFAULT_SLEEP_WINDOW.sleepTime,
    wakeTime: data?.wake_time?.slice(0, 5) || DEFAULT_SLEEP_WINDOW.wakeTime,
  };
}

export function useSleepWindow() {
  const [sleepWindow, setSleepWindow] = useState(DEFAULT_SLEEP_WINDOW);

  useEffect(() => {
    let cancelled = false;
    getUserSettings().then((data) => !cancelled && setSleepWindow(formatSleepWindow(data))).catch(() => !cancelled && setSleepWindow(DEFAULT_SLEEP_WINDOW));
    return () => {
      cancelled = true;
    };
  }, []);

  return sleepWindow;
}
