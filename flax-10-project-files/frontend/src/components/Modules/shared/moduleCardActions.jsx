/*
 * Shared teacher actions and delete confirmation for module cards.
 */

import ConfirmModal from "../../common/ConfirmModal/ConfirmModal";

export function ModuleItemCardActions({ onEdit, onDelete, styles }) {
  return (
    <div className={styles.cardActions}>
      <button className={styles.editButton} onClick={onEdit}>Edit</button>
      <button className={styles.deleteButton} onClick={onDelete}>Delete</button>
    </div>
  );
}

export function ModuleItemDeleteDialog({ itemTitle, itemType, onConfirm, onCancel }) {
  return (
    <ConfirmModal
      title={`Delete ${itemType}`}
      message={`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmText="Delete"
      isDanger={true}
    />
  );
}
