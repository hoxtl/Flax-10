import { useState } from "react";
import styles from "./CreateListModal.module.css";

/** ~20 nice colours for list colour picker */
const LIST_COLOURS = [
  "#8C9A86", "#4A90D9", "#B45309", "#15803d", "#7e22ce", "#0e7490",
  "#be123c", "#4338ca", "#047857", "#b91c1c", "#1d4ed8", "#65a30d",
  "#c2410c", "#4f46e5", "#0d9488", "#a16207", "#dc2626", "#2563eb",
  "#16a34a", "#9333ea",
];

export default function CreateListModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LIST_COLOURS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name?.trim();
    if (!trimmed) return;
    onSave?.({ name: trimmed, color: color || undefined });
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
              placeholder="e.g. Work, Personal, Reading list"
              autoFocus
            />
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Colour</label>
            <div className={styles.colorGrid} role="group" aria-label="List colour">
              {LIST_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorSwatch} ${color === c ? styles.colorSwatchActive : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>
          {color && (
            <div className={styles.preview} style={{ "--list-color": color }}>
              <span className={styles.previewDot} style={{ background: color }} />
              <span className={styles.previewName}>{name.trim() || "New list"}</span>
            </div>
          )}
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
