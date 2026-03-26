/*
 * Society collaborator picker modal.
 */

import { useState } from "react";
import UserSearch from "../Social/UserSearch";
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
}
