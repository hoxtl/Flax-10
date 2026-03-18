import { useState, useRef } from 'react';
import StandardModal from '../StandardModal/StandardModal';
import PrimaryButton from '../PrimaryButton/PrimaryButton';
import styles from './HoldConfirmModal.module.css';

/**
 * A reusable danger-action modal with a "hold to confirm" pattern.
 * The safe action (cancel) is the solid primary button.
 * The destructive action requires holding for `holdDuration` ms.
 */
export default function HoldConfirmModal({
    title,
    warningText,
    cancelLabel = 'Keep It',
    holdLabel = 'Hold to Delete',
    holdDuration = 2000,
    onConfirm,
    onCancel,
}) {
    const [holdProgress, setHoldProgress] = useState(0);
    const holdInterval = useRef(null);

    const startHold = () => {
        const start = Date.now();
        holdInterval.current = setInterval(() => {
            const pct = Math.min(100, ((Date.now() - start) / holdDuration) * 100);
            setHoldProgress(pct);
            if (pct >= 100) {
                clearInterval(holdInterval.current);
                setHoldProgress(0);
                onConfirm();
            }
        }, 16);
    };

    const stopHold = () => {
        clearInterval(holdInterval.current);
        setHoldProgress(0);
    };

    return (
        <StandardModal title={title} onClose={onCancel} size="sm" modalClassName={styles.modal}>
            <div className={styles.body}>
                {warningText && <p className={styles.warning}>{warningText}</p>}
                <div className={styles.buttons}>
                    <PrimaryButton variant="primary" pill onClick={onCancel}>
                        {cancelLabel}
                    </PrimaryButton>
                    <button
                        className={styles.holdBtn}
                        onMouseDown={startHold}
                        onMouseUp={stopHold}
                        onMouseLeave={stopHold}
                        onTouchStart={startHold}
                        onTouchEnd={stopHold}
                    >
                        {holdProgress > 0 && (
                            <span className={styles.holdBtnBar} style={{ width: `${holdProgress}%` }} />
                        )}
                        <span className={styles.holdBtnLabel}>
                            {holdProgress > 0 ? 'Hold…' : holdLabel}
                        </span>
                    </button>
                </div>
            </div>
        </StandardModal>
    );
}
