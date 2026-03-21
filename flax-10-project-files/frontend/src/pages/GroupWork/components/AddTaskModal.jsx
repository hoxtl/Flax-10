/*
 * Modal for adding a new group task with title, due date, and assignees.
 */

import { useState } from "react";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "./memberAvatarUtils";
import styles from "./AddTaskModal.module.css";

function MemberCheckItem({ member, checked, onToggle }) {
  return (
    <div className={styles.memberItem} onClick={() => onToggle(member.user)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(member.user)}
        className={styles.checkbox}
        onClick={(e) => e.stopPropagation()}
      />
      <MemberAvatar member={member} size={24} />
      <span className={styles.memberLabel}>{getDisplayName(member)}</span>
    </div>
  );
}

export default function AddTaskModal({ members = [], onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState([]);

  function toggleAssignee(userId) {
    setAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !dueDate) return;
    await onAdd({ title: trimmed, due_date: dueDate, assigned_to: assignees });
    onClose();
  }

  return (
    <StandardModal title="Add new task" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.twoColRow}>
          <div className={styles.field}>
            <label className={styles.label}>Task title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.input}
              required
            />
          </div>
        </div>

        {members.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Assign to</label>
            <div className={styles.memberList}>
              {members.map((m) => (
                <MemberCheckItem
                  key={m.user ?? m.id}
                  member={m}
                  checked={assignees.includes(m.user)}
                  onToggle={toggleAssignee}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <PrimaryButton type="button" variant="ghost" pill onClick={onClose}>
            Cancel
          </PrimaryButton>
          <PrimaryButton type="submit" pill disabled={!title.trim() || !dueDate}>
            Add task
          </PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}
