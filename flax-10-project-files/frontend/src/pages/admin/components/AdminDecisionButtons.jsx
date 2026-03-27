/*
 * Shared approve/reject action buttons for admin list rows.
 */

import styles from "../styles";

export default function AdminDecisionButtons({ busy, onApprove, onReject }) {
  return (
    <>
      <button className={styles.approveBtn} disabled={busy} onClick={onApprove}>✓ Approve</button>
      <button className={styles.rejectBtn} disabled={busy} onClick={onReject}>✗ Reject</button>
    </>
  );
}
