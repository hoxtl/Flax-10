/*
 * GroupWork project header actions.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import HoldConfirmModal from "../../../components/Common/HoldConfirmModal/HoldConfirmModal";
import PrimaryButton from "../../../components/Common/PrimaryButton/PrimaryButton";
import styles from "./ProjectHeader.module.css";

function openDeleteModal(setDeleteError, setShowDeleteModal) {
  setDeleteError("");
  setShowDeleteModal(true);
}

async function confirmDeleteProject(onDelete, setDeleteError, setShowDeleteModal) {
  setShowDeleteModal(false);
  if (await onDelete()) return;
  setDeleteError("Only the project owner can delete this project.");
}

function DeleteModal({ onDelete, setDeleteError, setShowDeleteModal }) {
  return (
    <HoldConfirmModal
      title="Delete project"
      warningBanner="This will permanently remove the project and all its tasks for every team member."
      warningText="Hold to permanently delete this shared project and its tasks."
      cancelLabel="Keep project"
      holdLabel="Hold to delete"
      onCancel={() => setShowDeleteModal(false)}
      onConfirm={() => confirmDeleteProject(onDelete, setDeleteError, setShowDeleteModal)}
    />
  );
}

export default function ProjectDeleteAction({ onDelete }) {
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  return (
    <>
      <div className={styles.deleteActionWrap}>
        <PrimaryButton type="button" size="small" variant="ghost" pill className={styles.deleteBtn} onClick={() => openDeleteModal(setDeleteError, setShowDeleteModal)}>
          <Trash2 size={14} />
          Delete project
        </PrimaryButton>
        {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
      </div>
      {showDeleteModal && <DeleteModal onDelete={onDelete} setDeleteError={setDeleteError} setShowDeleteModal={setShowDeleteModal} />}
    </>
  );
}
