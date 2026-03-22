/*
 * Ban modal for admin user actions.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "../AdminPage.module.css";

function BanModalContent({ onCancel, onConfirm, reason, setReason, user }) {
  return (
    <motion.div className={styles.modal} initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 320, damping: 26 }}>
      <div className={styles.modalIcon}>🚫</div>
      <h3 className={styles.modalTitle}>Ban {user.username}?</h3>
      <p className={styles.modalSub}>This user will be immediately locked out of their account.</p>
      <textarea className={styles.reasonInput} placeholder="Reason for ban (optional — shown to the user)" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
      <div className={styles.modalActions}><button className={styles.cancelBtn} onClick={onCancel}>Cancel</button><button className={styles.dangerBtn} onClick={() => onConfirm(reason)}>Ban User</button></div>
    </motion.div>
  );
}

export default function BanUserModal({ onCancel, onConfirm, user }) {
  const [reason, setReason] = useState("");
  return (
    <motion.div className={styles.modalBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <BanModalContent user={user} reason={reason} setReason={setReason} onConfirm={onConfirm} onCancel={onCancel} />
    </motion.div>
  );
}
