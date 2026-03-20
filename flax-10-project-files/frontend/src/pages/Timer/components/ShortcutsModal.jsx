/*
 * Timer keyboard shortcuts modal.
 */

import styles from '../TimerPage.module.css';

const SHORTCUTS = [
  { key: 'Space', desc: 'Start / Pause' },
  { key: 'R', desc: 'Reset timer' },
  { key: 'F', desc: 'Focus mode' },
  { key: 'Esc', desc: 'Exit overlays' },
  { key: '?', desc: 'Show this help' },
];

function ShortcutRow({ shortcut }) {
  return (
    <div className={styles.shortcutRow}>
      <kbd className={styles.shortcutKey}>{shortcut.key}</kbd>
      <span className={styles.shortcutDesc}>{shortcut.desc}</span>
    </div>
  );
}

export function ShortcutsModal({ onClose }) {
  return (
    <div className={styles.shortcutsOverlay} onClick={onClose}>
      <div className={styles.shortcutsModal} onClick={(event) => event.stopPropagation()}>
        <span className={styles.shortcutsTitle}>Keyboard Shortcuts</span>
        <div className={styles.shortcutsList}>{SHORTCUTS.map((shortcut) => <ShortcutRow key={shortcut.key} shortcut={shortcut} />)}</div>
        <button className={styles.shortcutsClose} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
