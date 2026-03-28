import { useState } from "react";

export function normaliseAssigneeId(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";
    return /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

export function hasAssignee(assignees, member) {
    const memberId = String(member?.user ?? member?.id ?? "");
    return assignees.some((assignee) => String(assignee) === memberId);
}

export function toggleAssigneeIds(previous, userId) {
    const nextUserId = normaliseAssigneeId(userId);
    const hasMatch = previous.some((id) => String(id) === String(nextUserId));
    if (hasMatch) return previous.filter((id) => String(id) !== String(nextUserId));
    return [...previous, nextUserId];
}

async function submitTask(title, dueDate, assignees, onAdd, onClose) {
    const trimmed = title.trim();
    if (!trimmed) return;
    await onAdd({ title: trimmed, due_date: dueDate || null, assigned_to: assignees.filter((assignee) => assignee !== "") });
    onClose();
}

export function useAddTaskFormState() {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignees, setAssignees] = useState([]);
    const toggleAssignee = (userId) => setAssignees((previous) => toggleAssigneeIds(previous, userId));
    return { assignees, dueDate, setDueDate, setTitle, title, toggleAssignee };
}

export function handleTaskSubmit(event, title, dueDate, assignees, onAdd, onClose) {
    event.preventDefault();
    submitTask(title, dueDate, assignees, onAdd, onClose);
}
