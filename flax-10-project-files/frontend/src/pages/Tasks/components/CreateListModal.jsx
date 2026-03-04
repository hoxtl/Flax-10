import { useState } from "react";
import styles from "./CreateListModal.module.css";

export default function CreateListModal({ onSave, onClose }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name?.trim();
    if (!trimmed) return;
    onSave?.({ name: trimmed });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>New list</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Name</label>
            <input
              type="text"
              className={styles.nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Personal"
              autoFocus
            />
          </div>
        </form>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSubmit}
            disabled={!name?.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
