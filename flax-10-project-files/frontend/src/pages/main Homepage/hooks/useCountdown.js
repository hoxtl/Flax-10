/**
 * Countdown to a target time with formatted text and urgency.
 * Updates every 60s normally, every 1s when < 5 minutes away.
 *
 * @param {Date | null} targetTime - When to count down to
 * @returns {{ text: string; urgency: 'relaxed' | 'soon' | 'urgent' }}
 */
import { useState, useEffect } from "react";

function formatCountdownText(msLeft) {
  if (msLeft == null || msLeft < 0) return null;
  const totalMins = Math.max(0, Math.floor(msLeft / 60000));
  if (totalMins < 1) return "now";
  if (totalMins < 60) return `in ${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

function getUrgency(msLeft) {
  if (msLeft == null || msLeft < 0) return "relaxed";
  const mins = msLeft / 60000;
  if (mins < 10) return "urgent";
  if (mins < 30) return "soon";
  return "relaxed";
}

export function useCountdown(targetTime) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!targetTime || !(targetTime instanceof Date)) return;
    let timeoutId;

    const tick = () => {
      setNow(new Date());
      const left = targetTime.getTime() - Date.now();
      if (left <= 0) return;
      timeoutId = setTimeout(tick, left < 5 * 60 * 1000 ? 1000 : 60000);
    };

    tick();
    return () => clearTimeout(timeoutId);
  }, [targetTime?.getTime()]);

  if (!targetTime || !(targetTime instanceof Date)) {
    return { text: "", urgency: "relaxed" };
  }

  const left = targetTime.getTime() - now.getTime();
  return {
    text: formatCountdownText(left) || "",
    urgency: getUrgency(left),
  };
}
