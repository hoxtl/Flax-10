import { useEffect, useState } from 'react';
import styles from './SchedulesPage.module.css';
import { deleteSchedule, getSchedules, renameSchedule } from '../../api/scheduleApi';
import { useNotifications } from '../../context/NotificationContext';

export default function SchedulesPage() {
  const { addNotification } = useNotifications();
  const [schedules, setSchedules] = useState([]);

  const load = () => getSchedules().then(setSchedules).catch((e) => {
    addNotification({ title: 'Schedules', message: e.message, notification_type: 'general' });
  });

  useEffect(() => { load(); }, []);

  const onRename = async (id, currentTitle) => {
    const nextTitle = window.prompt('Rename schedule', currentTitle);
    if (!nextTitle || !nextTitle.trim()) return;
    try {
      const data = await renameSchedule(id, nextTitle.trim());
      if (data.overwritten) {
        addNotification({ title: 'Schedule overwritten', message: 'Existing schedule with that name was replaced.', notification_type: 'general' });
      }
      load();
    } catch (e) {
      addNotification({ title: 'Rename failed', message: e.message, notification_type: 'general' });
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      addNotification({ title: 'Delete failed', message: e.message, notification_type: 'general' });
    }
  };

  return (
    <div className={styles.page}>
      <h2>Schedules</h2>
      {!schedules.length && <p className={styles.empty}>No schedules yet. Use Quick Add → Schedule to create one.</p>}
      <div className={styles.list}>
        {schedules.map(s => (
          <div key={s.id} className={styles.card}>
            <div>
              <h3>{s.title}</h3>
              <p>{s.event_allocations?.length || 0} allocated events</p>
            </div>
            <div className={styles.actions}>
              <button onClick={() => onRename(s.id, s.title)}>Rename</button>
              <button onClick={() => onDelete(s.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
