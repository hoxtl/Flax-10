/*
 * Schedule-tagged event loading.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { getEvents } from '../../../api/eventApi';

export async function loadScheduleTaggedEvents(setEvents, setSelected, showToast) {
  try {
    const events = await getEvents();
    const scheduleTagged = events.filter(isScheduleTaggedEvent);
    setEvents(scheduleTagged);
    setSelected(scheduleTagged.map((event) => event.id));
  } catch {
    showToast('Unable to load schedule-tagged events.', { variant: 'error' });
  }
}

function isScheduleTaggedEvent(event) {
  return (event.tag_name || '').toLowerCase() === 'schedule';
}
