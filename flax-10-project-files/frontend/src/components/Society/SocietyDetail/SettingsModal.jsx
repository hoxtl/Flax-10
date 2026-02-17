import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../AddCollaboratorModal";
import CollaboratorList from "../CollaboratorList";

async function addOrPromoteCollaborator(user, members, onUpdateRole, onAddCollaborator) {
    const existingMember = (members || []).find(m => m.username === user.username);
    if (existingMember) return onUpdateRole?.(existingMember.user, "editor");
    return onAddCollaborator?.(user.username, "editor");
}

export default function SettingsModal({ onClose, onDelete, members, onFetchMembers, onUpdateRole, onRemoveMember, onAddCollaborator }) {
    const [showAddModal, setShowAddModal] = useState(false);
    useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);

    const handleAddCollaborators = async (users) => {
        for (const user of users) await addOrPromoteCollaborator(user, members, onUpdateRole, onAddCollaborator);
        onFetchMembers?.();
    };

    const collaborators = (members || []).filter(m => m.role !== 'member');
    const collaboratorUsernames = collaborators.map(c => c.username);

    return (
        <>
            <div className={styles.backdrop} onMouseDown={onClose}>
                <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                    <ModalHeader onClose={onClose} />
                    <AddCollaboratorSection onOpenModal={() => setShowAddModal(true)} />
                    <CollaboratorsSection collaborators={collaborators} onUpdateRole={onUpdateRole} onRemove={onRemoveMember} />
                    <DangerSection onDelete={onDelete} onClose={onClose} />
                </div>
            </div>
            {showAddModal && <AddCollaboratorModal onClose={() => setShowAddModal(false)}
                onAdd={handleAddCollaborators} existingUsernames={collaboratorUsernames} />}
        </>
    );
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>Society Settings</h3>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
    );
}

function AddCollaboratorSection({ onOpenModal }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Add Collaborator</h4>
            <button className={styles.addBtn} onClick={onOpenModal}>+ Add Collaborators</button>
        </div>
    );
}

function CollaboratorsSection({ collaborators, onUpdateRole, onRemove }) {
    const handleRoleChange = (userId, role) => onUpdateRole?.(userId, role);
    const handleRemove = (userId) => onRemove?.(userId);
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Collaborators</h4>
            <CollaboratorList collaborators={collaborators} onRoleChange={handleRoleChange} onRemove={handleRemove} />
        </div>
    );
}

function DangerSection({ onDelete, onClose }) {
    const [confirming, setConfirming] = useState(false);
    if (confirming) return <DeleteConfirm onConfirm={onDelete} onCancel={() => setConfirming(false)} onClose={onClose} />;
    return (
        <div className={styles.dangerSection}>
            <h4 className={styles.sectionTitle}>Danger Zone</h4>
            <button className={styles.deleteBtn} onClick={() => setConfirming(true)}>Delete Society</button>
        </div>
    );
}

function DeleteConfirm({ onConfirm, onCancel, onClose }) {
    const handleDelete = () => { onConfirm?.(); onClose?.(); };
    return (
        <div className={styles.dangerSection}>
            <h4 className={styles.sectionTitle}>Danger Zone</h4>
            <p className={styles.confirmText}>Are you sure? This cannot be undone.</p>
            <div className={styles.confirmBtns}>
                <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
            </div>
        </div>
    );
}
