/*
 * Modal to create a new task list (name + colour). Subcomponents keep main fn under 20 lines.
 */

import { useState } from "react";
import PrimaryButton from "../../../components/Common/PrimaryButton/PrimaryButton";
import styles from "./CreateListModal.module.css";
import { FOCUS_BLOCK_PALETTE } from "../constants/focusBlockColours";
import StandardModal from "../../../components/Common/StandardModal/StandardModal";

function CreateListModalBody({ name, setName, color, setColor, onEnter }) {
  return (
    <div className={styles.body}>
      <p className={styles.subtitle}>Choose a name and accent colour for your list.</p>
      <input className={styles.nameInput} placeholder="List name…" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && onEnter()} />
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>COLOUR</span>
        <div className={styles.colorGrid}>
          {FOCUS_BLOCK_PALETTE.map((c) => (
            <button key={c.hex} type="button" className={`${styles.colorSwatch} ${color === c.hex ? styles.colorSwatchActive : ""}`} style={{ background: c.hex }} onClick={() => setColor(c.hex)} title={c.label} />
          ))}
        </div>
      </div>
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
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color });
    setSaving(false); onClose();
  };
  return (
      <StandardModal title="New list" onClose={onClose} size="sm" contentClassName={styles.modalContent}>
        <CreateListModalBody name={name} setName={setName} color={color} setColor={setColor} onEnter={handleSave} />
        <CreateListModalFooter onClose={onClose} onSave={handleSave} saving={saving} canSave={!!name.trim()} />
      </StandardModal>
  );
}
