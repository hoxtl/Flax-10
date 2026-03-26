import { useState } from "react";
import { Trash2, LogOut } from "lucide-react";
import HoldConfirmModal from "../../../components/common/hold_confirm_modal/HoldConfirmModal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import { useToast } from "../../../context/ToastContext";
import { getCurrentMember } from "../utils/memberAvatarUtils";
import styles from "./ProjectHeader.module.css";

function ProjectActionModal({ isLeaving, onConfirm, onCancel }) {
    const title = isLeaving ? "Leave project" : "Delete project";
    const banner = isLeaving ? "You will no longer have access to this project or its tasks." : "This will permanently remove the project and all its tasks for every team member.";
    const text = isLeaving ? "Hold to leave this group project." : "Hold to permanently delete this shared project and its tasks.";
    return (
        <HoldConfirmModal title={title} warningBanner={banner} warningText={text} cancelLabel="Cancel" holdLabel={isLeaving ? "Hold to leave" : "Hold to delete"} onCancel={onCancel} onConfirm={onConfirm} />
    );
}

export default function ProjectHeaderActions({ onDelete, onMemberRemove, isOwner, teamMembers, onBack }) {
    const showToast = useToast();
    const [showModal, setShowModal] = useState(false);
    const currentMember = getCurrentMember(teamMembers);
    const handleAction = async () => {
        setShowModal(false);
        if (isOwner) {
            if (await onDelete()) showToast("Project deleted.");
        } else if (currentMember) {
            const success = await onMemberRemove(currentMember.id);
            if (success) {
                showToast("You left the project.");
                onBack?.();
            }
        }
    };
    return (
        <>
            <PrimaryButton type="button" size="small" variant="danger" pill onClick={() => setShowModal(true)}>
                {isOwner ? <Trash2 size={13} /> : <LogOut size={13} />}
                {isOwner ? "Delete project" : "Leave project"}
            </PrimaryButton>
            {showModal && <ProjectActionModal isLeaving={!isOwner} onConfirm={handleAction} onCancel={() => setShowModal(false)} />}
        </>
    );
}
