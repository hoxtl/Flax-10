/*
 * Auto schedule submission.
 */
import { createSchedule } from '../../../api/calendar/scheduleApi';
import { buildAutoSchedulePayload, getAutoScheduleError } from './autoScheduleUtils';

export async function submitAutoSchedule({ title, deadlines, showToast, onDone }) {
  const error = getAutoScheduleError(deadlines);
  if (error) return showToast(error, { variant: 'error' });

  const payload = buildAutoSchedulePayload(title, deadlines);
  const data = await createSchedule(payload);
  if (data.overwritten) showToast('A schedule with this name existed and was replaced.', { variant: 'info' });
  showToast('Your auto schedule is ready.', { variant: 'success' });
  onDone?.();
}
