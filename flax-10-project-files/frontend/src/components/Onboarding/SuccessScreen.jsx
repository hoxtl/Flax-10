/**
 * SuccessScreen component shown at the end of the onboarding flow.
 * Confirms setup is complete and provides a shortcut to the dashboard.
 */

import { motion } from "framer-motion";
import styles from "./OnboardingModal.module.css";

const hintStyle = {
  background: 'rgba(158, 126, 93, 0.07)',
  border: '1px solid rgba(158, 126, 93, 0.18)',
  borderRadius: '10px',
  padding: '0.85rem 1rem',
  fontSize: '0.84rem',
  color: 'var(--muted)',
  marginBottom: '1.5rem',
  lineHeight: 1.6,
  textAlign: 'left',
};

const containerAnim = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 },
};

/**
 * Animated party emoji that wiggles on mount.
 */
function WiggleEmoji() {
  return (
    <motion.span
      style={{ display: 'inline-block' }}
      animate={{ rotate: [0, -15, 15, -10, 10, -5, 5, 0] }}
      transition={{ duration: 0.9, delay: 0.4, ease: "easeInOut" }}
    >
      🎉
    </motion.span>
  );
}

/**
 * Icon container that springs into view with a rotation on mount.
 */
function SuccessIcon() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
      style={{ fontSize: '2.8rem', marginBottom: '1.1rem', display: 'inline-block' }}
    >
      <WiggleEmoji />
    </motion.div>
  );
}

/**
 * Animated heading confirming setup is complete.
 */
function SuccessTitle() {
  return (
    <motion.h2
      className={styles.title}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.18 }}
      style={{ marginBottom: '0.4rem' }}
    >
      You&rsquo;re all set!
    </motion.h2>
  );
}

/**
 * Paragraph confirming the user's major modules are ready.
 * @param {object} props
 * @param {string} props.major - The user's selected major.
 */
function SuccessBody({ major }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.28 }}
      style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: '1.25rem', lineHeight: 1.65 }}
    >
      Your modules for{' '}
      <strong style={{ color: 'var(--primary, #9E7E5D)', fontWeight: 600 }}>{major}</strong>
      {' '}are ready. Everything&rsquo;s been set up based on your course.
    </motion.p>
  );
}

/**
 * Hint box directing the user to the My Enrolments section.
 */
function EnrolmentsHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.38 }}
      style={hintStyle}
    >
      📚 Want to see your enrolled modules in detail? Head to{' '}
      <strong style={{ color: 'var(--primary, #9E7E5D)' }}>My Enrolments</strong>
      {' '}in the Modules section.
    </motion.div>
  );
}

/**
 * Animated button that completes the onboarding flow on click.
 * @param {object} props
 * @param {Function} props.onClick - Callback invoked when the button is clicked.
 */
function CompleteButton({ onClick }) {
  return (
    <motion.button
      className={styles.btn}
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.45 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      Open my dashboard
    </motion.button>
  );
}

/**
 * Final screen of the onboarding flow.
 * @param {object} props
 * @param {string} props.major - The user's selected major shown in the confirmation message.
 * @param {Function} props.onComplete - Callback invoked when the user proceeds to the dashboard.
 */
export default function SuccessScreen({ major, onComplete }) {
  return (
    <motion.div key="success" {...containerAnim} style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <SuccessIcon />
      <SuccessTitle />
      <SuccessBody major={major} />
      <EnrolmentsHint />
      <CompleteButton onClick={onComplete} />
    </motion.div>
  );
}
