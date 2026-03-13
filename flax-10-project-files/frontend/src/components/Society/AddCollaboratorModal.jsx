import { useState } from "react";
import Badge from "../common/Badge/Badge";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import StandardModal from "../common/StandardModal/StandardModal";
import UserSearch from "../Social/UserSearch";
import styles from "./AddCollaboratorModal.module.css";

export default function AddCollaboratorModal({ onClose, onAdd, existingUsernames = [] }) {
    const [selected, setSelected] = useState([]);
    const handleSelect = (user) => {
        if (!selected.find(u => u.id === user.id)) setSelected([...selected, user]);
    };
    const handleRemove = (uid) => setSelected(selected.filter(u => u.id !== uid));
    const handleAdd = () => { onAdd(selected); onClose(); };
    const filterUsers = (res) => {
        if (!Array.isArray(res)) return [];
        const selIds = new Set(selected.map(u => u.id));
        return res.filter(u => !existingUsernames.includes(u.username) && !selIds.has(u.id));
    };
    return (
        <StandardModal title="Add Collaborators" onClose={onClose} size="sm" modalClassName={styles.modalShell} contentClassName={styles.modalContent}>
            <div className={styles.searchContainer}>
                <UserSearch onUserSelect={handleSelect} filterUsers={filterUsers} fullWidth hideFilter compact />
                <SelectedUsers users={selected} onRemove={handleRemove} />
            </div>
            <ModalFooter onC={onClose} onA={handleAdd} dis={selected.length === 0} />
        </StandardModal>
    );
}

function SelectedUsers({ users, onRemove }) {
    if (users.length === 0) return null;
    return (
        <div className={styles.selected}>
            {users.map(u => <UserChip key={u.id} user={u} onRemove={onRemove} />)}
        </div>
    );
}

function UserChip({ user, onRemove }) {
    return (
        <Badge className={styles.chip} tone="muted">
            {user.username}
            <PrimaryButton className={styles.chipRemove} variant="ghost" size="small" pill onClick={() => onRemove(user.id)} aria-label={`Remove ${user.username}`}>×</PrimaryButton>
        </Badge>
    );
}

function ModalFooter({ onC, onA, dis }) {
    return (
        <div className={styles.footer}>
            <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onC}>Cancel</PrimaryButton>
            <PrimaryButton className={styles.addBtn} pill onClick={onA} disabled={dis}>Add</PrimaryButton>
        </div>
    );
}
