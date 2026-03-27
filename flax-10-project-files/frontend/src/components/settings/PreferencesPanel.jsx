/*
 * Preferences panel for appearance, sleep, and scheduling settings.
 */

import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import SectionSkeleton from "../common/loading_state/SectionSkeleton";
import styles from "../../pages/settings/Settings.module.css";
import AppearanceSection from "./preferences/AppearanceSection";
import SleepSection from "./preferences/SleepSection";
import useSleepScheduleSettings from "./preferences/useSleepScheduleSettings";
import { SchedulingPanel, StudyTimeSection, WeekPreferenceSection, WorktimePreferenceSection } from "./scheduling/SchedulingSection";
import useSchedulingState from "./scheduling/useSchedulingState";

function hasAppearanceChanges(current, saved) {
  return current.mode !== saved.mode || current.theme !== saved.theme;
}

async function handleAppearanceSubmit(event, appearance, onSave, hasUnsaved, onSaved) {
  event.preventDefault();
  if (!hasUnsaved) return;
  const ok = await onSave(appearance);
  if (ok) onSaved();
}

function useAppearanceSignal(mode, theme) {
  const [state, setState] = useState(() => ({ appearance: { mode, theme }, signal: 0 }));
  useEffect(() => {
    setState((curr) => ({ ...curr, appearance: curr.appearance.mode ? curr.appearance : { mode, theme } }));
  }, [mode, theme]);
  return [state, setState];
}

function buildAppearanceProps(mode, setMode, theme, setTheme, onSave, isSaving, appearanceState, onSaved) {
  return {
    mode, setMode, theme, setTheme, onSave, isSaving,
    hasUnsaved: hasAppearanceChanges({ mode, theme }, appearanceState.appearance),
    saveSignal: appearanceState.signal,
    onSaved,
  };
}

function AppearanceForm({ mode, setMode, theme, setTheme, onSave, isSaving, hasUnsaved, saveSignal, onSaved }) {
  const handleChange = (next) => {
    setMode(next.mode);
    setTheme(next.theme);
  };
  return (
    <form onSubmit={(event) => handleAppearanceSubmit(event, { mode, theme }, onSave, hasUnsaved, onSaved)}>
      <AppearanceSection theme={{ mode, theme }} onChange={handleChange} isSaving={isSaving} hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
    </form>
  );
}

function SleepSettingsPanel({ settings, onSleepSave, isSaving }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onSleepSave({ sleep_time: settings.sleepTime, wake_time: settings.wakeTime });
    if (ok) settings.markSaved();
  };
  return (
    <SleepSection sleepTime={settings.sleepTime} wakeTime={settings.wakeTime} onSleepChange={settings.setSleepTime} onWakeChange={settings.setWakeTime} onSubmit={handleSubmit} isSaving={isSaving} hasUnsaved={settings.hasUnsavedSleep} saveSignal={settings.saveSignal} />
  );
}

function PreferencesPanelContent({ activeSubTab, appearanceProps, sleepProps, schedulingProps }) {
  const { studyTimeProps, weekPreferenceProps, worktimeProps } = schedulingProps;
  return (
    <div className={styles.preferencesContent}>
      {activeSubTab === "themes" && <AppearanceForm {...appearanceProps} />}
      {activeSubTab === "sleep" && <SleepSettingsPanel {...sleepProps} />}
      {activeSubTab === "scheduling" && <SchedulingPanel studyTimeProps={studyTimeProps} weekPreferenceProps={weekPreferenceProps} worktimeProps={worktimeProps} />}
      {activeSubTab === "studytime" && <StudyTimeSection {...studyTimeProps} />}
      {activeSubTab === "week" && <WeekPreferenceSection {...weekPreferenceProps} />}
      {activeSubTab === "daynight" && <WorktimePreferenceSection {...worktimeProps} />}
    </div>
  );
}

export default function PreferencesPanel({ onSave, onSleepSave, isSaving, onStudyTimeSave, onWeekPreferenceSave, onWorktimePreferenceSave, activeSubTab = "themes" }) {
  const { mode, setMode, theme, setTheme } = useTheme();
  const scheduling = useSchedulingState({ onStudyTimeSave, onWeekPreferenceSave, onWorktimePreferenceSave });
  const sleepSettings = useSleepScheduleSettings();
  const [appearanceState, setAppearanceState] = useAppearanceSignal(mode, theme);

  if (scheduling.loading || sleepSettings.loading) return <SectionSkeleton label="Loading preferences" rows={6} />;

  const triggerSaved = () => setAppearanceState(({ signal }) => ({ appearance: { mode, theme }, signal: signal + 1 }));
  const appearanceProps = buildAppearanceProps(mode, setMode, theme, setTheme, onSave, isSaving, appearanceState, triggerSaved);

  return (
    <div className={styles.preferencesContainer}>
      <PreferencesPanelContent activeSubTab={activeSubTab} appearanceProps={appearanceProps} sleepProps={{ settings: sleepSettings, onSleepSave, isSaving }} schedulingProps={scheduling} />
    </div>
  );
}
