import { motion } from "framer-motion";
import CelebrationEmoji from "../common/motion/CelebrationEmoji";
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

import PrimaryButton from "../common/primary_button/PrimaryButton";

export default function SuccessScreen({ major, onComplete }) {
  return (
    <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
      className={styles.successWrapper}>
      <CelebrationEmoji emoji="🎉" size="3rem" className={styles.successEmoji} />
      <h2 className={styles.title} style={{ marginBottom: '0.5rem' }}>You're all set!</h2>
      <p className={styles.successBody}>
        Your modules for <strong>{major}</strong> have been added to your profile.
      </p>
      <EnrolmentsHint />
      <PrimaryButton onClick={onComplete} pill width="100%">Open Settings</PrimaryButton>
    </motion.div>
  );
}
