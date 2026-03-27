/*
 * Modal to create a new task list (name + colour + category). Subcomponents keep main fn under 20 lines.
 */

import { useState } from "react";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import styles from "./CreateListModal.module.css";
import { FOCUS_BLOCK_PALETTE } from "../constants/focusBlockColours";
import StandardModal from "../../../components/common/standard_modal/StandardModal";

const LIST_CATEGORIES = [
  { value: "personal", label: "Life" },
  { value: "uni", label: "University" },
  { value: "society", label: "Society" },
];

function CategorySelector({ category, setCategory }) {
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>SECTION</span>
      <div className={styles.categoryChips}>
        {LIST_CATEGORIES.map((cat) => (
          <button key={cat.value} type="button" className={`${styles.categoryChip} ${category === cat.value ? styles.categoryChipActive : ""}`} onClick={() => setCategory(cat.value)}>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListColorPicker({ color, setColor }) {
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>COLOUR</span>
      <div className={styles.colorGrid}>
        {FOCUS_BLOCK_PALETTE.map((c) => (
          <button key={c.hex} type="button" className={`${styles.colorSwatch} ${color === c.hex ? styles.colorSwatchActive : ""}`} style={{ background: c.hex }} onClick={() => setColor(c.hex)} title={c.label} />
        ))}
      </div>
    </div>
  );
}

function CreateListModalBody({ name, setName, color, setColor, category, setCategory, onEnter }) {
  return (
    <div className={styles.body}>
      <p className={styles.subtitle}>Choose a name, section, and accent colour for your list.</p>
      <input className={styles.nameInput} placeholder="List name…" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && onEnter()} />
      <CategorySelector category={category} setCategory={setCategory} />
      <ListColorPicker color={color} setColor={setColor} />
      <div className={styles.preview} style={{ "--list-color": color }}>
        <span className={styles.previewDot} style={{ background: color }} />
        <span className={styles.previewName}>{name || "List name"}</span>
      </div>
    </div>
  );
}

function CreateListModalFooter({ onClose, onSave, saving, canSave }) {
  return (
    <div className={styles.footer}>
      <PrimaryButton variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
      <PrimaryButton onClick={onSave} disabled={saving || !canSave} pill>{saving ? "Creating…" : "Create list"}</PrimaryButton>
    </div>
  );
}

export default function CreateListModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOCUS_BLOCK_PALETTE[0].hex);
  const [category, setCategory] = useState("personal");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color, category });
    setSaving(false); onClose();
  };
  return (
      <StandardModal title="New list" onClose={onClose} size="sm" contentClassName={styles.modalContent}>
        <CreateListModalBody name={name} setName={setName} color={color} setColor={setColor} category={category} setCategory={setCategory} onEnter={handleSave} />
        <CreateListModalFooter onClose={onClose} onSave={handleSave} saving={saving} canSave={!!name.trim()} />
      </StandardModal>
  );
}
