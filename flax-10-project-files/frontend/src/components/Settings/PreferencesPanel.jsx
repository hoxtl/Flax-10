/*
 * Preferences panel for appearance, sleep, and scheduling settings.
 */
import { useEffect, useState } from "react";
import { getUserSettings } from "../../api/userApi";
import { useTheme } from "../../context/ThemeContext";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import styles from "../../pages/Settings/Settings.module.css";
import { SectionHeader, SubmitButton } from "./SettingsUI";
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

function StudyTimeSection({ minutesPerDay, onMinutesChange, onSubmit, isSaving, hasUnsaved, saveSignal }) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="How much study time do you want each day?" description="StudyFlax will try not to plan more than this amount on a single day." />
            <div className={styles.formGroup}>
              <label htmlFor="preferred-study-minutes">Daily study time</label>
              <input id="preferred-study-minutes" type="number" min={30} max={600} step={30} value={minutesPerDay} onChange={(e) => onMinutesChange(e.target.value)} />
            </div>
            <SubmitButton isSaving={isSaving} label="Save daily study time" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>📚</span>
        <h3 className={styles.contextCardTitle}>What this changes</h3>
        <ul className={styles.contextCardList}>
          <li>Higher values allow longer study plans on busy days</li>
          <li>Lower values keep your schedule lighter and more realistic</li>
        </ul>
      </div>
    </div>
  );
}

function WeekPreferenceSection({ weekPreference, onWeekPreferenceChange, onSubmit, isSaving, hasUnsaved, saveSignal }) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Which days should StudyFlax use?" description="Choose whether auto schedules can use weekdays, weekends, or both." />
            <div className={styles.formGroup}>
              <label htmlFor="week-preferences">Days available for scheduling</label>
              <select id="week-preferences" value={weekPreference} onChange={(e) => onWeekPreferenceChange(e.target.value)}>
                <option value="both">Both weekdays and weekends</option>
                <option value="weekdays">Weekdays only</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>
            <SubmitButton isSaving={isSaving} label="Save scheduling days" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>📅</span>
        <h3 className={styles.contextCardTitle}>What this changes</h3>
        <ul className={styles.contextCardList}>
          <li>Use weekdays if you want structure during the week</li>
          <li>Use weekends if you prefer catching up outside class time</li>
        </ul>
      </div>
    </div>
  );
}

function WorktimePreferenceSection({ worktimePreference, onWorktimePreferenceChange, onSubmit, isSaving, hasUnsaved, saveSignal }) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="What time of day works best for study?" description="This tells auto schedules whether to prefer daytime, nighttime, or either." />
            <div className={styles.formGroup}>
              <label htmlFor="worktime-preferences">Preferred study time</label>
              <select id="worktime-preferences" value={worktimePreference} onChange={(e) => onWorktimePreferenceChange(e.target.value)}>
                <option value="both">Any time (day and night)</option>
                <option value="day">Daytime only</option>
                <option value="night">Nighttime only</option>
              </select>
            </div>
            <SubmitButton isSaving={isSaving} label="Save study time preference" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>⏰</span>
        <h3 className={styles.contextCardTitle}>What this changes</h3>
        <ul className={styles.contextCardList}>
          <li>Daytime keeps study blocks in normal waking hours</li>
          <li>Nighttime is useful if you work better later in the day</li>
        </ul>
      </div>
    </div>
  );
}

function saveSignalState(mode, theme) {
  return { appearance: { mode, theme }, signal: 0 };
}

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
  const [minutesPerDay, setMinutesPerDay] = useState("120");
  const [initialMinutesPerDay, setInitialMinutesPerDay] = useState("120");
  const [weekPreference, setWeekPreference] = useState("both");
  const [initialWeekPreference, setInitialWeekPreference] = useState("both");
  const [worktimePreference, setWorktimePreference] = useState("both");
  const [initialWorktimePreference, setInitialWorktimePreference] = useState("both");
  const [studySaveSignal, setStudySaveSignal] = useState(0);
  const [weekSaveSignal, setWeekSaveSignal] = useState(0);
  const [worktimeSaveSignal, setWorktimeSaveSignal] = useState(0);
  const [studyIsSaving, setStudyIsSaving] = useState(false);
  const [weekIsSaving, setWeekIsSaving] = useState(false);
  const [worktimeIsSaving, setWorktimeIsSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [appearanceState, setAppearanceState] = useState(() => saveSignalState(mode, theme));
  const sleepSettings = useSleepScheduleSettings();

  useEffect(() => {
    getUserSettings().then(applyScheduleSettings).finally(() => setLoadingPrefs(false));
  }, []);

  useEffect(() => {
    setAppearanceState((current) => ({ ...current, appearance: current.appearance.mode ? current.appearance : { mode, theme } }));
  }, [mode, theme]);

  const hasUnsavedAppearance = hasAppearanceChanges({ mode, theme }, appearanceState.appearance);
  const hasUnsavedStudyTime = minutesPerDay !== initialMinutesPerDay;
  const hasUnsavedWeekPreference = weekPreference !== initialWeekPreference;
  const hasUnsavedWorktimePreference = worktimePreference !== initialWorktimePreference;

  if (loadingPrefs || sleepSettings.loading) return <SectionSkeleton label="Loading preferences" rows={6} />;

  const triggerAppearanceSaved = () => {
    setAppearanceState(({ signal }) => ({ appearance: { mode, theme }, signal: signal + 1 }));
  };

  const saveStudyTime = async (event) => {
    event.preventDefault();
    setStudyIsSaving(true);
    const safeValue = Math.max(30, Math.min(600, Number(minutesPerDay) || 120));
    try {
      const settings = await onStudyTimeSave({ preferred_study_minutes_per_day: safeValue });
      if (!settings) return;
      const value = String(settings.preferred_study_minutes_per_day ?? safeValue);
      setMinutesPerDay(value);
      setInitialMinutesPerDay(value);
      setStudySaveSignal((current) => current + 1);
    } finally {
      setStudyIsSaving(false);
    }
  };

  const saveWeekPreference = async (event) => {
    event.preventDefault();
    setWeekIsSaving(true);
    try {
      const settings = await onWeekPreferenceSave({ week_preference: weekPreference });
      if (!settings) return;
      const value = settings.week_preference || weekPreference;
      setWeekPreference(value);
      setInitialWeekPreference(value);
      setWeekSaveSignal((current) => current + 1);
    } finally {
      setWeekIsSaving(false);
    }
  };

  const saveWorktimePreference = async (event) => {
    event.preventDefault();
    setWorktimeIsSaving(true);
    try {
      const settings = await onWorktimePreferenceSave({ worktime_preference: worktimePreference });
      if (!settings) return;
      const value = settings.worktime_preference || worktimePreference;
      setWorktimePreference(value);
      setInitialWorktimePreference(value);
      setWorktimeSaveSignal((current) => current + 1);
    } finally {
      setWorktimeIsSaving(false);
    }
  };

  return (
    <div className={styles.preferencesContainer}>
      <div className={styles.preferencesContent}>
        {activeSubTab === "themes" ? <AppearanceForm mode={mode} setMode={setMode} theme={theme} setTheme={setTheme} onSave={onSave} isSaving={isSaving} hasUnsaved={hasUnsavedAppearance} saveSignal={appearanceState.signal} onSaved={triggerAppearanceSaved} /> : null}
        {activeSubTab === "sleep" ? <SleepSettingsPanel settings={sleepSettings} onSleepSave={onSleepSave} isSaving={isSaving} /> : null}
        {activeSubTab === "scheduling" ? <SchedulingPanel studyTimeProps={getStudyTimeProps()} weekPreferenceProps={getWeekPreferenceProps()} worktimeProps={getWorktimeProps()} /> : null}
        {activeSubTab === "studytime" ? <StudyTimeSection minutesPerDay={minutesPerDay} onMinutesChange={setMinutesPerDay} onSubmit={saveStudyTime} isSaving={isSaving} hasUnsaved={hasUnsavedStudyTime} saveSignal={studySaveSignal} /> : null}
        {activeSubTab === "week" ? <WeekPreferenceSection weekPreference={weekPreference} onWeekPreferenceChange={setWeekPreference} onSubmit={saveWeekPreference} isSaving={isSaving} hasUnsaved={hasUnsavedWeekPreference} saveSignal={weekSaveSignal} /> : null}
        {activeSubTab === "daynight" ? <WorktimePreferenceSection worktimePreference={worktimePreference} onWorktimePreferenceChange={setWorktimePreference} onSubmit={saveWorktimePreference} isSaving={isSaving} hasUnsaved={hasUnsavedWorktimePreference} saveSignal={worktimeSaveSignal} /> : null}
      </div>
    </div>
  );

  function applyScheduleSettings(data) {
    if (data?.preferred_study_minutes_per_day) {
      const value = String(data.preferred_study_minutes_per_day);
      setMinutesPerDay(value);
      setInitialMinutesPerDay(value);
    }
    if (data?.week_preference) {
      setWeekPreference(data.week_preference);
      setInitialWeekPreference(data.week_preference);
    }
    if (data?.worktime_preference) {
      setWorktimePreference(data.worktime_preference);
      setInitialWorktimePreference(data.worktime_preference);
    }
  }

  function getStudyTimeProps() {
    return { minutesPerDay, onMinutesChange: setMinutesPerDay, onSubmit: saveStudyTime, isSaving: studyIsSaving, hasUnsaved: hasUnsavedStudyTime, saveSignal: studySaveSignal };
  }

  function getWeekPreferenceProps() {
    return { weekPreference, onWeekPreferenceChange: setWeekPreference, onSubmit: saveWeekPreference, isSaving: weekIsSaving, hasUnsaved: hasUnsavedWeekPreference, saveSignal: weekSaveSignal };
  }

  function getWorktimeProps() {
    return { worktimePreference, onWorktimePreferenceChange: setWorktimePreference, onSubmit: saveWorktimePreference, isSaving: worktimeIsSaving, hasUnsaved: hasUnsavedWorktimePreference, saveSignal: worktimeSaveSignal };
  }
}

function SchedulingPanel({ studyTimeProps, weekPreferenceProps, worktimeProps }) {
  return (
    <div>
      <div className={styles.settingsTile} style={{ marginBottom: "16px" }}>
        <SectionHeader
          title="Scheduling"
          description="These settings guide how auto schedules are created. They do not change your classes or existing events."
        />
      </div>
      <StudyTimeSection {...studyTimeProps} />
      <WeekPreferenceSection {...weekPreferenceProps} />
      <WorktimePreferenceSection {...worktimeProps} />
    </div>
  );
}
