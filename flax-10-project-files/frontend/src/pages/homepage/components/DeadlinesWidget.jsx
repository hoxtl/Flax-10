<<<<<<< HEAD
import { AlarmClock } from "lucide-react";
import { Link } from "react-router-dom";
import { UpcomingDeadlinesWidget } from '../../../components/modules/deadlines/UpcomingDeadlinesWidget';
import EmptyStateCard from "./EmptyStateCard";
import taskStyles from "../styles/TaskWidget.module.css";

function DeadlineEmptyState({ isTeacher }) {
  return (
    <EmptyStateCard
      icon={AlarmClock}
      sub={null}
      message={isTeacher ? "No teaching deadlines upcoming." : "No deadlines need attention."}
      action={<Link to="/modules" className={taskStyles.taskWidgetLink}>Go to my modules →</Link>}
    />
  );
}

export function DeadlinesWidget({ deadlines = [], onSelectDeadline, onSelectModule, isTeacher = false }) {
  return (
    <UpcomingDeadlinesWidget
      deadlines={deadlines}
      title={isTeacher ? "Teaching Deadlines" : "Upcoming Deadlines"}
=======
import { UpcomingDeadlinesWidget } from '../../../components/Modules/Deadlines/UpcomingDeadlinesWidget';

export function DeadlinesWidget({ deadlines = [], onSelectDeadline, onSelectModule }) {
  return (
    <UpcomingDeadlinesWidget
      deadlines={deadlines}
      title="Upcoming Deadlines"
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      initialShown={3}
      embedded
      interactiveRows
      onSelectDeadline={onSelectDeadline}
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/DeadlinesWidget.jsx
      onSelectModule={onSelectModule}
<<<<<<< HEAD
=======
      onModuleCodeClick={onSelectModule ? (code) => onSelectModule({ code }) : null}
>>>>>>> main:flax-10-project-files/frontend/src/pages/homepage/components/DeadlinesWidget.jsx
      emptyMessage={isTeacher ? "No teaching deadlines upcoming." : "No deadlines need attention."}
      emptySub={isTeacher ? "Deadlines from modules you teach will show up here." : "Upcoming coursework and exams will show up here."}
      renderEmpty={() => <DeadlineEmptyState isTeacher={isTeacher} />}
=======
      emptyMessage="No deadlines need attention."
      emptySub="Upcoming coursework and exams will show up here."
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    />
  );
}
