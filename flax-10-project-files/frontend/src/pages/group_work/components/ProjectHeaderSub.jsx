import { useState } from "react";
import { Trash2, LogOut, Settings } from "lucide-react";
import HoldConfirmModal from "../../../components/common/hold_confirm_modal/HoldConfirmModal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import { useToast } from "../../../context/ToastContext";
import { getCurrentMember } from "../utils/memberAvatarUtils";
import EditProjectModal from "./EditProjectModal";
import styles from "./ProjectHeader.module.css";

function ProjectActionModal({ isLeaving, onConfirm, onCancel }) {
    const title = isLeaving ? "Leave project" : "Delete project";
    const banner = isLeaving ? "You will no longer have access to this project or its tasks." : "This will permanently remove the project and all its tasks for every team member.";
    const text = isLeaving ? "Hold to leave this group project." : "Hold to permanently delete this shared project and its tasks.";
    return (
        <HoldConfirmModal
            title={title}
            warningBanner={banner}
            warningText={text}
            cancelLabel="Cancel"
            holdLabel={isLeaving ? "Hold to leave" : "Hold to delete"}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
}

function SettingsButton({ onClick }) {
    return (
        <PrimaryButton type="button" size="small" variant="secondary" pill onClick={onClick}>
            <Settings size={13} /> Settings
        </PrimaryButton>
    );
}

function DangerActionButton({ isOwner, onClick }) {
    return (
        <PrimaryButton type="button" size="small" variant="danger" pill onClick={onClick}>
            {isOwner ? <Trash2 size={13} /> : <LogOut size={13} />}
            {isOwner ? "Delete project" : "Leave project"}
        </PrimaryButton>
    );
}

function useProjectHeaderActionHandler({ isOwner, onDelete, onMemberRemove, currentMember, onBack, showToast, setShowModal }) {
    return async () => {
        setShowModal(false);
        if (isOwner && await onDelete()) {
            showToast("Project deleted.");
            return;
        }
        if (currentMember && await onMemberRemove(currentMember.id)) {
            showToast("You left the project.");
            onBack?.();
        }
    };
}

export default function ProjectHeaderActions({ project, onDelete, onMemberRemove, isOwner, teamMembers, onBack, onUpdate }) {
    const showToast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const currentMember = getCurrentMember(teamMembers);
    const handleAction = useProjectHeaderActionHandler({ isOwner, onDelete, onMemberRemove, currentMember, onBack, showToast, setShowModal });

    return (
        <div className={styles.headerActions}>
            {isOwner && <SettingsButton onClick={() => setShowEditModal(true)} />}
            <DangerActionButton isOwner={isOwner} onClick={() => setShowModal(true)} />
            {showModal && <ProjectActionModal isLeaving={!isOwner} onConfirm={handleAction} onCancel={() => setShowModal(false)} />}
            {showEditModal && <EditProjectModal project={project} onUpdated={onUpdate} onClose={() => setShowEditModal(false)} />}
        </div>
    );
}
