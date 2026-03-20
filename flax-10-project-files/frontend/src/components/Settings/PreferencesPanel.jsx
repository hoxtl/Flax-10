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

function hasAppearanceChanges(currentAppearance, savedAppearance) {
  return currentAppearance.mode !== savedAppearance.mode || currentAppearance.theme !== savedAppearance.theme;
}

function AppearanceForm(props) {
  const { mode, setMode, theme, setTheme, onSave, isSaving, hasUnsaved, saveSignal, onSaved } = props;
  const handleChange = (nextData) => {
    if (nextData.mode) setMode(nextData.mode);
    if (nextData.theme) setTheme(nextData.theme);
  };

  return (
    <form onSubmit={(event) => handleAppearanceSubmit(event, { mode, theme }, onSave, hasUnsaved, onSaved)}>
      <AppearanceSection
        theme={{ mode, theme }}
        onChange={handleChange}
        isSaving={isSaving}
        hasUnsaved={hasUnsaved}
        saveSignal={saveSignal}
      />
    </form>
  );
}

async function handleAppearanceSubmit(event, appearance, onSave, hasUnsaved, onSaved) {
  event.preventDefault();
  if (!hasUnsaved) return;
  const ok = await onSave(appearance);
  if (ok) onSaved();
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
  const [appearanceSaveSignal, setAppearanceSaveSignal] = useState(0);
  const [savedAppearance, setSavedAppearance] = useState(() => ({ mode, theme }));
  const hasUnsavedAppearance = hasAppearanceChanges({ mode, theme }, savedAppearance);

  const triggerAppearanceSaved = () => {
    setSavedAppearance({ mode, theme });
    setAppearanceSaveSignal((count) => count + 1);
  };

  if (sleepSettings.loading) return <SectionSkeleton label="Loading preferences" rows={6} />;

  return (
    <div className={styles.preferencesContainer}>
      <div className={styles.preferencesContent}>
        {activeSubTab === "themes" ? (
          <AppearanceForm
            mode={mode}
            setMode={setMode}
            theme={theme}
            setTheme={setTheme}
            onSave={onSave}
            isSaving={isSaving}
            hasUnsaved={hasUnsavedAppearance}
            saveSignal={appearanceSaveSignal}
            onSaved={triggerAppearanceSaved}
          />
        ) : null}
        {activeSubTab === "sleep" ? <SleepSettingsPanel settings={sleepSettings} onSleepSave={onSleepSave} isSaving={isSaving} /> : null}
      </div>
    </div>
  );
}
