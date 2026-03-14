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
    <div className={styles.sleepDurationCard} role="status" aria-live="polite">
      <span className={styles.sleepMoonWatermark}>🌙</span>
      <div className={styles.sleepCardTopRow}>
        <div>
          <div className={styles.sleepDurationMain}>{duration.label}</div>
          <div className={styles.sleepDurationMeta}>{duration.meta}</div>
        </div>
        <span className={styles.sleepBatteryLabel} style={{ color }}>{qualityLabel}</span>
      </div>
      <div className={styles.sleepGradientTrack}>
        <div className={styles.sleepGradientIndicator} style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

function AppearanceSection({ theme, onChange, onSubmit, isSaving }) {
  return (
    <div className={styles.settingsTile}>
      <form onSubmit={onSubmit}>
        <SectionHeader
          title="Appearance"
          description="Pick a look that suits your style — saved and applied on every login 🎨"
        />
        <div className={styles.formGroup}>
          <ThemeSelector value={theme} onChange={onChange} />
        </div>
        <SubmitButton isSaving={isSaving} label="Save Appearance" savingLabel="Saving..." />
      </form>
    </div>
  );
}

function SleepSection({ sleepTime, wakeTime, onSleepChange, onWakeChange, onSubmit, isSaving }) {
  const duration = sleepDuration(sleepTime, wakeTime);
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let totalMins = wh * 60 + wm - (sh * 60 + sm);
  if (totalMins <= 0) totalMins += 24 * 60;

  return (
    <div className={styles.settingsTile}>
      <form onSubmit={onSubmit}>
        <SectionHeader
          title="Sleep Schedule"
          description="Tell us when you rest and we'll plan around it — no late-night task alerts 🌙"
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
        <SubmitButton isSaving={isSaving} label="Save Sleep Schedule" savingLabel="Saving..." />
      </form>
    </div>
  );
}

/**
 * @param {object} props
 * @param {Function} props.onSave - Saves theme preference
 * @param {Function} props.onSleepSave - Saves sleep schedule
 * @param {boolean} props.isSaving
 */
export default function PreferencesPanel({ onSave, onSleepSave, isSaving }) {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [loadingSleep, setLoadingSleep] = useState(true);

  useEffect(() => {
    getUserSettings()
      .then((data) => {
        if (data?.sleep_time) setSleepTime(data.sleep_time.slice(0, 5));
        if (data?.wake_time) setWakeTime(data.wake_time.slice(0, 5));
      })
      .finally(() => setLoadingSleep(false));
  }, []);

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    setTheme(newTheme);
  };

  if (loadingSleep) return <SectionSkeleton label="Loading preferences" rows={4} />;

  return (
    <div className={styles.form}>
      <AppearanceSection
        theme={currentTheme}
        onChange={handleThemeChange}
        onSubmit={(e) => { e.preventDefault(); onSave({ theme: currentTheme }); }}
        isSaving={isSaving}
      />
      <SleepSection
        sleepTime={sleepTime}
        wakeTime={wakeTime}
        onSleepChange={setSleepTime}
        onWakeChange={setWakeTime}
        onSubmit={(e) => { e.preventDefault(); onSleepSave({ sleep_time: sleepTime, wake_time: wakeTime }); }}
        isSaving={isSaving}
      />
    </div>
  );
}
