/**
 * Task widget row.
 */

import { motion } from "framer-motion";
import InlineTitleField, { useInlineEdit } from "../../../components/common/InlineTitleField/InlineTitleField";

export const itemVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
};

export function TaskWidgetRow(props) {
  const edit = useInlineEdit(props.task.title, (title) => props.onInlineTaskEdit?.(props.task, { title }));
  return (
    <motion.li layout variants={itemVariants} className={getRowClassName(props)} style={{ "--task-row-accent": props.rowAccent }} onContextMenu={(event) => openContextMenu(event, props)}>
      <TaskCheckbox {...props} />
      <TaskWidgetBody {...props} edit={edit} />
    </motion.li>
  );
}

function getRowClassName({ idx, isOverdue, styles }) {
  const flags = [styles.taskWidgetTaskRow];
  if (isOverdue) flags.push(styles.taskWidgetTaskRowOverdue);
  if (idx === 0) flags.push(styles.taskWidgetTaskRowNext);
  return flags.join(" ");
}

function openContextMenu(event, props) {
  event.preventDefault();
  props.setCtxMenu({ task: props.task, x: event.clientX, y: event.clientY });
}

function TaskCheckbox({ handleTaskWidgetComplete, styles, task }) {
  return (
    <button type="button" className={styles.taskWidgetCheckbox} onClick={(event) => handleComplete(event, handleTaskWidgetComplete, task)} aria-label={`Complete ${task.title}`}>
      <motion.span className={styles.taskWidgetCheckboxCircle} aria-hidden animate={{ scale: 1 }} transition={{ duration: 0.2 }} />
    </button>
  );
}

function handleComplete(event, handleTaskWidgetComplete, task) {
  event.stopPropagation();
  handleTaskWidgetComplete(task);
}

function TaskWidgetBody({ categoryLabel, categoryStyle, edit, styles, task, urgency }) {
  return (
    <div className={styles.taskWidgetTaskBody}>
      <div className={styles.taskWidgetTaskTopRow}>
        <CategoryPill categoryLabel={categoryLabel} categoryStyle={categoryStyle} styles={styles} />
        <TaskTitle edit={edit} styles={styles} task={task} />
        <UrgencyPill edit={edit} styles={styles} urgency={urgency} />
      </div>
    </div>
  );
}

function CategoryPill({ categoryLabel, categoryStyle, styles }) {
  if (!categoryLabel) return null;
  return <span className={styles.taskWidgetCategoryPill} style={{ background: categoryStyle.bg, color: categoryStyle.text }}>{categoryLabel}</span>;
}

function TaskTitle({ edit, styles, task }) {
  return (
    <span className={styles.taskWidgetTaskTitle}>
      <InlineTitleField value={task.title} isEditing={edit.isEditing} draft={edit.draft} setDraft={edit.setDraft} onStart={edit.start} onSave={edit.save} onCancel={edit.cancel} />
    </span>
  );
}

function UrgencyPill({ edit, styles, urgency }) {
  if (!urgency || edit.isEditing) return null;
  return <span className={`${styles.taskWidgetUrgencyPill} ${styles[`taskWidgetUrgencyPill${capitalize(urgency.tone)}`]}`}>{urgency.label}</span>;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
