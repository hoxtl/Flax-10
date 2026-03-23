/*
 * Legacy standalone sleep-schedule panel retained for test coverage.
 */

import SleepSection from "./preferences/SleepSection";
import useSleepScheduleSettings from "./preferences/useSleepScheduleSettings";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";

export function SleepSchedulePanel({ onSave, isSaving }) {
  const settings = useSleepScheduleSettings();
  if (settings.loading) return <SectionSkeleton label="Loading sleep schedule" rows={3} />;
  return <SleepScheduleContent settings={settings} onSave={onSave} isSaving={isSaving} />;
}

function SleepScheduleContent({ settings, onSave, isSaving }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onSave({ sleep_time: settings.sleepTime, wake_time: settings.wakeTime });
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
