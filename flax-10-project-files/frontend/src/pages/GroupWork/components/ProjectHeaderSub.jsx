/*
 * GroupWork project header actions and title.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import BackButton from "../../../components/common/BackButton/BackButton.jsx";
import { useConfirm } from "../../../context/ConfirmContext";
import styles from "./ProjectHeader.module.css";

export default function ProjectHeaderActions({ onBack, onDelete }) {
  const confirm = useConfirm();
  const [deleteError, setDeleteError] = useState("");
  const handleClick = () => handleDeleteClick(confirm, onDelete, setDeleteError);
  return (
    <>
      <div className={styles.topActions}>
        <BackButton onClick={onBack} label="Back to All Projects" />
        <button className={styles.deleteBtn} onClick={handleClick}>
          <Trash2 size={14} />
          Delete project
        </button>
      </div>
      {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
    </>
  );
}

async function handleDeleteClick(confirm, onDelete, setDeleteError) {
  setDeleteError("");
  if (!await confirmDeleteProject(confirm)) return;
  if (await onDelete()) return;
  setDeleteError("Only the project owner can delete this project.");
}

async function confirmDeleteProject(confirm) {
  return confirm({
    title: "Delete Project",
    message: "Delete this project permanently? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Keep Project",
    isDanger: true,
    dangerTitle: "Delete This Project",
    dangerDescription: "This will permanently remove the project and all of its group work data.",
    dangerHint: "This removes the project and returns you to all group projects.",
  });
}

export function ProjectHeaderTitle({ name, onPatch }) {
  const onBlur = (event) => saveTitle(event, name, onPatch);
  return <input defaultValue={name} onBlur={onBlur} className={styles.nameInput} placeholder="Project Name" />;
}

function saveTitle(event, name, onPatch) {
  const value = event.target.value.trim();
  if (value && value !== name) onPatch({ name: value });
}
