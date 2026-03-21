/*
 * Manual schedule inputs.
 */
import styles from '../shared/scheduleFormStyles';

export function ManualScheduleFields({ title, setTitle, eventSearch, setEventSearch }) {
  return (
    <>
      <label className={styles.fieldLabel}>Schedule name</label>
      <input className={styles.input} value={title} onChange={toValue(setTitle)} placeholder="My study schedule" />
      <label className={styles.fieldLabel}>Search events</label>
      <input className={styles.input} value={eventSearch} onChange={toValue(setEventSearch)} placeholder="Search schedule events" />
    </>
  );
}

function toValue(setter) {
  return (event) => setter(event.target.value);
}
