import { useState, useEffect, useCallback } from 'react';
import { getEvents } from '../../../api/eventApi';
import { getPromptedIds } from '../attendancePromptStorage';
import { getDateRangeForPrompt, findCandidateEvent } from '../attendancePromptUtils';

const CHECK_INTERVAL_MS = 60 * 1000;

const fetchCandidateEvent = async () => {
  const prompted = getPromptedIds();
  const { start, end } = getDateRangeForPrompt();
  const events = await getEvents({ start, end });
  return findCandidateEvent(events, prompted);
};

export function useCandidateEvent() {
  const [event, setEvent] = useState(null);

  const checkForPrompt = useCallback(async () => {
    try {
      const candidate = await fetchCandidateEvent();
      if (candidate) setEvent(candidate);
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    checkForPrompt();
    const id = setInterval(checkForPrompt, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checkForPrompt]);

  return [event, setEvent];
}
