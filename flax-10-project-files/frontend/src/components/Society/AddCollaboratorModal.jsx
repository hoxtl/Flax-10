/*
 * AddCollaboratorModal lets society admins add collaborators to a society.
 */
import { useState } from "react";
import Badge from "../Common/Badge/Badge";
import PrimaryButton from "../Common/PrimaryButton/PrimaryButton";
import SearchEmptyState from "../Common/SearchEmptyState/SearchEmptyState";
import StandardModal from "../Common/StandardModal/StandardModal";
import UserSearch from "../Social/UserSearch";
import styles from "./AddCollaboratorModal.module.css";

const useCollabState = (onAdd, onClose, existing) => {
    const [selected, setSelected] = useState([]);
    const handleAdd = () => { onAdd(selected); onClose(); };
    const filter = (res) => {
        if (!Array.isArray(res)) return [];
        const selIds = new Set(selected.map(u => u.id));
        return res.filter(u => !existing.includes(u.username) && !selIds.has(u.id));
    };
    return { selected, handleAdd, filter, 
             onSelect: (u) => !selected.find(x => x.id === u.id) && setSelected([...selected, u]),
             onRemove: (id) => setSelected(selected.filter(x => x.id !== id)) };
};

export default function AddCollaboratorModal({ onClose, onAdd, existingUsernames = [] }) {
    const { selected, handleAdd, filter, onSelect, onRemove } = useCollabState(onAdd, onClose, existingUsernames);
    const renderEmptyState = ({ query, clear }) => (
        <div className={styles.dropdownEmptyState}>
            <SearchEmptyState
                query={query}
                itemLabel="users"
                title="No users found"
                hint="Try a different name or filter."
                onClear={clear}
            />
        </div>
    );

    return (
        <StandardModal title="Add Collaborators" onClose={onClose} size="sm" modalClassName={styles.modalShell}
            contentClassName={styles.modalContent}>
            <div className={styles.searchContainer}>
                <UserSearch
                    onUserSelect={onSelect}
                    filterUsers={filter}
                    fullWidth
                    hideFilter
                    compact
                    renderEmptyState={renderEmptyState}
                />
                <SelectedUsers users={selected} onRemove={onRemove} />
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
            <PrimaryButton className={styles.footerBtn} variant="ghost" size="small" pill onClick={onC}>Cancel</PrimaryButton>
            <PrimaryButton className={styles.footerBtn} size="small" pill onClick={onA} disabled={dis}>Add</PrimaryButton>
        </div>
    );
}
