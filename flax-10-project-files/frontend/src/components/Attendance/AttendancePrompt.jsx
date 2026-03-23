/*
 * Attendance prompt entry component.
 */

import { useState } from "react";
import AttendancePromptModal from "./AttendancePromptModal";
import { dismissAttendancePrompt, submitAttendancePromptAnswer } from "./attendancePromptActions";
import { useCandidateEvent } from "./hooks/useCandidateEvent";

export default function AttendancePrompt() {
  const [event, setEvent] = useCandidateEvent();
  const [submitting, setSubmitting] = useState(false);
  if (!event) return null;
  return <AttendancePromptModal event={event} onAnswer={(attended, options) => submitAttendancePromptAnswer(event, attended, submitting, setEvent, setSubmitting, options)} onDismiss={() => dismissAttendancePrompt(event, setEvent)} />;
}
