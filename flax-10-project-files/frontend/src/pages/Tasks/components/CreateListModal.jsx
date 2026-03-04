import { useState } from "react";
import styles from "./CreateListModal.module.css";

/** Warm palette colours for list colour picker (no bright orange/red/green) */
const LIST_COLOURS = [
  "#9C8B7A", "#8B9D7B", "#A68B5B", "#8B7D9C", "#7B8F8B", "#C4A265",
  "#8B6F47", "#C17C5E", "#5C6B4F", "#6B5344", "#9E7E5D", "#7A6B5C",
  "#5a7a6a", "#8C7B6B", "#B8936D", "#6d6050", "#3d5a52", "#D4B87A",
  "#8B9D7B", "#A68B5B",
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
