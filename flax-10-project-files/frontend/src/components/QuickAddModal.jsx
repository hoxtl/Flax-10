import styles from "./QuickAddModal.module.css";
import { useTags } from "../context/TagContext";

function tileStyle(color) {
  return { backgroundColor: `${color}15`, borderColor: `${color}30` };
}

function Tile({ icon, label, onClick, color }) {
  return (
    <button className={styles.tile} onClick={onClick} type="button" style={tileStyle(color)}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label} style={{ color }}>{label}</span>
    </button>
  );
}

function ModalHeader({ onClose }) {
  return (
    <div className={styles.header}>
      <div>
        <h2 className={styles.title}>Quick Add</h2>
        <p className={styles.sub}>What would you like to add?</p>
      </div>
      <button className={styles.close} onClick={onClose} type="button">×</button>
    </div>
  );
}

function TagGrid({ tags, onSelectType }) {
  return (
    <div className={styles.grid}>
      {tags.map(tag => (
        <Tile key={tag.id} icon={tag.icon} label={tag.label} color={tag.color} onClick={() => onSelectType(tag.id)} />
      ))}
    </div>
  );
}

export default function QuickAddModal({ onClose, onSelectType }) {
  const { tags } = useTags();
  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader onClose={onClose} />
        <TagGrid tags={tags} onSelectType={onSelectType} />
      </div>
    </div>
  );
}