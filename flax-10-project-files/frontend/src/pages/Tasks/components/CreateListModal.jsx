import { useState } from "react";
import styles from "./CreateListModal.module.css";
import { FOCUS_BLOCK_PALETTE } from "../constants/focusBlockColours";

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function CreateListModal({ onSave, onClose }) {
  const [name,       setName]       = useState("");
  const [color,      setColor]      = useState(FOCUS_BLOCK_PALETTE[0].hex);
  const [customColor, setCustomColor] = useState("");
  const [useCustom,   setUseCustom]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const effectiveColor = useCustom && customColor ? customColor : color;

  const handleSave = async () => {
    if (!name.trim()) return;
    const finalColor = useCustom && customColor ? customColor : color;
    setSaving(true);
    await onSave({ name: name.trim(), color: finalColor });
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
          <p className={styles.subtitle}>Give your list a name and colour</p>

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
                  className={`${styles.colorSwatch} ${!useCustom && color === c.hex ? styles.colorSwatchActive : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => { setColor(c.hex); setUseCustom(false); }}
                  title={c.label}
                />
              ))}
            </div>
            <div className={styles.customColorRow}>
              <label className={styles.customColorLabel}>
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={e => setUseCustom(e.target.checked)}
                />
                <span>Custom colour</span>
              </label>
              {useCustom && (
                <input
                  type="color"
                  className={styles.customColorInput}
                  value={customColor || color}
                  onChange={e => setCustomColor(e.target.value)}
                  title="Pick a custom colour"
                />
              )}
            </div>
          </div>

          {/* Preview */}
          <div className={styles.preview} style={{ "--list-color": effectiveColor }}>
            <span className={styles.previewDot} style={{ background: effectiveColor }} />
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