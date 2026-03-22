/** Shared UI components for admin dashboard tabs. */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BasePill from "../../../components/Tags/BasePill";
import styles from "../AdminPage.module.css";

export function SectionCard({ children }) {
  return <div className={styles.card}>{children}</div>;
}

export function EmptyState({ message }) {
  return <motion.p className={styles.empty} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease: "easeOut" }}>{message}</motion.p>;
}

export function LoadingSpinner() {
  return (
    <div className={styles.spinnerWrap}>
      <motion.div className={styles.spinner} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }} />
    </div>
  );
}

export function StatusBadge({ active }) {
  return <span className={active ? styles.badgeActive : styles.badgeBanned}>{active ? "Active" : "Banned"}</span>;
}

export function RoleBadge({ role }) {
  const map = { teacher: styles.badgeTeacher, student: styles.badgeStudent, pending_teacher: styles.badgePending };
  return <span className={`${styles.badge} ${map[role] || styles.badgeStudent}`}>{role.replace("_", " ")}</span>;
}

import CommonSearchBar from "../../../components/Common/SearchBar/SearchBar";

export function SearchBar(props) {
  return <CommonSearchBar {...props} />;
}

export function FilterToggleGroup({ options, selected, onToggle }) {
  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterButtons}>
        {options.map((opt) => <BasePill key={opt.value} label={opt.label} isActive={selected.includes(opt.value)} onClick={() => onToggle(opt.value)} />)}
      </div>
    </div>
  );
}

function BanModalContent({ user, reason, setReason, onConfirm, onCancel }) {
  return (
    <motion.div className={styles.modal} initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 320, damping: 26 }}>
      <div className={styles.modalIcon}>🚫</div>
      <h3 className={styles.modalTitle}>Ban {user.username}?</h3>
      <p className={styles.modalSub}>This user will be immediately locked out of their account.</p>
      <textarea className={styles.reasonInput} placeholder="Reason for ban (optional — shown to the user)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
      <div className={styles.modalActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.dangerBtn} onClick={() => onConfirm(reason)}>Ban User</button>
      </div>
    </motion.div>
  );
}

export function BanModal({ user, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <motion.div className={styles.modalBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <BanModalContent user={user} reason={reason} setReason={setReason} onConfirm={onConfirm} onCancel={onCancel} />
    </motion.div>
  );
}

export function CardHeader({ title, count, children }) {
  return (
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>{title} {count !== undefined && <span className={styles.count}>({count})</span>}</h2>
      {children}
    </div>
  );
}

export function ListRow({ item, onClick, children, style }) {
  return (
    <motion.div className={styles.listRow} variants={{ initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 10 }, transition: { duration: 0.2 } }} layout onClick={onClick} style={style}>
      {children}
    </motion.div>
  );
}

export function ListInfo({ name, meta, extraMeta }) {
  return (
    <div className={styles.listInfo}>
      <span className={styles.listName}>{name}</span>
      <span className={styles.listMeta}>{meta}</span>
      {extraMeta && <span className={styles.listMeta}>{extraMeta}</span>}
    </div>
  );
}

export function ListActions({ children }) {
  return <div className={styles.listActions}>{children}</div>;
}

export function ApproveRejectButtons({ busy, onApprove, onReject }) {
  return (
    <>
      <button className={styles.approveBtn} disabled={busy} onClick={onApprove}>✓ Approve</button>
      <button className={styles.rejectBtn} disabled={busy} onClick={onReject}>✗ Reject</button>
    </>
  );
}

export function BanDismissButtons({ busy, onBan, onDismiss }) {
  return (
    <>
      <button className={styles.banBtn} disabled={busy} onClick={onBan}>Ban</button>
      <button className={styles.dismissBtn} disabled={busy} onClick={onDismiss}>Dismiss</button>
    </>
  );
}

export function AdminListSection({ title, count, error, loading, isEmpty, emptyMessage, pagination, children }) {
  return (
    <SectionCard>
      <CardHeader title={title} count={count} />
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? <LoadingSpinner /> : isEmpty ? <EmptyState message={emptyMessage} /> : <>{pagination}{children}</>}
    </SectionCard>
  );
}

export function AnimatedList({ items, renderItem, stagger }) {
  return (
    <motion.div className={styles.list} variants={stagger} initial="initial" animate="animate">
      <AnimatePresence>{items.map(renderItem)}</AnimatePresence>
    </motion.div>
  );
}
