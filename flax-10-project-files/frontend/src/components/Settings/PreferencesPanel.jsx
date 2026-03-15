/**
 * Combined Preferences panel covering Appearance (theme) and Sleep Schedule.
 * Each section saves independently via its own submit handler.
 */
import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { SectionHeader, SubmitButton, ThemeSelector } from "./SettingsUI";
import SectionSkeleton from "../common/LoadingState/SectionSkeleton";
import DateTimePicker from "../../pages/Tasks/components/DateTimePicker";
import { getUserSettings } from "../../api/userService";
import styles from "../../pages/Settings/Settings.module.css";

function sleepDuration(sleepTime, wakeTime) {
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let mins = wh * 60 + wm - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { label: m > 0 ? `${h}h ${m}m` : `${h}h`, meta: `${mins} minutes total` };
}

function SleepCard({ totalMins, duration }) {
  const h = totalMins / 60;
  // Map hours to position on scale: 0h=0%, 10h=100%
  const pct = Math.min(98, Math.max(2, (h / 10) * 100));
  // Colors match the gradient: amber → green → violet
  const color = h > 9 ? "#7c3aed" : h >= 7 ? "#15803d" : h >= 5 ? "#eab308" : "#f59e0b";
  const qualityLabel = h > 9 ? "Too much" : h >= 7 ? "Great" : h >= 5 ? "Fair" : "Low";

  return (
    <div className={styles.sleepDurationCard} role="status" aria-live="polite" style={{ "--sleepLabelColor": color }}>
      <span className={styles.sleepMoonWatermark}>🌙</span>
      <div className={styles.sleepCardTopRow}>
        <div>
          <div className={styles.sleepDurationMain}>{duration.label}</div>
          <div className={styles.sleepDurationMeta}>{duration.meta}</div>
        </div>
        <span className={styles.sleepBatteryLabel}>
          {qualityLabel}
        </span>
      </div>
      <div className={styles.sleepGradientTrack}>
        <div className={styles.sleepGradientIndicator} style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

function AppearanceSection({ theme, onChange }) {
  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <SectionHeader
            title="Appearance"
          />
          <div className={styles.formGroup}>
            <ThemeSelector value={theme} onChange={onChange} />
          </div>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>🎨</span>
        <h3 className={styles.contextCardTitle}>Theme preferences</h3>
        <ul className={styles.contextCardList}>
          <li>Consistent look across every page</li>
          <li>Lower eye strain during long sessions</li>
          <li>Personalised experience on login</li>
        </ul>
      </div>
    </div>
  );
}

function SleepSection({
  sleepTime,
  wakeTime,
  onSleepChange,
  onWakeChange,
  onSubmit,
  isSaving,
  hasUnsaved,
  saveSignal,
}) {
  const duration = sleepDuration(sleepTime, wakeTime);
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let totalMins = wh * 60 + wm - (sh * 60 + sm);
  if (totalMins <= 0) totalMins += 24 * 60;

  return (
    <div className={styles.twoColLayout}>
      <div>
        <div className={styles.settingsTile}>
          <form onSubmit={onSubmit}>
            <SectionHeader
              title="Sleep Schedule"
            />
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Bedtime</label>
                <DateTimePicker
                  value={sleepTime}
                  onChange={(v) => onSleepChange(v || "23:00")}
                  placeholder="Pick bedtime"
                  timeOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label>Wake up</label>
                <DateTimePicker
                  value={wakeTime}
                  onChange={(v) => onWakeChange(v || "07:00")}
                  placeholder="Pick wake time"
                  timeOnly
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Sleep duration</label>
              <SleepCard totalMins={totalMins} duration={duration} />
            </div>
            <SubmitButton
              isSaving={isSaving}
              label="Save Sleep Schedule"
              savingLabel="Saving..."
              hasUnsaved={hasUnsaved}
              saveSignal={saveSignal}
            />
          </form>
        </div>
      </div>
      <div className={styles.contextCard}>
        <span className={styles.contextCardEmoji}>🌙</span>
        <h3 className={styles.contextCardTitle}>Sleep planning</h3>
        <p className={styles.contextCardBody}>
          StudyFlax uses these hours to reduce late-night prompts and schedule tasks around your rest.
        </p>
        <ul className={styles.contextCardList}>
          <li>Fewer distractions during sleep hours</li>
          <li>Better timing for reminders and sessions</li>
          <li>More realistic daily study plans</li>
        </ul>
      </div>
    </div>
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
                step={15}
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
          <li>Customizable, desirable study length per day</li>
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
export default function PreferencesPanel({ onSave, onSleepSave, isSaving, onStudyTimeSave }) {
  const { theme, setTheme } = useTheme();
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [initialSleepTime, setInitialSleepTime] = useState("23:00");
  const [initialWakeTime, setInitialWakeTime] = useState("07:00");
  const [loading, setLoading] = useState(true);
  const [sleepSaveSignal, setSleepSaveSignal] = useState(0);
  const [minutesPerDay, setMinutesPerDay] = useState("120");
  const [initialMinutesPerDay, setInitialMinutesPerDay] = useState("120");
  const [studySaveSignal, setStudySaveSignal] = useState(0);

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
      })
      .finally(() => setLoading(false));
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    onSave({ theme: newTheme });
  };

  const hasUnsavedSleep = sleepTime !== initialSleepTime || wakeTime !== initialWakeTime;
  const hasUnsavedStudyTime = minutesPerDay !== initialMinutesPerDay;

  if (loading) return <SectionSkeleton label="Loading preferences" rows={4} />;

  return (
    <div className={styles.form}>
      <AppearanceSection theme={theme} onChange={handleThemeChange} />
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
    </div>
  );
}
