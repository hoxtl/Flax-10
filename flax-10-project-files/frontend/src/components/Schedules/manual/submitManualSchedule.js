/*
 * Manual schedule submission.
 */
import { createSchedule } from '../../../api/scheduleApi';
import { getManualScheduleError } from './manualScheduleUtils';

export async function submitManualSchedule({ title, selected, showToast, onDone }) {
  const error = getManualScheduleError(title, selected);
  if (error) return showToast(error, { variant: 'error' });

  const trimmedTitle = title.trim();
  const data = await createSchedule({ mode: 'manual', title: trimmedTitle, event_ids: selected });
  if (data.overwritten) showToast('A schedule with this name existed and was replaced.', { variant: 'info' });
  showToast(`Saved ${selected.length} events to "${trimmedTitle}".`, { variant: 'success' });
  onDone?.();
}
