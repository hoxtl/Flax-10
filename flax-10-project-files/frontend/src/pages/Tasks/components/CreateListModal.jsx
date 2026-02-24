/**
 * CreateListModal.jsx
 *
 * Requires frimousse:  npm install frimousse
 * And the emoji-picker component from:
 *   npx shadcn@latest add https://21st.dev/r/liveblocks/emoji-picker
 *
 * Place that component at: src/components/ui/emoji-picker.jsx
 * Then update the import path below if needed.
 */
import { useState, useRef, useEffect } from "react";
import styles from "./CreateListModal.module.css";

// ── Try to import frimousse emoji picker ─────────────────────────────────────
// Import from your actual component path once you've run the shadcn command.
// If the file doesn't exist yet, the picker will degrade gracefully.
let EmojiPickerPrimitive = null;
try {
  EmojiPickerPrimitive = require("frimousse").EmojiPicker;
} catch { /* not installed */ }

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

// ── Inline frimousse emoji picker ─────────────────────────────────────────────
function EmojiPickerPanel({ onSelect }) {
  if (EmojiPickerPrimitive) {
    return (
      <EmojiPickerPrimitive.Root
        className={styles.frimousseRoot}
        onEmojiSelect={({ emoji }) => onSelect(emoji)}
      >
        <div className={styles.frimousseSearchRow}>
          <span className={styles.frimousseSearchIcon}>🔍</span>
          <EmojiPickerPrimitive.Search
            className={styles.frimousseSearch}
            placeholder="Search emoji…"
          />
        </div>
        <EmojiPickerPrimitive.Viewport className={styles.frimousseViewport}>
          <EmojiPickerPrimitive.Loading className={styles.frimousseLoading}>
            Loading…
          </EmojiPickerPrimitive.Loading>
          <EmojiPickerPrimitive.Empty className={styles.frimousseEmpty}>
            No emoji found.
          </EmojiPickerPrimitive.Empty>
          <EmojiPickerPrimitive.List
            className={styles.frimousseList}
            components={{
              Row: ({ children, ...p }) => (
                <div {...p} className={styles.frimousseRow}>{children}</div>
              ),
              Emoji: ({ emoji, ...p }) => (
                <button {...p} className={styles.frimousseEmoji}>{emoji.emoji}</button>
              ),
              CategoryHeader: ({ category, ...p }) => (
                <div {...p} className={styles.frimousseCategory}>{category.label}</div>
              ),
            }}
          />
        </EmojiPickerPrimitive.Viewport>
      </EmojiPickerPrimitive.Root>
    );
  }

  // Fallback if frimousse not installed
  const QUICK = ["📚","📖","✏️","🎓","💼","🏠","🛒","🎯","🎨","🎵","🏆","💰","💡","🔬","🌱","⚽","🎮","☕","❤️","🚀"];
  return (
    <div className={styles.fallbackGrid}>
      {QUICK.map(em => (
        <button key={em} className={styles.frimousseEmoji} onClick={() => onSelect(em)}>{em}</button>
      ))}
      <p className={styles.fallbackHint}>Run <code>npm install frimousse</code> for the full picker.</p>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function CreateListModal({ onSave, onClose }) {
  const [name,       setName]       = useState("");
  const [icon,       setIcon]       = useState("");
  const [color,      setColor]      = useState(COLOUR_PALETTE[0].hex);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const h = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [pickerOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), icon, color });
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

          {/* Icon row */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>ICON</span>
            <div className={styles.iconArea} ref={pickerRef}>
              <button
                className={`${styles.iconTrigger} ${pickerOpen ? styles.iconTriggerOpen : ""}`}
                onClick={() => setPickerOpen(p => !p)}
              >
                {icon
                  ? <span className={styles.iconDisplay}>{icon}</span>
                  : <span className={styles.iconPlaceholder}>Pick emoji</span>
                }
              </button>
              {icon && (
                <button className={styles.clearIcon} onClick={() => setIcon("")} title="Clear">✕</button>
              )}
              {pickerOpen && (
                <div className={styles.pickerDropdown}>
                  <EmojiPickerPanel onSelect={em => { setIcon(em); setPickerOpen(false); }} />
                </div>
              )}
            </div>
          </div>

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
            {icon && <span className={styles.previewIcon}>{icon}</span>}
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