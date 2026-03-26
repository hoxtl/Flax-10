/*
<<<<<<< HEAD
 * Society collaborator picker modal.
 */

import { useState } from "react";
import UserSearch from "../social/UserSearch";
import Badge from "../common/Badge/Badge";
import PrimaryButton from "../common/primary_button/PrimaryButton";
import SearchEmptyState from "../common/search_empty_state/SearchEmptyState";
import StandardModal from "../common/standard_modal/StandardModal";
import styles from "./AddCollaboratorModal.module.css";

function useCollaboratorSelection(existingUsernames, onAdd, onClose) {
  const [selected, setSelected] = useState([]);
  const selectedIds = new Set(selected.map((user) => user.id));
  const filterUsers = (users = []) => users.filter((user) => !existingUsernames.includes(user.username) && !selectedIds.has(user.id));
  const onSelect = (user) => !selectedIds.has(user.id) && setSelected((current) => [...current, user]);
  const onRemove = (id) => setSelected((current) => current.filter((user) => user.id !== id));
  const onConfirm = () => { onAdd(selected); onClose(); };
  return { onConfirm, onRemove, onSelect, selected, filterUsers };
}

export default function AddCollaboratorModal({ onClose, onAdd, existingUsernames = [] }) {
  const selection = useCollaboratorSelection(existingUsernames, onAdd, onClose);
  return (
    <StandardModal title="Add Collaborators" onClose={onClose} size="sm" modalClassName={styles.modalShell} contentClassName={styles.modalContent}>
      <div className={styles.searchContainer}>
        <CollaboratorSearch filterUsers={selection.filterUsers} onSelect={selection.onSelect} />
        <SelectedUsers onRemove={selection.onRemove} users={selection.selected} />
      </div>
      <ModalFooter disabled={selection.selected.length === 0} onCancel={onClose} onConfirm={selection.onConfirm} />
    </StandardModal>
  );
}

function CollaboratorSearch({ filterUsers, onSelect }) {
  return (
    <UserSearch onUserSelect={onSelect} filterUsers={filterUsers} fullWidth hideFilter compact renderEmptyState={renderEmptyState} />
  );
}

function renderEmptyState({ clear, query }) {
  return (
    <div className={styles.dropdownEmptyState}>
      <SearchEmptyState query={query} itemLabel="users" title="No users found" hint="Try a different name or filter." onClear={clear} />
    </div>
  );
}

function SelectedUsers({ users, onRemove }) {
  if (users.length === 0) return null;
  return <div className={styles.selected}>{users.map((user) => <UserChip key={user.id} onRemove={onRemove} user={user} />)}</div>;
}

function UserChip({ user, onRemove }) {
  return (
    <Badge className={styles.chip} tone="muted">
      {user.username}
      <PrimaryButton className={styles.chipRemove} variant="ghost" size="small" pill onClick={() => onRemove(user.id)} aria-label={`Remove ${user.username}`}>×</PrimaryButton>
    </Badge>
  );
}

function ModalFooter({ disabled, onCancel, onConfirm }) {
  return (
    <div className={styles.footer}>
      <PrimaryButton className={styles.footerBtn} variant="ghost" size="small" pill onClick={onCancel}>Cancel</PrimaryButton>
      <PrimaryButton className={styles.footerBtn} size="small" pill onClick={onConfirm} disabled={disabled}>Add</PrimaryButton>
    </div>
  );
=======
 * AddCollaboratorModal lets society admins add collaborators to a society.
 */
import { useState } from "react";
import Badge from "../common/Badge/Badge";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import SearchEmptyState from "../common/SearchEmptyState/SearchEmptyState";
import StandardModal from "../common/StandardModal/StandardModal";
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
