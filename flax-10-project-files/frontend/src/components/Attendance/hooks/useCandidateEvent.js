/*
 * Candidate attendance prompt hook.
 */

import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../../../api/eventApi";
import { getLastPromptShownAt, getSkippedIds, setLastPromptShownAt } from "../attendancePromptStorage";
import { findCandidateEvent, getDateRangeForPrompt } from "../attendancePromptUtils";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const REPROMPT_COOLDOWN_MS = 15 * 60 * 1000;

async function loadCandidateEvent() {
  if ((Date.now() - getLastPromptShownAt()) < REPROMPT_COOLDOWN_MS) return null;
  const events = await getEvents(getDateRangeForPrompt());
  const candidate = findCandidateEvent(events, getSkippedIds());
  if (candidate) setLastPromptShownAt();
  return candidate;
}

async function refreshCandidateEvent(setEvent) {
  try {
    setEvent(await loadCandidateEvent());
  } catch {
    return null;
  }
}

function startCandidatePolling(refresh) {
  refresh();
  const intervalId = setInterval(refresh, CHECK_INTERVAL_MS);
  return () => clearInterval(intervalId);
}

export function useCandidateEvent() {
  const [event, setEvent] = useState(null);
  const refresh = useCallback(() => refreshCandidateEvent(setEvent), []);
  useEffect(() => {
    if (event) return undefined;
    return startCandidatePolling(refresh);
  }, [event, refresh]);
  return [event, setEvent];
}
