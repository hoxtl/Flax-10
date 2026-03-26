/**
 * Task widget row.
 */

import { motion as Motion } from "framer-motion";
import { itemVariants } from "../../../components/Modules/shared/widgetVariants.js";
import InlineTitleField, { useInlineEdit } from "../../../components/common/inline_title_field/InlineTitleField";
import TaskPriorityPill from "../../../components/common/task_priority_pill/TaskPriorityPill";
import DeadlineCountdown from "../../../components/common/deadline_countdown/DeadlineCountdown";
import urgentGlowStyles from "../../../components/common/urgent_glow/UrgentGlow.module.css";
import rowStyles from "../../Modules/DashboardRows.module.css";

function getRowClassName(isOverdue, urgentGlow) {
  const base = rowStyles.deadlineRow;
  const overdue = isOverdue ? rowStyles.rowOverdue : "";
  const glow = urgentGlow ? urgentGlowStyles.urgentGlow : "";
  return `${base} ${overdue} ${glow}`.trim();
}

function openContextMenu(event, props) {
  event.preventDefault();
  props.setCtxMenu({ task: props.task, x: event.clientX, y: event.clientY });
}

function TaskCheckbox({ handleTaskWidgetComplete, task }) {
  return (
    <button
      type="button"
      className={rowStyles.taskCheckbox}
      onClick={(event) => handleComplete(event, handleTaskWidgetComplete, task)}
      aria-label={`Complete ${task.title}`}
      aria-pressed={Boolean(task.completed)}
    />
  );
}

function handleComplete(event, handleTaskWidgetComplete, task) {
  event.stopPropagation();
  handleTaskWidgetComplete(task);
}

function TaskRowLeft({ edit, task }) {
  return (
    <div className={rowStyles.deadlineRowLeft}>
      <span className={rowStyles.deadlineTitle}>
        <InlineTitleField
          value={task.title}
          isEditing={edit.isEditing}
          draft={edit.draft}
          setDraft={edit.setDraft}
          onStart={edit.start}
          onSave={edit.save}
          onCancel={edit.cancel}
        />
      </span>
    </div>
  );
}

function TaskRowRight({ task }) {
  if (!task.due_date) return null;
  return (
    <div className={rowStyles.widgetRowMeta}>
      {task.priority ? <TaskPriorityPill priority={task.priority} compact /> : null}
      <DeadlineCountdown dueDate={task.due_date} showPriority={false} />
    </div>
  );
}

export function TaskWidgetRow(props) {
  const edit = useInlineEdit(props.task.title, (title) => props.onInlineTaskEdit?.(props.task, { title }));
  return (
    <Motion.div
      className={getRowClassName(props.isOverdue, props.urgentGlow)}
      style={{ "--deadline-row-accent": props.rowAccent }}
      variants={itemVariants}
      onContextMenu={(event) => openContextMenu(event, props)}
    >
      <TaskCheckbox handleTaskWidgetComplete={props.handleTaskWidgetComplete} task={props.task} />
      <TaskRowLeft edit={edit} task={props.task} />
      <TaskRowRight task={props.task} />
    </Motion.div>
  );
}
