/*
 * Manual schedule form.
 */

import styles from '../shared/scheduleFormStyles';
import { ManualScheduleEventList } from './ManualScheduleEventList';
import { ManualScheduleFields } from './ManualScheduleFields';
import { submitManualSchedule } from './submitManualSchedule';
import { useManualScheduleForm } from './useManualScheduleForm';

export function ManualScheduleForm({ onDone }) {
  const form = useManualScheduleForm();
  const onSubmit = () => submitManualSchedule({ ...form, onDone }).catch(toErrorToast(form.showToast));

  return (
    <div className={styles.formWrap}>
      <ManualScheduleFields {...form} />
      <ManualScheduleEventList {...form} />
      <button className={styles.primaryBtn} type="button" onClick={onSubmit}>Create Schedule</button>
    </div>
  );
}

function toErrorToast(showToast) {
  return (error) => showToast(error.message, { variant: 'error' });
}
