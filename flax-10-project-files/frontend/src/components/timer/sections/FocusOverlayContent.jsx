/*
 * Focus overlay content.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import TimerCircle from '../TimerCircle';

function FocusExitButton({ onExitFocus }) {
  return <PrimaryButton className={styles.focusOverlayExitBtn} size="large" pill onClick={onExitFocus}>Exit Focus</PrimaryButton>;
}

function FocusOverlayCard({ t }) {
  return <div className={styles.focusOverlayMainCard}><TimerCircle t={t} showAnimationPicker={false} showControls={false} /></div>;
}

export function FocusOverlayContent({ t, onExitFocus }) {
  return (
    <div className={styles.focusOverlayFrame}>
      <FocusExitButton onExitFocus={onExitFocus} />
      <FocusOverlayCard t={t} />
    </div>
  );
}
