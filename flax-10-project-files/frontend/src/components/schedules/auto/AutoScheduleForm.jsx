/*
 * Auto schedule form.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useState } from 'react';
import styles from '../shared/scheduleFormStyles';
import { AutoScheduleSummary } from './AutoScheduleSummary';
import { submitAutoSchedule } from './submitAutoSchedule';
import { useUpcomingDeadlines } from './useUpcomingDeadlines';

export function AutoScheduleForm({ onDone }) {
  const { deadlines, showToast } = useUpcomingDeadlines();
  const [title, setTitle] = useState('Auto schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit = () => runSubmit({ title, deadlines, showToast, onDone, setIsSubmitting });

  return (
    <div className={styles.formWrap}>
      <label className={styles.fieldLabel}>Schedule name</label>
      <input className={styles.input} value={title} onChange={toValue(setTitle)} placeholder="Auto schedule" />
      <AutoScheduleSummary deadlines={deadlines} />
      <button className={styles.primaryBtn} type="button" onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Generating…' : 'Generate Auto Schedule'}
      </button>
    </div>
  );
}

async function runSubmit({ title, deadlines, showToast, onDone, setIsSubmitting }) {
  setIsSubmitting(true);
  try {
    await submitAutoSchedule({ title, deadlines, showToast, onDone });
  } catch (error) {
    showToast(getSubmitErrorMessage(error), { variant: 'error' });
  } finally {
    setIsSubmitting(false);
  }
}

function toValue(setter) {
  return (event) => setter(event.target.value);
}

function getSubmitErrorMessage(error) {
  return error?.message || 'Unable to generate auto schedule.';
}
