/**
 * Countdown to a target time with formatted text and urgency.
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
  useCountdownTicker(targetTime, setNow);
  if (!isValidTargetTime(targetTime)) return { text: "", urgency: "relaxed" };
  const left = targetTime.getTime() - now.getTime();
  return { text: formatCountdownText(left) || "", urgency: getUrgency(left) };
}

function useCountdownTicker(targetTime, setNow) {
  useEffect(() => {
    if (!isValidTargetTime(targetTime)) return undefined;
    return startCountdownTicker(targetTime, setNow);
  }, [targetTime?.getTime(), setNow]);
}

function startCountdownTicker(targetTime, setNow) {
  let timeoutId;
  const tick = () => {
    setNow(new Date());
    const left = targetTime.getTime() - Date.now();
    if (left > 0) timeoutId = setTimeout(tick, getTickDelay(left));
  };
  tick();
  return () => clearTimeout(timeoutId);
}

function isValidTargetTime(targetTime) {
  return targetTime instanceof Date;
}

function getTickDelay(msLeft) {
  return msLeft < 5 * 60 * 1000 ? 1000 : 60000;
}
