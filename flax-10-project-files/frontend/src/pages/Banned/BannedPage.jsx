import { motion } from "framer-motion";
import BackButton from "../../components/Common/BackButton/BackButton.jsx";
import styles from "./BannedPage.module.css";

function handleBackToAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("banned");
  localStorage.removeItem("ban_reason");
  window.dispatchEvent(new Event("auth-changed"));
}

function BannedIcon() {
  return (
    <motion.div
      className={styles.icon}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 240, damping: 18 }}
    >
      🚫
    </motion.div>
  );
}

function BannedHeading() {
  return (
    <motion.h1
      className={styles.heading}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.3 }}
    >
      Your account has been suspended
    </motion.h1>
  );
}

function BannedReason({ reason }) {
  return (
    <motion.p
      className={styles.reason}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.3 }}
    >
      {reason ? (
        <>
          Reason: <strong className={styles.reasonEmphasis}>{reason}</strong>
        </>
      ) : (
        "Your account has been suspended by an administrator."
      )}
    </motion.p>
  );
}

function BannedBackButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.3 }}
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <BackButton onClick={handleBackToAuth} label="Back to Sign In" />
    </motion.div>
  );
}

export default function BannedPage({ reason }) {
  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <BannedIcon />
      <BannedHeading />
      <BannedReason reason={reason} />
      <BannedBackButton />
    </motion.div>
  );
}
