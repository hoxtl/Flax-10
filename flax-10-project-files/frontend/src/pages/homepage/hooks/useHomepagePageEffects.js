/**
 * Homepage page-effect hooks.
 */

import { useEffect, useRef, useState } from "react";
import { playCompletionChime } from "../../../lib/sounds";

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function shouldLoadEmptyCalendar(allCalEvents) {
  return (allCalEvents || []).length === 0;
}

export function useHomepageNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(intervalId);
  }, []);

  return now;
}

export function useHomepageSelection(dispatch) {
  useEffect(() => {
    dispatch({ type: "SET_SELECTED_DATE", payload: getTodayStart() });
  }, [dispatch]);
}

export function useHomepageEventBootstrap(allCalEvents, loadEvents, selectedDate) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (shouldLoadEmptyCalendar(allCalEvents)) loadEvents();
    }, 220);
    return () => clearTimeout(timeoutId);
  }, [allCalEvents, loadEvents, selectedDate]);
}

export function useTimerCompletionSound(hasTimerSession, timeLeft, timerMode) {
  const prevTimeLeftRef = useRef(null);

  useEffect(() => {
    if (hasTimerSession && timerMode === "work" && prevTimeLeftRef.current > 0 && timeLeft === 0) {
      playCompletionChime(0.35);
    }
    prevTimeLeftRef.current = timeLeft;
  }, [hasTimerSession, timeLeft, timerMode]);
}
