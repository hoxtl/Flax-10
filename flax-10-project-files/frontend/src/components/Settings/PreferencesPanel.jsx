/*
 * Preferences panel for appearance and sleep settings.
 */
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import styles from "../../pages/Settings/Settings.module.css";
import AppearanceSection from "./preferences/AppearanceSection";
import SleepSection from "./preferences/SleepSection";
import useSleepScheduleSettings from "./preferences/useSleepScheduleSettings";

function AppearanceForm({ mode, setMode, theme, setTheme, onSave, isSaving, saveSignal }) {
  const handleChange = (nextData) => {
    if (nextData.mode) setMode(nextData.mode);
    if (nextData.theme) setTheme(nextData.theme);
  };

  return (
    <form onSubmit={(event) => handleAppearanceSubmit(event, mode, theme, onSave, saveSignal)}>
      <AppearanceSection theme={{ mode, theme }} onChange={handleChange} isSaving={isSaving} saveSignal={saveSignal} />
    </form>
  );
}

async function handleAppearanceSubmit(event, mode, theme, onSave, saveSignal) {
  event.preventDefault();
  await onSave({ mode, theme });
  saveSignal();
}

function SleepSettingsPanel({ settings, onSleepSave, isSaving }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onSleepSave({ sleep_time: settings.sleepTime, wake_time: settings.wakeTime });
    if (ok) settings.markSaved();
  };

  return (
    <SleepSection
      sleepTime={settings.sleepTime}
      wakeTime={settings.wakeTime}
      onSleepChange={settings.setSleepTime}
      onWakeChange={settings.setWakeTime}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      hasUnsaved={settings.hasUnsavedSleep}
      saveSignal={settings.saveSignal}
    />
  );
}

export default function PreferencesPanel({ onSave, onSleepSave, isSaving, activeSubTab = "themes" }) {
  const { mode, setMode, theme, setTheme } = useTheme();
  const sleepSettings = useSleepScheduleSettings();
  const [, setAppearanceSaveSignal] = useState(0);

  if (sleepSettings.loading) return <SectionSkeleton label="Loading preferences" rows={6} />;

  return (
    <div className={styles.preferencesContainer}>
      <div className={styles.preferencesContent}>
        {activeSubTab === "themes" ? <AppearanceForm mode={mode} setMode={setMode} theme={theme} setTheme={setTheme} onSave={onSave} isSaving={isSaving} saveSignal={() => setAppearanceSaveSignal((count) => count + 1)} /> : null}
        {activeSubTab === "sleep" ? <SleepSettingsPanel settings={sleepSettings} onSleepSave={onSleepSave} isSaving={isSaving} /> : null}
      </div>
    </div>
  );
}
