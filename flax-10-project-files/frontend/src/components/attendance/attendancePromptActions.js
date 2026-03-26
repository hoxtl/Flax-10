/*
 * Attendance prompt actions.
 */

import { recordAttendance } from "../../api/attendanceApi";
<<<<<<< HEAD
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

async function executeAttendanceSubmission(event, attended, options) {
  const { afterSuccess, closeDelayMs = 250 } = options;
  await recordAttendance(event.id, attended);
  dispatchAttendanceUpdated();
  if (typeof afterSuccess === "function") await afterSuccess();
  if (closeDelayMs > 0) await wait(closeDelayMs);
  setPromptedId(event.id);
  return true;
}

export async function submitAttendancePromptAnswer(event, attended, submitting, setEvent, setSubmitting, options = {}) {
  if (!event || submitting) return false;
  setSubmitting(true);
  try {
    const result = await executeAttendanceSubmission(event, attended, options);
    setEvent(null);
    return result;
  } catch {
    return false;
  } finally {
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    setSubmitting(false);
  }
}
