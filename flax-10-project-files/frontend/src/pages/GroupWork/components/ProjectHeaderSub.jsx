/*
 * GroupWork project header delete action.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import HoldConfirmModal from "../../../components/common/HoldConfirmModal/HoldConfirmModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { useToast } from "../../../context/ToastContext";
import styles from "./ProjectHeader.module.css";

function DeleteProjectModal({ onDelete, setDeleteError, setShowDeleteModal, showToast }) {
    return (
        <HoldConfirmModal
            title="Delete project"
            warningBanner="This will permanently remove the project and all its tasks for every team member."
            warningText="Hold to permanently delete this shared project and its tasks."
            cancelLabel="Keep project"
            holdLabel="Hold to delete"
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={() => confirmDeleteProject(onDelete, setDeleteError, setShowDeleteModal, showToast)}
        />
    );
}

/** Delete action button and hold-to-confirm modal for a group project. */
export default function ProjectDeleteAction({ onDelete }) {
    const showToast = useToast();
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
            {showDeleteModal && <DeleteProjectModal onDelete={onDelete} setDeleteError={setDeleteError} setShowDeleteModal={setShowDeleteModal} showToast={showToast} />}
        </>
    );
}

function openDeleteModal(setDeleteError, setShowDeleteModal) {
    setDeleteError("");
    setShowDeleteModal(true);
}

async function confirmDeleteProject(onDelete, setDeleteError, setShowDeleteModal, showToast) {
    if (await onDelete()) {
        showToast("Project deleted.");
        setShowDeleteModal(false);
        return;
    }
    setShowDeleteModal(false);
    setDeleteError("Only the project owner can delete this project.");
}
