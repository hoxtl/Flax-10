import { motion } from "framer-motion";

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.95rem' }}>⚠️</span>
        <span style={{ fontWeight: 600, color: 'var(--warning-text)', fontSize: '0.83rem' }}>
          Just so you know
        </span>
      </div>
      <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6, color: 'var(--text)', opacity: 0.75 }}>
        <strong style={{ fontWeight: 600 }}>{major}</strong> can&rsquo;t be changed after this. Your modules will be set up automatically based on your course.
      </p>
    </>
  );
}

function ConfirmCheckbox({ confirmed, onConfirm }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text)', opacity: 0.8, fontWeight: 500 }}>
      <input type="checkbox" checked={confirmed} onChange={e => onConfirm(e.target.checked)} />
      Yes, this is my course
    </label>
  );
}

export default function WarningBox({ major, confirmed, onConfirm }) {
  return (
    <motion.div
      style={boxStyle}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <WarningText major={major} />
      <ConfirmCheckbox confirmed={confirmed} onConfirm={onConfirm} />
    </motion.div>
  );
}
