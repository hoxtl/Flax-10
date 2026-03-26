/*
 * Auto-start setting control.
 */

import { useState } from 'react';
import styles from '../../../pages/Timer/TimerPage.module.css';
import { AUTOSTART_KEY } from '../utils/presetUtils';

function persistAutoStart(checked, setAutoStart) {
  setAutoStart(checked);
  try { localStorage.setItem(AUTOSTART_KEY, String(checked)); } catch {}
}

export function AutoStartToggle() {
  const [autoStart, setAutoStart] = useState(() => localStorage.getItem(AUTOSTART_KEY) === 'true');

  return (
    <label className={styles.autoStartToggle}>
      <input type="checkbox" checked={autoStart} onChange={(event) => persistAutoStart(event.target.checked, setAutoStart)} />
      Auto-start next session
    </label>
  );
}
