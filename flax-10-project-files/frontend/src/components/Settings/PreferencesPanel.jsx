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

function StudyTimeSection({
  minutesPerDay,
  onMinutesChange,
  onSubmit,
  isSaving,
  hasUnsaved,
  saveSignal,
}) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Study Time Budget" />
            <div className={styles.formGroup}>
              <label htmlFor="preferred-study-minutes">Preferred study time per day (minutes)</label>
              <input
                id="preferred-study-minutes"
                type="number"
                min={30}
                max={600}
                step={30}
                value={minutesPerDay}
                onChange={(e) => onMinutesChange(e.target.value)}
              />
            </div>
            <SubmitButton
              isSaving={isSaving}
              label="Save Study Time"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>📚</span>
        <h3 className={styles.contextCardTitle}>Auto-scheduler capacity</h3>
        <ul className={styles.contextCardList}>
          <li>Customizable, desirable study length per day(must be in quarter-hours)</li>
        </ul>
      </div>
    </div>
  );
}

function WeekPreferenceSection({
  weekPreference,
  onWeekPreferenceChange,
  onSubmit,
  isSaving,
  hasUnsaved,
  saveSignal,
}) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Preferred Week Period" />
            <div className={styles.formGroup}>
              <label htmlFor="week-preferences">Preferred days for auto-scheduling</label>
              <select
                id="week-preferences"
                value={weekPreference}
                onChange={(e) => onWeekPreferenceChange(e.target.value)}
              >
                <option value="both">Both weekdays and weekends</option>
                <option value="weekdays">Weekdays only</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>
            <SubmitButton
              isSaving={isSaving}
              label="Save Week Preference"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>📅</span>
        <h3 className={styles.contextCardTitle}>Weekly scheduling focus</h3>
        <ul className={styles.contextCardList}>
          <li>Pick whether auto-scheduling should prioritize weekdays or weekends</li>
        </ul>
      </div>
    </div>
  );
}

function WorktimePreferenceSection({
  worktimePreference,
  onWorktimePreferenceChange,
  onSubmit,
  isSaving,
  hasUnsaved,
  saveSignal,
}) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Preferred Worktime" />
            <div className={styles.formGroup}>
              <label htmlFor="worktime-preferences">Preferred study period for auto-scheduling</label>
              <select
                id="worktime-preferences"
                value={worktimePreference}
                onChange={(e) => onWorktimePreferenceChange(e.target.value)}
              >
                <option value="both">Any time (day and night)</option>
                <option value="day">Daytime only</option>
                <option value="night">Nighttime only</option>
              </select>
            </div>
            <SubmitButton
              isSaving={isSaving}
              label="Save Worktime Preference"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>⏰</span>
        <h3 className={styles.contextCardTitle}>Daily scheduling window</h3>
        <ul className={styles.contextCardList}>
          <li>Choose whether schedule blocks should default to day, night, or both</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {Function} props.onSave - Saves theme preference
 * @param {Function} props.onSleepSave - Saves sleep schedule
 * @param {boolean} props.isSaving
 */
 export default function PreferencesPanel({
   onSave,
   onSleepSave,
   isSaving,
   onStudyTimeSave,
   onWeekPreferenceSave,
   onWorktimePreferenceSave,
   activeSubTab = "themes",
 }) {
  const { mode, setMode, theme, setTheme } = useTheme();
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [initialSleepTime, setInitialSleepTime] = useState("23:00");
  const [initialWakeTime, setInitialWakeTime] = useState("07:00");
  const [loadingSleep, setLoadingSleep] = useState(true);
  const [sleepSaveSignal, setSleepSaveSignal] = useState(0);
  const [minutesPerDay, setMinutesPerDay] = useState("120");
  const [initialMinutesPerDay, setInitialMinutesPerDay] = useState("120");
  const [studySaveSignal, setStudySaveSignal] = useState(0);
  const [weekPreference, setWeekPreference] = useState("both");
  const [initialWeekPreference, setInitialWeekPreference] = useState("both");
  const [weekSaveSignal, setWeekSaveSignal] = useState(0);
  const [worktimePreference, setWorktimePreference] = useState("both");
  const [initialWorktimePreference, setInitialWorktimePreference] = useState("both");
  const [worktimeSaveSignal, setWorktimeSaveSignal] = useState(0);

  useEffect(() => {
    getUserSettings()
      .then((data) => {
        if (data?.sleep_time) {
          const nextSleepTime = data.sleep_time.slice(0, 5);
          setSleepTime(nextSleepTime);
          setInitialSleepTime(nextSleepTime);
        }
        if (data?.wake_time) {
          const nextWakeTime = data.wake_time.slice(0, 5);
          setWakeTime(nextWakeTime);
          setInitialWakeTime(nextWakeTime);
        }
        if (data?.preferred_study_minutes_per_day) {
          const nextStudyTime = String(data.preferred_study_minutes_per_day);
          setMinutesPerDay(nextStudyTime);
          setInitialMinutesPerDay(nextStudyTime);
        }
        if (data?.week_preference) {
          setWeekPreference(data.week_preference);
          setInitialWeekPreference(data.week_preference);
        }
        if (data?.worktime_preference) {
          setWorktimePreference(data.worktime_preference);
          setInitialWorktimePreference(data.worktime_preference);
        }
      })
      .finally(() => setLoadingSleep(false));
  }, []);

  const handlePreferencesSubmit = (newData) => {
    if (newData.mode) setMode(newData.mode);
    if (newData.theme) setTheme(newData.theme);
    onSave(newData);
  };

  const hasUnsavedSleep = sleepTime !== initialSleepTime || wakeTime !== initialWakeTime;
  const hasUnsavedStudyTime = minutesPerDay !== initialMinutesPerDay;
  const hasUnsavedWeekPreference = weekPreference !== initialWeekPreference;
  const hasUnsavedWorktimePreference = worktimePreference !== initialWorktimePreference;

  if (loadingSleep) return <SectionSkeleton label="Loading preferences" rows={6} />;
  const sleepSettings = useSleepScheduleSettings();
  const [, setAppearanceSaveSignal] = useState(0);

  if (sleepSettings.loading) return <SectionSkeleton label="Loading preferences" rows={6} />;

  return (
    <div className={styles.preferencesContainer}>
      <div className={styles.preferencesContent}>
        {activeSubTab === 'themes' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePreferencesSubmit({ mode, theme }); }}>
            <AppearanceSection
              theme={{ mode, theme }}
              onChange={(newData) => {
                if (newData.mode) setMode(newData.mode);
                if (newData.theme) setTheme(newData.theme);
              }}
              isSaving={isSaving}
            />
          </form>
        )}

        {activeSubTab === 'sleep' && (
          <SleepSection
            sleepTime={sleepTime}
            wakeTime={wakeTime}
            onSleepChange={setSleepTime}
            onWakeChange={setWakeTime}
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await onSleepSave({ sleep_time: sleepTime, wake_time: wakeTime });
              if (ok) {
                setInitialSleepTime(sleepTime);
                setInitialWakeTime(wakeTime);
                setSleepSaveSignal((s) => s + 1);
              }
            }}
            isSaving={isSaving}
            hasUnsaved={hasUnsavedSleep}
            saveSignal={sleepSaveSignal}
          />
        )}

        {activeSubTab === 'studytime' && (
          <StudyTimeSection
            minutesPerDay={minutesPerDay}
            onMinutesChange={setMinutesPerDay}
            onSubmit={async (e) => {
              e.preventDefault();
              const safeValue = Math.max(30, Math.min(600, Number(minutesPerDay) || 120));
              const ok = await onStudyTimeSave({ preferred_study_minutes_per_day: safeValue });
              if (ok) {
                const persisted = String(safeValue);
                setMinutesPerDay(persisted);
                setInitialMinutesPerDay(persisted);
                setStudySaveSignal((s) => s + 1);
              }
            }}
            isSaving={isSaving}
            hasUnsaved={hasUnsavedStudyTime}
            saveSignal={studySaveSignal}
          />
        )}

        {activeSubTab === 'week' && (
          <WeekPreferenceSection
            weekPreference={weekPreference}
            onWeekPreferenceChange={setWeekPreference}
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await onWeekPreferenceSave({ week_preference: weekPreference });
              if (ok) {
                setInitialWeekPreference(weekPreference);
                setWeekSaveSignal((s) => s + 1);
              }
            }}
            isSaving={isSaving}
            hasUnsaved={hasUnsavedWeekPreference}
            saveSignal={weekSaveSignal}
          />
        )}

        {activeSubTab === 'daynight' && (
          <WorktimePreferenceSection
           worktimePreference={worktimePreference}
           onWorktimePreferenceChange={setWorktimePreference}
           onSubmit={async (e) => {
             e.preventDefault();
             const ok = await onWorktimePreferenceSave({ worktime_preference: worktimePreference });
             if (ok) {
               setInitialWorktimePreference(worktimePreference);
               setWorktimeSaveSignal((s) => s + 1);
             }
           }}
           isSaving={isSaving}
           hasUnsaved={hasUnsavedWorktimePreference}
           saveSignal={worktimeSaveSignal}
         />
        )}
      </div>
    </div>
  );
}
