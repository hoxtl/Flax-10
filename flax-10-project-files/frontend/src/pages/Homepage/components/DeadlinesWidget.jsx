import { UpcomingDeadlinesWidget } from '../../../components/Modules/Deadlines/UpcomingDeadlinesWidget';

export function DeadlinesWidget({ deadlines = [], onSelectDeadline, onSelectModule }) {
  return (
    <UpcomingDeadlinesWidget
      deadlines={deadlines}
      title="Upcoming Deadlines"
      initialShown={3}
      embedded
      interactiveRows
      onSelectDeadline={onSelectDeadline}
      onSelectModule={onSelectModule}
      emptyMessage="No deadlines need attention."
      emptySub="Upcoming coursework and exams will show up here."
    />
  );
}
