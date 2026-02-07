import styles from "./QuickAddModal.module.css";

// Reusable Tile component for each option in the quick add modal, displaying an icon and label
function Tile({ icon, label, onClick, className }) {
  return (
    <button className={`${styles.tile} ${className || ""}`} onClick={onClick} type="button">
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

// Main component for the quick add modal, displaying options for adding different types of events (class, study block, task, other)
export default function QuickAddModal({ onClose, onSelectType }) {
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
          <Tile icon="📚" label="Class" className={styles.class} onClick={() => onSelectType("class")} />
          <Tile icon="🧠" label="Study Block" className={styles.study} onClick={() => onSelectType("study")} />
          <Tile icon="✅" label="Task" className={styles.task} onClick={() => onSelectType("task")} />
          <Tile icon="⭐" label="Other" className={styles.other} onClick={() => onSelectType("other")} />
        </div>
      </div>
    </div>
  );
}
