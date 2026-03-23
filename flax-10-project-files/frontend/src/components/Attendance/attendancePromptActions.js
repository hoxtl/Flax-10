/*
 * Attendance prompt actions.
 */

import { recordAttendance } from "../../api/attendanceApi";
import { setPromptedId, setSessionDismissedId } from "./attendancePromptStorage";

/** Dismiss for this session only — will re-prompt on next login. */
export function dismissAttendancePrompt(event, setEvent) {
  if (event) setSessionDismissedId(event.id);
  setEvent(null);
}

/** Record an answer (Yes/No) — permanently marks the event as answered. */
export async function submitAttendancePromptAnswer(event, attended, submitting, setEvent, setSubmitting) {
  if (!event || submitting) return;
  setSubmitting(true);
  try {
    await recordAttendance(event.id, attended);
  } catch {
    return null;
  } finally {
    if (event) setPromptedId(event.id);
    setEvent(null);
    setSubmitting(false);
  }
}
