/**
 * Live countdown for current task (end time) or next task (start time).
 * Ticks every second when viewing today.
 */

import { useState, useEffect } from "react";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { isNow } from "../utils/eventUtils";

export function useScheduleCountdown(selectedDate, dayEvents) {
  const [scheduleCountdownSecs, setScheduleCountdownSecs] = useState(null);

  useEffect(() => {
    if (!isToday(selectedDate) || !dayEvents?.length) {
      setScheduleCountdownSecs(null);
      return;
    }
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const nowItem = sorted.find((e) => isNow(e.start_time, e.end_time));
    const nextItem = nowItem
      ? null
      : sorted.find((e) => e.start_time && new Date(e.start_time).getTime() > Date.now());
    const target = nowItem
      ? new Date(nowItem.end_time || nowItem.start_time)
      : nextItem
        ? new Date(nextItem.start_time)
        : null;

    const tick = () => {
      if (!target) {
        setScheduleCountdownSecs(null);
        return;
      }
      const secs = Math.max(0, Math.round((target.getTime() - Date.now()) / 1000));
      setScheduleCountdownSecs(secs);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selectedDate, dayEvents]);

  return scheduleCountdownSecs;
}
