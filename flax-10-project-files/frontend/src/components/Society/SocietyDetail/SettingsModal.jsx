import { useState, useEffect } from "react";
import styles from "./SettingsModal.module.css";

const ROLES = [
    { value: "member", label: "Member" },
    { value: "committee", label: "Committee" },
    { value: "admin", label: "Admin" }
];

export default function SettingsModal({ onClose, onDelete, members, onFetchMembers, onUpdateRole, onRemoveMember }) {
    useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <CollaboratorsSection members={members} onUpdateRole={onUpdateRole} onRemove={onRemoveMember} />
                <DangerSection onDelete={onDelete} onClose={onClose} />
            </div>
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

function CollaboratorsSection({ members, onUpdateRole, onRemove }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Collaborators</h4>
            <MemberList members={members} onUpdateRole={onUpdateRole} onRemove={onRemove} />
        </div>
    );
}

function MemberList({ members, onUpdateRole, onRemove }) {
    if (!members || members.length === 0) return <p className={styles.empty}>No members yet.</p>;
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
    return (
        <div className={styles.dangerSection}>
            <h4 className={styles.sectionTitle}>Danger Zone</h4>
            {confirming ? <DeleteConfirm onConfirm={onDelete} onCancel={() => setConfirming(false)} onClose={onClose} />
                : <button className={styles.deleteBtn} onClick={() => setConfirming(true)}>Delete Society</button>}
        </div>
    );
}

function DeleteConfirm({ onConfirm, onCancel, onClose }) {
    const handleDelete = () => { onConfirm?.(); onClose?.(); };
    return (
        <div className={styles.confirmBox}>
            <p>Are you sure? This cannot be undone.</p>
            <div className={styles.confirmBtns}>
                <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
            </div>
        </div>
    );
}
