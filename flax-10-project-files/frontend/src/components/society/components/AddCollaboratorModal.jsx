/*
 * Society collaborator picker modal.
 */

import { useState } from "react";
import UserSearch from "../../social/components/UserSearch";
import Badge from "../../common/badge/Badge";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import SearchEmptyState from "../../common/search_empty_state/SearchEmptyState";
import StandardModal from "../../common/standard_modal/StandardModal";
import styles from "../styles/AddCollaboratorModal.module.css";

function buildExistingSet(existingUsernames) {
  return new Set(existingUsernames.map((username) => username?.toLowerCase()).filter(Boolean));
}

function filterAvailableUsers(users = [], existingSet, selectedIds) {
  return users.filter((user) => !existingSet.has(user.username?.toLowerCase()) && !selectedIds.has(user.id));
}

function addSelectedUser(user, selectedIds, setSelected) {
  if (selectedIds.has(user.id)) return;
  setSelected((current) => [...current, user]);
}

async function confirmCollaborators(selected, onAdd, onClose, setError, setIsSubmitting) {
  if (selected.length === 0) return;
  setIsSubmitting(true);
  setError(null);
  try {
    await onAdd(selected);
    onClose();
  } catch (error) {
    setError(error?.message || "Failed to add collaborator. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
}

function useCollaboratorSelection(existingUsernames, onAdd, onClose) {
  const [selected, setSelected] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const existingSet = buildExistingSet(existingUsernames);
  const selectedIds = new Set(selected.map((user) => user.id));
  return { selected, isSubmitting, error, filterUsers: (users) => filterAvailableUsers(users, existingSet, selectedIds), onSelect: (user) => addSelectedUser(user, selectedIds, setSelected), onRemove: (id) => setSelected((current) => current.filter((user) => user.id !== id)), onConfirm: () => confirmCollaborators(selected, onAdd, onClose, setError, setIsSubmitting) };
}

/** Lets admins search for and add new society collaborators. */
export default function AddCollaboratorModal({ onClose, onAdd, existingUsernames = [] }) {
  const selection = useCollaboratorSelection(existingUsernames, onAdd, onClose);
  return (
    <StandardModal title="Add Collaborators" onClose={onClose} size="sm" modalClassName={styles.modalShell} contentClassName={styles.modalContent}>
      <div className={styles.searchContainer}>
        <CollaboratorSearch filterUsers={selection.filterUsers} onSelect={selection.onSelect} />
        <SelectedUsers onRemove={selection.onRemove} users={selection.selected} />
      </div>
      {selection.error && <p className={styles.error}>{selection.error}</p>}
      <ModalFooter disabled={selection.selected.length === 0 || selection.isSubmitting} isSubmitting={selection.isSubmitting} onCancel={onClose} onConfirm={selection.onConfirm} />
    </StandardModal>
  );
}

function CollaboratorSearch({ filterUsers, onSelect }) {
  return <UserSearch onUserSelect={onSelect} filterUsers={filterUsers} fullWidth hideFilter compact renderEmptyState={renderEmptyState} dropdownMode="inline" />;
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

function ModalFooter({ disabled, isSubmitting, onCancel, onConfirm }) {
  return (
    <div className={styles.footer}>
      <PrimaryButton className={styles.footerBtn} variant="ghost" size="small" pill onClick={onCancel} disabled={isSubmitting}>Cancel</PrimaryButton>
      <PrimaryButton className={styles.footerBtn} size="small" pill onClick={onConfirm} disabled={disabled}>{isSubmitting ? "Adding..." : "Add"}</PrimaryButton>
    </div>
  );
}
