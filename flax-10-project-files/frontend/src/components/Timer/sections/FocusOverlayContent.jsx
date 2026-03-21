/*
 * Focus overlay content.
 */

<<<<<<< HEAD
import styles from '../../../pages/timer/TimerPage.module.css';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import TimerCircle from '../TimerCircle';

function FocusExitButton({ onExitFocus }) {
  return <PrimaryButton className={styles.focusOverlayExitBtn} size="large" pill onClick={onExitFocus}>Exit Focus</PrimaryButton>;
}

function FocusOverlayCard({ t }) {
  return <div className={styles.focusOverlayMainCard}><TimerCircle t={t} showAnimationPicker={false} showControls={false} /></div>;
=======
import styles from '../../../pages/Timer/TimerPage.module.css';
import TimerCircle from '../TimerCircle';

function FocusExitButton({ onExitFocus }) {
  return <button className={styles.focusOverlayExitBtn} onClick={onExitFocus}>Exit Focus</button>;
}

function FocusOverlayCard({ t }) {
  return <div className={styles.focusOverlayMainCard}><TimerCircle t={t} showAnimationPicker={false} /></div>;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export function FocusOverlayContent({ t, onExitFocus }) {
  return (
    <div className={styles.focusOverlayFrame}>
      <FocusExitButton onExitFocus={onExitFocus} />
      <FocusOverlayCard t={t} />
    </div>
  );
}
