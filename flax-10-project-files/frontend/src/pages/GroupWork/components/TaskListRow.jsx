/*
 * GroupWork list task row.
 */

import { useRef, useState } from "react";
import { Check, Calendar, Trash2 } from "lucide-react";
import TaskPriorityPill from "../../../components/Common/TaskPriorityPill/TaskPriorityPill";
import InlineTitleField, { useInlineEdit } from "../../../components/Common/InlineTitleField/InlineTitleField";
import HoldConfirmModal from "../../../components/Common/HoldConfirmModal/HoldConfirmModal";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import DateTimePicker from "../../../components/Common/inputs/DateTimePicker";
import { getUserColor } from "../utils/priorityUtils";
import { buildToggleAssignee, filterVisibleAssignees, formatTaskDueDate, getDueDateStr } from "../utils/taskUtils";
import styles from "./TaskListView.module.css";

function TaskCheckbox({ isDone, color, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`${styles.checkbox} ${isDone ? styles.checkboxDone : ""}`}
      style={{ "--cb-bg": color, "--cb-border": isDone ? color : "var(--border)" }}
    >
      {isDone && <Check size={14} strokeWidth={3} />}
    </button>
  );
}

function AssignCell({ task, members, onUpdate }) {
  const [showPopup, setShowPopup] = useState(false);
  const triggerRef = useRef(null);
  const assignees = filterVisibleAssignees(task.assignees_info || [], members);
  return (
    <div className={styles.assignCell}>
      <div ref={triggerRef} onClick={() => setShowPopup((value) => !value)} className={`${styles.assignClickTarget} ${showPopup ? styles.assignClickTargetActive : ""}`}>
        {assignees.length > 0 ? <TaskAvatarStack assignees={assignees} size={24} /> : <span className={styles.unassigned}>Unassigned</span>}
      </div>
      <TaskAssigneePopup isOpen={showPopup} onClose={() => setShowPopup(false)} members={members} assignees={assignees} onToggleAssignee={buildToggleAssignee(assignees, task.id, onUpdate)} triggerRef={triggerRef} />
    </div>
  );
}

function PrioritySelect({ priority, onUpdate, taskId }) {
  return <TaskPriorityPill priority={priority || "medium"} className={styles.priorityPill} />;
}

function DateCell({ task, onUpdate }) {
  return (
    <div className={styles.dateCell}>
      <DateTimePicker
        value={getDueDateStr(task.due_date)}
        onChange={(value) => onUpdate(task.id, { due_date: value ? new Date(value).toISOString() : null })}
        dateOnly
        triggerClassName={styles.dateLabel}
        placeholder="No due date"
      />
    </div>
  );
}

function ActionCell({ taskId, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className={styles.actionCell}>
      <button onClick={() => setShowConfirm(true)} className={styles.deleteBtn} title="Delete task">
        <Trash2 size={16} />
      </button>
      {showConfirm && (
        <HoldConfirmModal
          title="Delete task"
          warningText="Hold to permanently remove this task."
          cancelLabel="Keep it"
          holdLabel="Hold to delete"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => { setShowConfirm(false); onDelete(taskId); }}
        />
      )}
    </div>
  );
}

function TaskRowTitle({ task, onUpdate }) {
  const edit = useInlineEdit(task.title, (newTitle) => onUpdate(task.id, { title: newTitle }));
  return (
    <div className={styles.titleArea}>
      <InlineTitleField
        value={task.title}
        isEditing={edit.isEditing}
        draft={edit.draft}
        setDraft={edit.setDraft}
        onStart={edit.start}
        onSave={edit.save}
        onCancel={edit.cancel}
        readOnlyStyles={getTitleStyle(task.completed)}
      />
    </div>
  );
}

function getTitleStyle(completed) {
  return {
    textDecoration: completed ? "line-through" : "none",
    color: completed ? "var(--muted)" : "var(--text)",
  };
}

function getCheckboxColor(task, members) {
  const assignee = filterVisibleAssignees(task.assignees_info || [], members)[0];
  return assignee ? getUserColor(assignee.id) : "#8d7355";
}

export default function TaskListRow({ task, members, onToggle, onUpdate, onDelete }) {
  const color = getCheckboxColor(task, members);
  return (
    <div className={styles.taskRow} style={{ opacity: task.completed ? 0.6 : 1 }}>
      <div className={styles.taskMainCell}>
        <TaskCheckbox isDone={task.completed} color={color} onToggle={() => onToggle(task.id, !task.completed)} />
        <TaskRowTitle task={task} onUpdate={onUpdate} />
      </div>
      <PrioritySelect priority={task.priority} onUpdate={onUpdate} taskId={task.id} />
      <DateCell task={task} onUpdate={onUpdate} />
      <AssignCell task={task} members={members} onUpdate={onUpdate} />
      <ActionCell taskId={task.id} onDelete={onDelete} />
    </div>
  );
}
