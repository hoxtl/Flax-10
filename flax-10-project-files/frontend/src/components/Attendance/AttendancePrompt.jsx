/*
 * Attendance prompt entry component.
 */

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import AttendancePromptModal from "./AttendancePromptModal";
import { dismissAttendancePrompt, submitAttendancePromptAnswer } from "./attendancePromptActions";
import { useCandidateEvent } from "./hooks/useCandidateEvent";
import { useAuth } from "../../context/AuthenticationContext";

export default function AttendancePrompt() {
  const { profile } = useAuth();
  const [event, setEvent] = useCandidateEvent();
  const [submitting, setSubmitting] = useState(false);
  if (profile?.role === "teacher") return null;
  return (
    <AnimatePresence>
      {event && (
        <AttendancePromptModal
          key={event.id}
          event={event}
          onAnswer={(attended, options) => submitAttendancePromptAnswer(event, attended, submitting, setEvent, setSubmitting, options)}
          onDismiss={() => dismissAttendancePrompt(event, setEvent)}
        />
      )}
    </AnimatePresence>
  );
}
