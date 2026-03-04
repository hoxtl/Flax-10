import { useState, useEffect } from "react";
import { isToday } from "../../../components/Calendar/utils/dateUtils";

/**
 * Seconds until the next calendar event starts (for "in Xm" countdown).
 */
export function useScheduleCountdown(selectedDate, dayEvents) {
  const [secs, setSecs] = useState(null);

  useEffect(() => {
    if (!isToday(selectedDate) || !Array.isArray(dayEvents) || dayEvents.length === 0) {
      setSecs(null);
      return;
    }
    const now = Date.now();
    const next = dayEvents
      .map((e) => new Date(e.start_time).getTime())
      .filter((t) => t > now)
      .sort((a, b) => a - b)[0];
    if (next == null) {
      setSecs(null);
      return;
    }
    const update = () => setSecs(Math.max(0, Math.floor((next - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [selectedDate, dayEvents]);

  return secs;
}
