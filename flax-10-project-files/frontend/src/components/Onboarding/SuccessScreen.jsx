import { motion } from "framer-motion";
import styles from "./OnboardingModal.module.css";

const hintStyle = {
  background: 'var(--surface)', borderRadius: '10px',
  padding: '0.9rem 1rem', fontSize: '0.88rem',
  color: 'var(--text)', marginBottom: '1.5rem', lineHeight: 1.6,
};

function EnrolmentsHint() {
  return (
    <div style={hintStyle}>
      Want to customise your sleep time and theme preferences? Head over to <strong>Settings</strong>.
    </div>
  );
}

function SuccessEmoji() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      style={{ fontSize: '3rem', marginBottom: '1rem' }}>
      🎉
    </motion.div>
  );
}

export default function SuccessScreen({ major, onComplete }) {
  return (
    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
      style={{ textAlign: 'center', padding: '1rem 0' }}>
      <SuccessEmoji />
      <h2 className={styles.title} style={{ marginBottom: '0.5rem' }}>You're all set!</h2>
      <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: 1.6 }}>
        Your modules for <strong>{major}</strong> have been added to your profile.
      </p>
      <EnrolmentsHint />
      <button className={styles.btn} onClick={onComplete}>Open Settings</button>
    </motion.div>
  );
}