import { motion } from "framer-motion";
import styles from "./BannedPage.module.css";

export default function BannedPage({ reason }) {
  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className={styles.icon}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 240, damping: 18 }}
      >
        🚫
      </motion.div>

      <motion.h1
        className={styles.heading}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
      >
        Your account has been suspended
      </motion.h1>

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

      <motion.p
        className={styles.support}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
      >
        If you believe this is a mistake, contact{" "}
        <a href="mailto:support@studyflax.com" className={styles.supportLink}>
          support@studyflax.com
        </a>
      </motion.p>
    </motion.div>
  );
}
