import { useState, useEffect } from 'react';
import { getUserSettings } from '../../api/userService';
import DateTimePicker from '../../pages/Tasks/components/DateTimePicker';
import { SectionHeader, SubmitButton } from './SettingsUI';
import SectionSkeleton from '../common/LoadingState/SectionSkeleton';
import styles from '../../pages/Settings/Settings.module.css';

export function SleepSchedulePanel({ onSave, isSaving }) {
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSettings()
      .then(data => {
        if (data?.sleep_time) setSleepTime(data.sleep_time.slice(0, 5));
        if (data?.wake_time)  setWakeTime(data.wake_time.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await onSave({ sleep_time: sleepTime, wake_time: wakeTime });
  };

  const sleepDuration = () => {
    const [sh, sm] = sleepTime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let mins = (wh * 60 + wm) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const sleepDurationMeta = () => {
    const [sh, sm] = sleepTime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let mins = (wh * 60 + wm) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return `${mins} minutes total`;
  };

  if (loading) return <SectionSkeleton label="Loading sleep schedule" rows={3} />;

  return (
    <form className={styles.form} onSubmit={handleSave}>
      <SectionHeader
        title="Sleep Schedule"
        description="We'll warn you if you try to add tasks during your sleep window."
      />

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Bedtime</label>
          <DateTimePicker
            value={sleepTime}
            onChange={(v) => setSleepTime(v || "23:00")}
            placeholder="Pick bedtime"
            timeOnly
          />
        </div>

        <div className={styles.formGroup}>
          <label>Wake up</label>
          <DateTimePicker
            value={wakeTime}
            onChange={(v) => setWakeTime(v || "07:00")}
            placeholder="Pick wake time"
            timeOnly
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Sleep duration</label>
        <div className={styles.sleepDurationCard} role="status" aria-live="polite">
          <div className={styles.sleepDurationMain}>{sleepDuration()}</div>
          <div className={styles.sleepDurationMeta}>{sleepDurationMeta()}</div>
        </div>
      </div>

      <SubmitButton isSaving={isSaving} label="Save" savingLabel="Saving…" />
    </form>
  );
}
