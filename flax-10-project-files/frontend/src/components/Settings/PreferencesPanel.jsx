/*
 * Preferences panel for appearance, sleep, and scheduling settings.
 */
import { useEffect, useState } from "react";
import { getUserSettings } from "../../api/user/userApi";
import { useTheme } from "../../context/ThemeContext";
import AnimatedDropdown from "../Common/AnimatedDropdown";
import SectionSkeleton from "../Common/LoadingState/SectionSkeleton";
import styles from "../../pages/Settings/Settings.module.css";
import { SectionHeader, SubmitButton } from "./SettingsUI";
import SettingsContextCard from "./SettingsContextCard";
import AppearanceSection from "./preferences/AppearanceSection";
import SleepSection from "./preferences/SleepSection";
import useSleepScheduleSettings from "./preferences/useSleepScheduleSettings";

const WEEK_PREFERENCE_OPTIONS = [
  { value: "both", label: "Weekdays + weekends" },
  { value: "weekdays", label: "Weekdays only" },
  { value: "weekends", label: "Weekends only" },
];

const WORKTIME_PREFERENCE_OPTIONS = [
  { value: "both", label: "Any time" },
  { value: "day", label: "Daytime" },
  { value: "night", label: "Nighttime" },
];

const STUDY_TIME_OPTIONS = Array.from({ length: 20 }, (_, index) => {
  const minutes = (index + 1) * 30;
  return { value: String(minutes), label: formatStudyTimeLabel(minutes) };
});

function formatStudyTimeLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${minutes} min`;
  if (!remainingMinutes) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr ${remainingMinutes} min`;
}

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

function SchedulingDropdownField({ label, value, onChange, options, placeholder }) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <AnimatedDropdown
        className={styles.schedulingDropdown}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        usePortal
        allowFlipUpward={false}
      />
    </div>
  );
}

function SchedulingHint({ children }) {
  return <p className={styles.schedulingHint}>{children}</p>;
}

function SchedulingSideCard() {
  return (
    <SettingsContextCard
      className={styles.schedulingInfoCard}
      emoji="🗓️"
      title="Scheduling setup"
      body="These choices guide where auto-planned study blocks land."
      items={[
        "Daily target keeps plans realistic.",
        "Scheduling days decides which days can be used.",
        "Study time preference leans plans toward day or night.",
      ]}
    />
  );
}

function StudyTimeSection({ minutesPerDay, onMinutesChange, onSubmit, isSaving, hasUnsaved, saveSignal, compact = false }) {
  if (compact) {
    return (
      <div className={`${styles.settingsTile} ${styles.schedulingCompactTile}`}>
        <form onSubmit={onSubmit}>
          <SectionHeader title="Daily study target" description="A soft cap for auto plans." />
          <SchedulingDropdownField
            label="Daily study time"
            value={minutesPerDay}
            onChange={onMinutesChange}
            options={STUDY_TIME_OPTIONS}
            placeholder="Choose a target"
          />
          <SchedulingHint>StudyFlax will try to stay within this total each day.</SchedulingHint>
          <SubmitButton isSaving={isSaving} label="Save target" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
        </form>
      </div>
    );
  }

  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Daily study target" description="Set a soft limit for auto plans." />
            <SchedulingDropdownField
              label="Daily study time"
              value={minutesPerDay}
              onChange={onMinutesChange}
              options={STUDY_TIME_OPTIONS}
              placeholder="Choose a target"
            />
            <SchedulingHint>StudyFlax will try to stay within this total each day.</SchedulingHint>
            <SubmitButton isSaving={isSaving} label="Save daily study time" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>📚</span>
        <h3 className={styles.contextCardTitle}>Quick guide</h3>
        <ul className={styles.contextCardList}>
          <li>Higher values allow longer study plans.</li>
          <li>Lower values keep busy days lighter.</li>
        </ul>
      </div>
    </div>
  );
}

function WeekPreferenceSection({ weekPreference, onWeekPreferenceChange, onSubmit, isSaving, hasUnsaved, saveSignal, compact = false }) {
  if (compact) {
    return (
      <div className={`${styles.settingsTile} ${styles.schedulingCompactTile}`}>
        <form onSubmit={onSubmit}>
          <SectionHeader title="Scheduling days" description="Pick which days can be used." />
          <SchedulingDropdownField
            label="Days available for scheduling"
            value={weekPreference}
            onChange={onWeekPreferenceChange}
            options={WEEK_PREFERENCE_OPTIONS}
            placeholder="Choose days"
          />
          <SchedulingHint>Auto plans will stay inside these days.</SchedulingHint>
          <SubmitButton isSaving={isSaving} label="Save days" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
        </form>
      </div>
    );
  }

  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Scheduling days" description="Pick weekdays, weekends, or both." />
            <SchedulingDropdownField
              label="Days available for scheduling"
              value={weekPreference}
              onChange={onWeekPreferenceChange}
              options={WEEK_PREFERENCE_OPTIONS}
              placeholder="Choose days"
            />
            <SchedulingHint>Auto plans will stay inside these days.</SchedulingHint>
            <SubmitButton isSaving={isSaving} label="Save scheduling days" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>📅</span>
        <h3 className={styles.contextCardTitle}>Quick guide</h3>
        <ul className={styles.contextCardList}>
          <li>Weekdays add structure around classes.</li>
          <li>Weekends leave room for catch-up blocks.</li>
        </ul>
      </div>
    </div>
  );
}

function WorktimePreferenceSection({ worktimePreference, onWorktimePreferenceChange, onSubmit, isSaving, hasUnsaved, saveSignal, compact = false }) {
  if (compact) {
    return (
      <div className={`${styles.settingsTile} ${styles.schedulingCompactTile}`}>
        <form onSubmit={onSubmit}>
          <SectionHeader title="Study time preference" description="Pick when plans should lean." />
          <SchedulingDropdownField
            label="Preferred study time"
            value={worktimePreference}
            onChange={onWorktimePreferenceChange}
            options={WORKTIME_PREFERENCE_OPTIONS}
            placeholder="Choose a time"
          />
          <SchedulingHint>Use this to steer plans toward day or night.</SchedulingHint>
          <SubmitButton isSaving={isSaving} label="Save study time" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
        </form>
      </div>
    );
  }

  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader title="Study time preference" description="Pick daytime, nighttime, or either." />
            <SchedulingDropdownField
              label="Preferred study time"
              value={worktimePreference}
              onChange={onWorktimePreferenceChange}
              options={WORKTIME_PREFERENCE_OPTIONS}
              placeholder="Choose a time"
            />
            <SchedulingHint>Use this to steer plans toward day or night.</SchedulingHint>
            <SubmitButton isSaving={isSaving} label="Save study time preference" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>⏰</span>
        <h3 className={styles.contextCardTitle}>Quick guide</h3>
        <ul className={styles.contextCardList}>
          <li>Daytime keeps blocks in waking hours.</li>
          <li>Nighttime works better for late focus.</li>
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
    <div className={styles.schedulingLayout}>
      <div className={styles.schedulingPanel}>
        <StudyTimeSection {...studyTimeProps} compact />
        <div className={styles.schedulingSplitRow}>
          <WeekPreferenceSection {...weekPreferenceProps} compact />
          <WorktimePreferenceSection {...worktimeProps} compact />
        </div>
      </div>
      <div className={styles.schedulingAside}>
        <SchedulingSideCard />
      </div>
    </div>
  );
}
