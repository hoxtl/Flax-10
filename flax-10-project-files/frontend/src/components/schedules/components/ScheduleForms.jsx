/*
 * Schedule form entry points.
 */

import { AutoScheduleForm } from '../auto/AutoScheduleForm';
import { ManualScheduleForm } from '../manual/ManualScheduleForm';

export function ScheduleManualForm(props) {
  return <ManualScheduleForm {...props} />;
}

export function ScheduleAutoForm(props) {
  return <AutoScheduleForm {...props} />;
}
