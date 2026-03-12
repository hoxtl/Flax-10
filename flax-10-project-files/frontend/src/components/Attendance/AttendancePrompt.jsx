import { useState, useEffect, useCallback } from "react";
import { getEvents } from "../../api/eventApi";
import { recordAttendance } from "../../api/attendanceApi";
import { getPromptedIds, setPromptedId } from "./attendancePromptStorage";
import { getDateRangeForPrompt, findCandidateEvent } from "./attendancePromptUtils";
import AttendancePromptModal from "./AttendancePromptModal.jsx";

const CHECK_INTERVAL_MS = 60 * 1000;

function useCandidateEvent() {
  const [event, setEvent] = useState(null);

  const checkForPrompt = useCallback(async () => {
    const prompted = getPromptedIds();
    const { start, end } = getDateRangeForPrompt();
    try {
      const events = await getEvents({ start, end });
      const candidate = findCandidateEvent(events, prompted);
      if (candidate) setEvent(candidate);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkForPrompt();
    const id = setInterval(checkForPrompt, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [checkForPrompt]);

  return [event, setEvent];
}

export default function AttendancePrompt() {
  const [event, setEvent] = useCandidateEvent();
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = async (attended) => {
    if (!event || submitting) return;
    setSubmitting(true);
    try {
      await recordAttendance(event.id, attended);
    } catch {
      // still mark as prompted
    }
    setPromptedId(event.id);
    setEvent(null);
    setSubmitting(false);
  };

  const handleDismiss = () => {
    if (event) setPromptedId(event.id);
    setEvent(null);
  };

  if (!event) return null;

  return (
    <AttendancePromptModal
      event={event}
      submitting={submitting}
      onAnswer={handleAnswer}
      onDismiss={handleDismiss}
    />
  );
}
