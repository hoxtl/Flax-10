/*
 * Modal for adding a new group task with title, due date, and assignees.
 */

import { useState } from "react";
import DateTimePicker from "../../../components/Common/inputs/DateTimePicker";
import PrimaryButton from "../../../components/Common/PrimaryButton/PrimaryButton";
import StandardModal from "../../../components/Common/StandardModal/StandardModal";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "./memberAvatarUtils";
import styles from "./AddTaskModal.module.css";

function MemberCheckItem({ checked, member, onToggle }) {
    return (
        <div className={styles.memberItem} onClick={() => onToggle(member.user)}>
            <input type="checkbox" checked={checked} onChange={() => onToggle(member.user)} className={styles.checkbox} onClick={(event) => event.stopPropagation()} />
            <MemberAvatar member={member} size={24} />
            <span className={styles.memberLabel}>{getDisplayName(member)}</span>
        </div>
    );
}

function TaskTitleField({ setTitle, title }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Task title</label>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" className={styles.input} required />
        </div>
    );
}

function TaskDueDateField({ dueDate, setDueDate }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Due date</label>
            <DateTimePicker dateOnly value={dueDate} onChange={setDueDate} placeholder="Pick a due date" triggerClassName={styles.input} />
        </div>
    );
}

function AddTaskFields({ dueDate, setDueDate, setTitle, title }) {
    return (
        <div className={styles.twoColRow}>
            <TaskTitleField title={title} setTitle={setTitle} />
            <TaskDueDateField dueDate={dueDate} setDueDate={setDueDate} />
        </div>
    );
}

function AddTaskMemberSection({ assignees, members, onToggle }) {
    if (!members.length) return null;
    return (
        <div className={styles.field}>
            <label className={styles.label}>Assign to</label>
            <div className={styles.memberList}>{members.map((member) => <MemberCheckItem key={member.user ?? member.id} member={member} checked={assignees.includes(member.user)} onToggle={onToggle} />)}</div>
        </div>
    );
}

function AddTaskActions({ disabled, onClose }) {
    return (
        <div className={styles.actions}>
            <PrimaryButton type="button" variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
            <PrimaryButton type="submit" pill disabled={disabled}>Add task</PrimaryButton>
        </div>
    );
}

function useAddTaskState() {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignees, setAssignees] = useState([]);
    const toggleAssignee = (userId) =>
        setAssignees((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    return { assignees, dueDate, setDueDate, setTitle, title, toggleAssignee };
}

export default function AddTaskModal({ members = [], onAdd, onClose }) {
    const state = useAddTaskState();
    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmed = state.title.trim();
        if (!trimmed || !state.dueDate) return;
        await onAdd({ title: trimmed, due_date: state.dueDate, assigned_to: state.assignees });
        onClose();
    };

    return (
        <StandardModal title="Add new task" onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className={styles.form}>
                <AddTaskFields dueDate={state.dueDate} setDueDate={state.setDueDate} setTitle={state.setTitle} title={state.title} />
                <AddTaskMemberSection assignees={state.assignees} members={members} onToggle={state.toggleAssignee} />
                <AddTaskActions disabled={!state.title.trim() || !state.dueDate} onClose={onClose} />
            </form>
        </StandardModal>
    );
}
