import { AlarmClock } from "lucide-react";
import { Link } from "react-router-dom";
import { UpcomingDeadlinesWidget } from '../../../components/Modules/Deadlines/UpcomingDeadlinesWidget';
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
      initialShown={3}
      embedded
      interactiveRows
      onSelectDeadline={onSelectDeadline}
      onModuleCodeClick={onSelectModule ? (code) => onSelectModule({ code }) : null}
      emptyMessage={isTeacher ? "No teaching deadlines upcoming." : "No deadlines need attention."}
      emptySub={isTeacher ? "Deadlines from modules you teach will show up here." : "Upcoming coursework and exams will show up here."}
      renderEmpty={() => <DeadlineEmptyState isTeacher={isTeacher} />}
    />
  );
}
