/*
 * Auto schedule submission.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { createSchedule } from '../../../api/scheduleApi';
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
