import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";
import AddCollaboratorModal from "../AddCollaboratorModal";

const ROLES = [
    { value: "editor", label: "Editor" },
    { value: "admin", label: "Admin" }
];

export default function SettingsModal({ onClose, onDelete, members, onFetchMembers, onUpdateRole, onRemoveMember, onAddCollaborator }) {
    const [showAddModal, setShowAddModal] = useState(false);
    useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);

    const handleAddCollaborators = async (users, role) => {
        for (const user of users) await onAddCollaborator?.(user.username, role);
    };

    const existingUsernames = (members || []).map(m => m.username);

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <AddCollaboratorSection onOpenModal={() => setShowAddModal(true)} />
                <CollaboratorsSection members={members} onUpdateRole={onUpdateRole} onRemove={onRemoveMember} />
                <DangerSection onDelete={onDelete} onClose={onClose} />
            </div>
            {showAddModal && <AddCollaboratorModal onClose={() => setShowAddModal(false)}
                onAdd={handleAddCollaborators} existingUsernames={existingUsernames} />}
        </div>
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

function CollaboratorsSection({ members, onUpdateRole, onRemove }) {
    const collaborators = (members || []).filter(m => m.role !== 'member');
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Collaborators</h4>
            <MemberList members={collaborators} onUpdateRole={onUpdateRole} onRemove={onRemove} />
        </div>
    );
}

function MemberList({ members, onUpdateRole, onRemove }) {
    if (!members || members.length === 0) return <p className={styles.empty}>No collaborators yet.</p>;
    return (
        <div className={styles.memberList}>
            {members.map(m => <MemberRow key={m.id} member={m} onUpdateRole={onUpdateRole} onRemove={onRemove} />)}
        </div>
    );
}

function MemberRow({ member, onUpdateRole, onRemove }) {
    return (
        <div className={styles.memberRow}>
            <span className={styles.memberName}>{member.username}</span>
            <RoleSelect value={member.role} onChange={(role) => onUpdateRole?.(member.user, role)} />
            <button className={styles.removeBtn} onClick={() => onRemove?.(member.user)} title="Remove">&times;</button>
        </div>
    );
}

function RoleSelect({ value, onChange }) {
    return (
        <select className={styles.roleSelect} value={value} onChange={(e) => onChange(e.target.value)}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
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
