import { motion as Motion } from "framer-motion";
import FilterCheckbox from "../../common/filter_checkbox/FilterCheckbox";
import styles from "../styles/OnboardingModal.module.css";

const boxStyle = {
  marginTop: '1rem',
  padding: '1rem 1.1rem',
  borderRadius: '10px',
  background: 'var(--warning-bg)',
  border: '1px solid var(--warning-border)',
  fontSize: '0.85rem',
};

function WarningText({ major }) {
  return (
    <>
      <div className={styles.warningRow}>
        <span style={{ fontSize: '0.95rem' }}>⚠️</span>
        <span className={styles.warningTitle}>
          Just so you know
        </span>
      </div>
      <p className={styles.warningBody}>
        <strong style={{ fontWeight: 600 }}>{major}</strong> can&rsquo;t be changed after this. Your modules will be set up automatically based on your course.
      </p>
    </>
  );
}

function ConfirmCheckbox({ confirmed, onConfirm }) {
  return (
    <label className={styles.confirmLabel}>
      <FilterCheckbox checked={confirmed} onChange={e => onConfirm(e.target.checked)} />
      Yes, this is my course
    </label>
  );
}

export default function WarningBox({ major, confirmed, onConfirm }) {
  return (
    <Motion.div
      style={boxStyle}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <WarningText major={major} />
      <ConfirmCheckbox confirmed={confirmed} onConfirm={onConfirm} />
    </Motion.div>
  );
}
