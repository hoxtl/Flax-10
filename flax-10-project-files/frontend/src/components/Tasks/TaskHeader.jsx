import styles from "./TaskHeader.module.css";
import panelStyles from "./TaskPanel.module.css";

export default function TaskHeader({ menuOpen, setMenuOpen, menuRef, anyCompleted, onClearCompleted }) {
  return (
    <div className={panelStyles.header}>
      <div className={panelStyles.titleBtn} title="To-do">
        <span className={panelStyles.titleText}>To-do</span>
      </div>

      <div className={styles.menuWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Task menu"
          aria-expanded={menuOpen}
        >
          <span className={styles.dots} aria-hidden="true">
            •••
          </span>
        </button>

        {menuOpen && (
          <TopMenu
            anyCompleted={anyCompleted}
            onClearCompleted={onClearCompleted}
          />
        )}
      </div>
    </div>
  );
}

function TopMenu({ anyCompleted, onClearCompleted }) {
  return (
    <div className={styles.menu}>
      <button
        type="button"
        className={styles.menuItem}
        onClick={onClearCompleted}
        disabled={!anyCompleted}
        title={!anyCompleted ? "No completed tasks" : "Remove completed tasks"}
      >
        <span className={styles.menuIcon} aria-hidden="true">
          🪄
        </span>
        <span className={styles.menuLabel}>Clear completed tasks</span>
      </button>
    </div>
  );
}