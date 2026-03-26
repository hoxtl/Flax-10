/*
 * GroupWork project header delete action.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import HoldConfirmModal from "../../../components/common/hold_confirm_modal/HoldConfirmModal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
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

function DeleteButton({ isOwner, onClick }) {
    return (
        <PrimaryButton type="button" size="small" variant="danger" pill className={!isOwner ? styles.deleteBtnDisabled : undefined} onClick={isOwner ? onClick : undefined} disabled={!isOwner} aria-disabled={!isOwner}>
            <Trash2 size={14} />Delete project
        </PrimaryButton>
    );
}

function DeleteButtonWithTooltip({ isOwner, onClick }) {
    const btn = <DeleteButton isOwner={isOwner} onClick={onClick} />;
    if (isOwner) return btn;
    return <Tooltip content="Only project owner can delete" position="bottom"><span className={styles.deleteBtnTooltipWrap}>{btn}</span></Tooltip>;
}

export default function ProjectDeleteAction({ onDelete, isOwner }) {
    const showToast = useToast();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    return (
        <>
            <DeleteButtonWithTooltip isOwner={isOwner} onClick={() => setShowDeleteModal(true)} />
            {showDeleteModal && <DeleteProjectModal onDelete={onDelete} setDeleteError={() => {}} setShowDeleteModal={setShowDeleteModal} showToast={showToast} />}
        </>
    );
}

async function confirmDeleteProject(onDelete, setDeleteError, setShowDeleteModal, showToast) {
    setShowDeleteModal(false);
    if (await onDelete()) showToast("Project deleted.");
}
