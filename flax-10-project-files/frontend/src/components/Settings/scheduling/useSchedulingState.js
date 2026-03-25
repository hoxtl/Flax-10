/*
 * Scheduling preferences state and save handlers.
 */

import { useEffect, useState } from "react";
import { getUserSettings } from "../../../api/userApi";

export const WEEK_PREFERENCE_OPTIONS = [
  { value: "both", label: "Weekdays + weekends" },
  { value: "weekdays", label: "Weekdays only" },
  { value: "weekends", label: "Weekends only" },
];

export const WORKTIME_PREFERENCE_OPTIONS = [
  { value: "both", label: "Any time" },
  { value: "day", label: "Daytime" },
  { value: "night", label: "Nighttime" },
];

function formatStudyTimeLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (!hours) return `${minutes} min`;
  if (!rem) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr ${rem} min`;
}

export const STUDY_TIME_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const minutes = (i + 1) * 30;
  return { value: String(minutes), label: formatStudyTimeLabel(minutes) };
});

function useSchedulingFields() {
  const [minutesPerDay, setMinutesPerDay] = useState("120");
  const [initialMinutesPerDay, setInitialMinutesPerDay] = useState("120");
  const [weekPreference, setWeekPreference] = useState("both");
  const [initialWeekPreference, setInitialWeekPreference] = useState("both");
  const [worktimePreference, setWorktimePreference] = useState("both");
  const [initialWorktimePreference, setInitialWorktimePreference] = useState("both");
  return { minutesPerDay, setMinutesPerDay, initialMinutesPerDay, setInitialMinutesPerDay, weekPreference, setWeekPreference, initialWeekPreference, setInitialWeekPreference, worktimePreference, setWorktimePreference, initialWorktimePreference, setInitialWorktimePreference };
}

function useSchedulingSignals() {
  const [studySaveSignal, setStudySaveSignal] = useState(0);
  const [weekSaveSignal, setWeekSaveSignal] = useState(0);
  const [worktimeSaveSignal, setWorktimeSaveSignal] = useState(0);
  const [studyIsSaving, setStudyIsSaving] = useState(false);
  const [weekIsSaving, setWeekIsSaving] = useState(false);
  const [worktimeIsSaving, setWorktimeIsSaving] = useState(false);
  return { studySaveSignal, setStudySaveSignal, weekSaveSignal, setWeekSaveSignal, worktimeSaveSignal, setWorktimeSaveSignal, studyIsSaving, setStudyIsSaving, weekIsSaving, setWeekIsSaving, worktimeIsSaving, setWorktimeIsSaving };
}

function applyScheduleSettings(data, f) {
  if (data?.preferred_study_minutes_per_day) {
    const v = String(data.preferred_study_minutes_per_day);
    f.setMinutesPerDay(v);
    f.setInitialMinutesPerDay(v);
  }
  if (data?.week_preference) {
    f.setWeekPreference(data.week_preference);
    f.setInitialWeekPreference(data.week_preference);
  }
  if (data?.worktime_preference) {
    f.setWorktimePreference(data.worktime_preference);
    f.setInitialWorktimePreference(data.worktime_preference);
  }
}

async function applyStudyResult(settings, safeValue, f, s) {
  if (!settings) return;
  const value = String(settings.preferred_study_minutes_per_day ?? safeValue);
  f.setMinutesPerDay(value);
  f.setInitialMinutesPerDay(value);
  s.setStudySaveSignal((count) => count + 1);
}

function applyPrefResult(settings, key, current, setField, setInitial, bumpSignal) {
  if (!settings) return;
  const value = settings[key] || current;
  setField(value);
  setInitial(value);
  bumpSignal();
}

function createSaveStudyTime(f, s, onStudyTimeSave) {
  return async (event) => {
    event.preventDefault();
    s.setStudyIsSaving(true);
    const safeValue = Math.max(30, Math.min(600, Number(f.minutesPerDay) || 120));
    try {
      await applyStudyResult(await onStudyTimeSave({ preferred_study_minutes_per_day: safeValue }), safeValue, f, s);
    } finally {
      s.setStudyIsSaving(false);
    }
  };
}

function createSaveWeekPreference(f, s, onWeekPreferenceSave) {
  return async (event) => {
    event.preventDefault();
    s.setWeekIsSaving(true);
    try {
      const settings = await onWeekPreferenceSave({ week_preference: f.weekPreference });
      applyPrefResult(settings, "week_preference", f.weekPreference, f.setWeekPreference, f.setInitialWeekPreference, () => s.setWeekSaveSignal((c) => c + 1));
    } finally {
      s.setWeekIsSaving(false);
    }
  };
}

function createSaveWorktimePreference(f, s, onWorktimePreferenceSave) {
  return async (event) => {
    event.preventDefault();
    s.setWorktimeIsSaving(true);
    try {
      const settings = await onWorktimePreferenceSave({ worktime_preference: f.worktimePreference });
      applyPrefResult(settings, "worktime_preference", f.worktimePreference, f.setWorktimePreference, f.setInitialWorktimePreference, () => s.setWorktimeSaveSignal((c) => c + 1));
    } finally {
      s.setWorktimeIsSaving(false);
    }
  };
}

function buildStudyTimeProps(f, s, onSubmit) {
  return { minutesPerDay: f.minutesPerDay, onMinutesChange: f.setMinutesPerDay, onSubmit, isSaving: s.studyIsSaving, hasUnsaved: f.minutesPerDay !== f.initialMinutesPerDay, saveSignal: s.studySaveSignal };
}

function buildWeekPreferenceProps(f, s, onSubmit) {
  return { weekPreference: f.weekPreference, onWeekPreferenceChange: f.setWeekPreference, onSubmit, isSaving: s.weekIsSaving, hasUnsaved: f.weekPreference !== f.initialWeekPreference, saveSignal: s.weekSaveSignal };
}

function buildWorktimeProps(f, s, onSubmit) {
  return { worktimePreference: f.worktimePreference, onWorktimePreferenceChange: f.setWorktimePreference, onSubmit, isSaving: s.worktimeIsSaving, hasUnsaved: f.worktimePreference !== f.initialWorktimePreference, saveSignal: s.worktimeSaveSignal };
}

export default function useSchedulingState({ onStudyTimeSave, onWeekPreferenceSave, onWorktimePreferenceSave }) {
  const f = useSchedulingFields();
  const s = useSchedulingSignals();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSettings().then((data) => applyScheduleSettings(data, f)).finally(() => setLoading(false));
  }, []);

  return {
    loading,
    studyTimeProps: buildStudyTimeProps(f, s, createSaveStudyTime(f, s, onStudyTimeSave)),
    weekPreferenceProps: buildWeekPreferenceProps(f, s, createSaveWeekPreference(f, s, onWeekPreferenceSave)),
    worktimeProps: buildWorktimeProps(f, s, createSaveWorktimePreference(f, s, onWorktimePreferenceSave)),
  };
}
