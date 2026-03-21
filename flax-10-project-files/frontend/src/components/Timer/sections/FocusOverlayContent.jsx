/*
 * Focus overlay content.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import TimerCircle from '../TimerCircle';

function FocusExitButton({ onExitFocus }) {
  return <button className={styles.focusOverlayExitBtn} onClick={onExitFocus}>Exit Focus</button>;
}

function FocusOverlayCard({ t }) {
  return <div className={styles.focusOverlayMainCard}><TimerCircle t={t} showAnimationPicker={false} /></div>;
}

export function FocusOverlayContent({ t, onExitFocus }) {
  return (
    <div className={styles.focusOverlayFrame}>
      <FocusExitButton onExitFocus={onExitFocus} />
      <FocusOverlayCard t={t} />
    </div>
  );
}
