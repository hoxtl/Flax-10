import { useState } from "react";
import styles from "./CreateListModal.module.css";

// ── Color palette ─────────────────────────────────────────────────────────────
const COLOUR_PALETTE = [
  { hex: "#6366f1", label: "Indigo"  },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#f59e0b", label: "Amber"   },
  { hex: "#ec4899", label: "Pink"    },
  { hex: "#8b5cf6", label: "Violet"  },
  { hex: "#06b6d4", label: "Cyan"    },
  { hex: "#ef4444", label: "Red"     },
  { hex: "#84cc16", label: "Lime"    },
  { hex: "#f97316", label: "Orange"  },
  { hex: "#94a3b8", label: "Slate"   },
];

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function CreateListModal({ onSave, onClose }) {
  const [name,       setName]       = useState("");
  const [color,      setColor]      = useState(COLOUR_PALETTE[0].hex);
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
              {COLOUR_PALETTE.map(c => (
                <button
                  key={c.hex}
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