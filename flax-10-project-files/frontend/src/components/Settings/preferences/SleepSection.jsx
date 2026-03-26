/*
 * Sleep settings section and duration card.
 */
<<<<<<< HEAD

import DateTimePicker from "../../../pages/tasks/components/DateTimePicker";
import styles from "../../../pages/settings/Settings.module.css";
=======
import DateTimePicker from "../../../pages/Tasks/components/DateTimePicker";
import styles from "../../../pages/Settings/Settings.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton } from "../SettingsUI";
import { getSleepDuration, getSleepQuality } from "./sleepUtils";

function SleepCard({ totalMinutes, duration }) {
  const quality = getSleepQuality(totalMinutes);
  const left = `${Math.min(98, Math.max(2, (totalMinutes / 600) * 100))}%`;

  return (
    <div className={styles.sleepDurationCard} role="status" aria-live="polite" style={{ "--sleepLabelColor": quality.color }}>
      <span className={styles.sleepMoonWatermark}>🌙</span>
      <div className={styles.sleepCardTopRow}>
        <div>
          <div className={styles.sleepDurationMain}>{duration.label}</div>
          <div className={styles.sleepDurationMeta}>{duration.meta}</div>
        </div>
        <span className={styles.sleepBatteryLabel}>{quality.label}</span>
      </div>
      <div className={styles.sleepGradientTrack}>
        <div className={styles.sleepGradientIndicator} style={{ left }} />
      </div>
    </div>
  );
}

function TimeField({ label, value, onChange, fallback }) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <DateTimePicker value={value} onChange={(nextValue) => onChange(nextValue || fallback)} placeholder={`Pick ${label.toLowerCase()}`} timeOnly />
    </div>
  );
}

function SleepForm(props) {
  const { sleepTime, wakeTime, onSleepChange, onWakeChange, onSubmit, isSaving, hasUnsaved, saveSignal } = props;
  const duration = getSleepDuration(sleepTime, wakeTime);

  return (
    <div className={styles.settingsTile}>
      <form onSubmit={onSubmit}>
        <SectionHeader title="Sleep Schedule" description="We'll warn you if you try to add tasks during your sleep window." />
        <SleepFields sleepTime={sleepTime} wakeTime={wakeTime} onSleepChange={onSleepChange} onWakeChange={onWakeChange} />
        <SleepSummary duration={duration} />
        <SubmitButton isSaving={isSaving} label="Save Sleep Schedule" savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
      </form>
    </div>
  );
}

function SleepFields({ sleepTime, wakeTime, onSleepChange, onWakeChange }) {
  return <div className={styles.formRow}><TimeField label="Bedtime" value={sleepTime} onChange={onSleepChange} fallback="23:00" /><TimeField label="Wake up" value={wakeTime} onChange={onWakeChange} fallback="07:00" /></div>;
}

function SleepSummary({ duration }) {
  return <div className={styles.formGroup}><label>Sleep duration</label><SleepCard totalMinutes={duration.totalMinutes} duration={duration} /></div>;
}

export default function SleepSection(props) {
  return (
    <div className={styles.twoColLayout}>
      <div><SleepForm {...props} /></div>
      <SettingsContextCard
        emoji="🌙"
        title="Sleep planning"
        body="StudyFlax uses these hours to reduce late-night prompts and schedule tasks around your rest."
        items={[
          "Fewer distractions during sleep hours",
          "Better timing for reminders and sessions",
          "More realistic daily study plans",
        ]}
      />
    </div>
  );
}
