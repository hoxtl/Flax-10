/*
 * Candidate attendance prompt hook.
 */

import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../../../api/eventApi";
import { getSkippedIds } from "../attendancePromptStorage";
import { findCandidateEvent, getDateRangeForPrompt } from "../attendancePromptUtils";

const CHECK_INTERVAL_MS = 60 * 1000;

async function loadCandidateEvent() {
  const events = await getEvents(getDateRangeForPrompt());
  return findCandidateEvent(events, getSkippedIds());
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
  useEffect(() => startCandidatePolling(refresh), [refresh]);
  return [event, setEvent];
}
