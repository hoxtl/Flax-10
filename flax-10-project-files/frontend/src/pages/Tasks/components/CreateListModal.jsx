import { useState } from "react";
import styles from "./CreateListModal.module.css";
import { FOCUS_BLOCK_PALETTE } from "../constants/focusBlockColours";

export default function CreateListModal({ onSave, onClose }) {
  const [name,       setName]       = useState("");
  const [color,      setColor]      = useState(FOCUS_BLOCK_PALETTE[0].hex);
  const [saving,     setSaving]     = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color });
    setSaving(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>

        <div className={styles.header}>
          <h2 className={styles.title}>New list</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <p className={styles.subtitle}>Choose a name and accent colour for your list.</p>

          {/* Name */}
          <input
            className={styles.nameInput}
            placeholder="List name…"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />

          {/* Colour */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>COLOUR</span>
            <div className={styles.colorGrid}>
              {FOCUS_BLOCK_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  className={`${styles.colorSwatch} ${color === c.hex ? styles.colorSwatchActive : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={styles.preview} style={{ "--list-color": color }}>
            <span className={styles.previewDot} style={{ background: color }} />
            <span className={styles.previewName}>{name || "List name"}</span>
          </div>

        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? "Creating…" : "Create list"}
          </button>
        </div>
      </div>
    </div>
  );
}
