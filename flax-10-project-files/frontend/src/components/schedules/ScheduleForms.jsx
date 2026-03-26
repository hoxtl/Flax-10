/*
 * Schedule form entry points.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { AutoScheduleForm } from './auto/AutoScheduleForm';
import { ManualScheduleForm } from './manual/ManualScheduleForm';

export function ScheduleManualForm(props) {
  return <ManualScheduleForm {...props} />;
}

export function ScheduleAutoForm(props) {
  return <AutoScheduleForm {...props} />;
}
