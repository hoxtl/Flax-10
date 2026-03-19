/*
 * Attendance prompt actions.
 */

import { recordAttendance } from "../../api/attendanceApi";
import { setPromptedId } from "./attendancePromptStorage";

export function dismissAttendancePrompt(event, setEvent) {
  if (event) setPromptedId(event.id);
  setEvent(null);
}

export async function submitAttendancePromptAnswer(event, attended, submitting, setEvent, setSubmitting) {
  if (!event || submitting) return;
  setSubmitting(true);
  try {
    await recordAttendance(event.id, attended);
  } catch {
    return null;
  } finally {
    dismissAttendancePrompt(event, setEvent);
    setSubmitting(false);
  }
}
