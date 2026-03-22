/*
 * Danger-action confirmation modal requiring a sustained hold to confirm.
 */

import { useState, useRef } from 'react';
import StandardModal from '../StandardModal/StandardModal';
import PrimaryButton from '../PrimaryButton/PrimaryButton';
import styles from './HoldConfirmModal.module.css';

function useHoldProgress(holdDuration, onConfirm) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdInterval = useRef(null);

  const startHold = () => {
    const start = Date.now();
    holdInterval.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / holdDuration) * 100);
      setHoldProgress(pct);
      if (pct >= 100) { clearInterval(holdInterval.current); setHoldProgress(0); onConfirm(); }
    }, 16);
  };

  const stopHold = () => { clearInterval(holdInterval.current); setHoldProgress(0); };

  return { holdProgress, startHold, stopHold };
}

function HoldButton({ holdLabel, holdProgress, startHold, stopHold }) {
  return (
    <button className={styles.holdBtn}
      onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
      onTouchStart={startHold} onTouchEnd={stopHold}>
      {holdProgress > 0 && <span className={styles.holdBtnBar} style={{ width: `${holdProgress}%` }} />}
      <span className={styles.holdBtnLabel}>{holdProgress > 0 ? 'Hold…' : holdLabel}</span>
    </button>
  );
}

/** Modal that requires holding a button for a set duration to confirm a destructive action. */
export default function HoldConfirmModal({
  title, warningText, warningBanner,
  cancelLabel = 'Keep It', holdLabel = 'Hold to Delete',
  holdDuration = 2000, onConfirm, onCancel,
}) {
  const { holdProgress, startHold, stopHold } = useHoldProgress(holdDuration, onConfirm);
  return (
    <StandardModal title={title} onClose={onCancel} size="sm" modalClassName={styles.modal}>
      <div className={styles.body}>
        {warningBanner && (
          <div className={styles.warningBanner}>
            <span className={styles.warningBannerIcon} aria-hidden>⚠️</span>
            <span className={styles.warningBannerText}>{warningBanner}</span>
          </div>
        )}
        {warningText && <p className={styles.warning}>{warningText}</p>}
        <div className={styles.buttons}>
          <PrimaryButton variant="primary" pill onClick={onCancel}>{cancelLabel}</PrimaryButton>
          <HoldButton holdLabel={holdLabel} holdProgress={holdProgress} startHold={startHold} stopHold={stopHold} />
        </div>
      </div>
    </StandardModal>
  );
}
