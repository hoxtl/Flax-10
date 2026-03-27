/*
 * Tag list display for the manager modal.
 */

import { Pencil, Trash2 } from "lucide-react";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import styles from "../styles/TagManagerModal.module.css";
import { isProtectedTag } from "./tagManagerUtils";

export default function TagList({ modal }) {
  return (
    <div className={styles.content}>
      <div className={styles.list}>
        {modal.tags.map((tag) => <TagListItem key={tag.id} onDelete={modal.onDelete} onEdit={modal.setEditingId} tag={tag} />)}
      </div>
      <PrimaryButton className={styles.addTagButton} onClick={() => modal.setIsAdding(true)} pill variant="primary">
        + Add New Tag
      </PrimaryButton>
    </div>
  );
}

function TagListItem({ onDelete, onEdit, tag }) {
  const protectedTag = isProtectedTag(tag.label);

  return (
    <div className={styles.item}>
      <TagPreview tag={tag} />
      <TagActions id={tag.id} isProtected={protectedTag} onDelete={onDelete} onEdit={onEdit} />
    </div>
  );
}

function TagPreview({ tag }) {
  return (
    <div className={styles.preview} style={{ "--color": tag.color }}>
      <span className={styles.colorDot} style={{ backgroundColor: tag.color }} />
      <span>{tag.label}</span>
    </div>
  );
}

function TagActions({ id, isProtected, onDelete, onEdit }) {
  return (
    <div className={styles.actions}>
      <IconActionButton ariaLabel="Edit tag" onClick={() => onEdit(id)} title="Edit tag">
        <Pencil size={14} strokeWidth={2} />
      </IconActionButton>
      <DeleteActionButton id={id} isProtected={isProtected} onDelete={onDelete} />
    </div>
  );
}

function DeleteActionButton({ id, isProtected, onDelete }) {
  const className = `${styles.delete} ${isProtected ? styles.deleteDisabled : ""}`.trim();
  const title = isProtected ? "Default tags cannot be deleted" : "Delete tag";

  return (
    <IconActionButton
      ariaLabel="Delete tag"
      className={className}
      disabled={isProtected}
      onClick={() => onDelete(id)}
      title={title}
    >
      <Trash2 size={14} strokeWidth={2} />
    </IconActionButton>
  );
}

function IconActionButton({ ariaLabel, children, className, disabled = false, onClick, title }) {
  return (
    <button aria-label={ariaLabel} className={className} disabled={disabled} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
}
