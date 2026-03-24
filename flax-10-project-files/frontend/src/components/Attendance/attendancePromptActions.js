/*
 * Attendance prompt actions.
 */

import { recordAttendance } from "../../api/attendanceApi";
import { dispatchAttendanceUpdated } from "../../lib/attendanceEvents";
import { setPromptedId, setSessionDismissedId } from "./attendancePromptStorage";

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/** Dismiss for this session only — will re-prompt on next login. */
export function dismissAttendancePrompt(event, setEvent) {
  if (event) setSessionDismissedId(event.id);
  setEvent(null);
}

/** Record an answer (Yes/No) — permanently marks the event as answered. */
export async function submitAttendancePromptAnswer(event, attended, submitting, setEvent, setSubmitting, options = {}) {
  const { afterSuccess, closeDelayMs = 250 } = options;
  if (!event || submitting) return false;
  setSubmitting(true);
  try {
    await recordAttendance(event.id, attended);
    dispatchAttendanceUpdated();
    if (typeof afterSuccess === "function") await afterSuccess();
    if (closeDelayMs > 0) await wait(closeDelayMs);
    setPromptedId(event.id);
    setEvent(null);
    return true;
  } catch {
    return false;
  } finally {
    setSubmitting(false);
  }
}
