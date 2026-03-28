/*
 * Modal for adding a new group task with title, due date, and assignees.
 */

import { useState } from "react";
import StandardModal from "../../../components/common/standard_modal/StandardModal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import SelectableMemberRow from "./SelectableMemberRow";
import styles from "./AddTaskModal.module.css";

function normaliseAssigneeId(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";
    return /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

function hasAssignee(assignees, member) {
    const memberId = String(member?.user ?? member?.id ?? "");
    return assignees.some((assignee) => String(assignee) === memberId);
}

function toggleAssigneeIds(previous, userId) {
    const nextUserId = normaliseAssigneeId(userId);
    const hasMatch = previous.some((id) => String(id) === String(nextUserId));
    if (hasMatch) return previous.filter((id) => String(id) !== String(nextUserId));
    return [...previous, nextUserId];
}

function MemberCheckItem({ member, checked, onToggle }) {
    return (
    <SelectableMemberRow
      member={member}
      checked={checked}
      onToggle={onToggle}
      inputIdPrefix="task-assignee"
      classNames={{ row: styles.memberItem, checkbox: styles.checkbox, label: styles.memberLabel }}
      avatarSize={24}
    />
  );
}

function TaskTwoColFields({ title, setTitle, dueDate, setDueDate }) {
    return (
        <div className={styles.twoColRow}>
            <div className={styles.field}>
                <label className={styles.label}>Task title</label>
                <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className={styles.input} required />
            </div>
            <div className={styles.field}>
                <label className={styles.label}>Due date</label>
                <DateTimePicker dateOnly value={dueDate} onChange={setDueDate} placeholder="Pick a due date" triggerClassName={styles.input} />
            </div>
        </div>
    );
}

function TaskAssigneesField({ members, assignees, onToggle }) {
    if (!members.length) return null;
    return (
        <div className={styles.field}>
            <label className={styles.label}>Assign to</label>
            <div className={styles.memberList}>
                {members.map((member) => (
                    <MemberCheckItem
                        key={member.user ?? member.id}
                        member={member}
                        checked={hasAssignee(assignees, member)}
                        onToggle={onToggle}
                    />
                ))}
            </div>
        </div>
    );
}

function TaskFormActions({ title, onClose }) {
    return (
        <div className={styles.actions}>
            <PrimaryButton type="button" variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
            <PrimaryButton type="submit" pill disabled={!title.trim()}>Add task</PrimaryButton>
        </div>
    );
}

async function submitTask(title, dueDate, assignees, onAdd, onClose) {
    const trimmed = title.trim();
    if (!trimmed) return;
    await onAdd({ title: trimmed, due_date: dueDate || null, assigned_to: assignees.filter((assignee) => assignee !== "") });
    onClose();
}

function useAddTaskFormState() {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignees, setAssignees] = useState([]);
    const toggleAssignee = (userId) => setAssignees((previous) => toggleAssigneeIds(previous, userId));
    return { assignees, dueDate, setDueDate, setTitle, title, toggleAssignee };
}

function handleTaskSubmit(event, title, dueDate, assignees, onAdd, onClose) {
    event.preventDefault();
    submitTask(title, dueDate, assignees, onAdd, onClose);
}

/*
 * Renders the add-task modal for group work projects.
 */
export default function AddTaskModal({ members = [], onAdd, onClose }) {
    const { assignees, dueDate, setDueDate, setTitle, title, toggleAssignee } = useAddTaskFormState();
    const onSubmit = (event) => handleTaskSubmit(event, title, dueDate, assignees, onAdd, onClose);
    return (
        <StandardModal title="Add new task" onClose={onClose} size="md">
            <form onSubmit={onSubmit} className={styles.form}>
                <TaskTwoColFields title={title} setTitle={setTitle} dueDate={dueDate} setDueDate={setDueDate} />
                <TaskAssigneesField members={members} assignees={assignees} onToggle={toggleAssignee} />
                <TaskFormActions title={title} onClose={onClose} />
            </form>
        </StandardModal>
    );
}
