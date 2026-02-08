import styles from "./QuickAddModal.module.css";
import { useTags } from "../context/TagContext";

// Reusable Tile component for each option in the quick add modal, displaying an icon and label
function Tile({ icon, label, onClick, color }) {
  return (
    <button
      className={styles.tile}
      onClick={onClick}
      type="button"
      style={{
        backgroundColor: `${color}15`, // 15 = ~8% opacity
        borderColor: `${color}30`     // 30 = ~19% opacity
      }}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label} style={{ color: color }}>{label}</span>
    </button>
  );
}

// Main component for the quick add modal, displaying options for adding different types of events
export default function QuickAddModal({ onClose, onSelectType }) {
  const { tags } = useTags();

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Quick Add</h2>
            <p className={styles.sub}>What would you like to add?</p>
          </div>
          <button className={styles.close} onClick={onClose} type="button">×</button>
        </div>

        <div className={styles.grid}>
          {tags.map(tag => (
            <Tile
              key={tag.id}
              icon={tag.icon}
              label={tag.label}
              color={tag.color}
              onClick={() => onSelectType(tag.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
