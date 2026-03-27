/*
 * Auto schedule actions with scheduling preferences.
 */

import { createSchedule } from "../../../api/scheduleApi";
import { getUpcomingDeadlines } from "../../../api/deadlineApi";
import { getUserSettings } from "../../../api/userApi";
import { buildScheduleAutoForm } from "../../../pages/homepage/utils/ScheduleAutoForm";

const EMPTY_DEADLINE_ERROR = "No upcoming deadlines to auto-schedule.";
const OVERWRITE_MESSAGE = "A schedule with this name existed and was replaced.";
const SUCCESS_MESSAGE = "Your auto schedule is ready.";

export function buildAutoSchedulePayload(deadlines, settings, title) {
  const base = buildScheduleAutoForm({ deadlines });
  if (!base) return null;
  return { ...base, ...pickSchedulePrefs(settings), title: title || base.title };
}

export async function loadScheduleSettings(showToast) {
  try {
    return await getUserSettings();
  } catch {
    showToast("Couldn't load scheduling settings.", { variant: "error" });
    return null;
  }
}

export async function loadUpcomingDeadlineItems(showToast) {
  try {
    return await getUpcomingDeadlines();
  } catch {
    showToast("Unable to load upcoming deadlines.", { variant: "error" });
    return [];
  }
}

export async function submitAutoScheduleWithPrefs({ deadlines, settings, showToast, title, onDone }) {
  const payload = buildAutoSchedulePayload(deadlines, settings, title);
  if (!payload) {
    showToast(EMPTY_DEADLINE_ERROR, { variant: "error" });
    return null;
  }
  const data = await createSchedule(payload);
  if (data?.overwritten) showToast(OVERWRITE_MESSAGE, { variant: "info" });
  showToast(SUCCESS_MESSAGE, { variant: "success" });
  onDone?.(data);
  return data;
}

function pickSchedulePrefs(settings) {
  if (!settings) return {};
  const prefs = {};
  if (settings.wake_time) prefs.wake_time = settings.wake_time;
  if (settings.sleep_time) prefs.sleep_time = settings.sleep_time;
  if (settings.week_preference) prefs.week_preference = settings.week_preference;
  if (settings.worktime_preference) prefs.worktime_preference = settings.worktime_preference;
  return prefs;
}

