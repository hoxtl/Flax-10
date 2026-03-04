import { useState, useEffect } from 'react';
import { getUserSettings } from '../../api/userService';
import styles from './SleepSchedulePanel.module.css';

export function SleepSchedulePanel({ onSave, isSaving }) {
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSettings()
      .then(data => {
        if (data?.sleep_time) setSleepTime(data.sleep_time.slice(0, 5));
        if (data?.wake_time)  setWakeTime(data.wake_time.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await onSave({ sleep_time: sleepTime, wake_time: wakeTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Sleep Schedule</h3>
          <p className={styles.subtitle}>
            We'll warn you if you try to add tasks during your sleep window.
          </p>
        </div>
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Bedtime</span>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
            className={styles.timeInput}
          />
        </label>

        <div className={styles.divider} aria-hidden="true">→</div>

        <label className={styles.field}>
          <span className={styles.label}>Wake up</span>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className={styles.timeInput}
          />
        </label>
      </div>

      <div className={styles.footer}>
        <span className={styles.duration}>
          Sleep duration: <strong>{sleepDuration()}</strong>
        </span>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={isSaving}
        >
          {saved ? '✓ Saved' : isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
