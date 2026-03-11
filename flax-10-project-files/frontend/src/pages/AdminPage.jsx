import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchTeacherRequests,
  resolveTeacherRequest,
  fetchReportedSocieties,
  dismissReport,
  fetchPendingRatifications,
  approveRatification,
  rejectRatification,
} from "../api/adminApi";
import styles from "./AdminPage.module.css";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.055 } },
};

const rowAnim = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: 0.2 },
};

const TABS = [
  { id: "users", label: "👤 Users" },
  { id: "ratifications", label: "🏛️ Ratifications" },
  { id: "teachers", label: "🎓 Teacher Requests" },
  { id: "reports", label: "🚩 Reported Societies" },
];

function SectionCard({ children }) {
  return <div className={styles.card}>{children}</div>;
}

function EmptyState({ message }) {
  return (
    <motion.p className={styles.empty} {...fadeUp}>
      {message}
    </motion.p>
  );
}

function LoadingSpinner() {
  return (
    <div className={styles.spinnerWrap}>
      <motion.div
        className={styles.spinner}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
      />
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={active ? styles.badgeActive : styles.badgeBanned}>
      {active ? "Active" : "Banned"}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    teacher: styles.badgeTeacher,
    student: styles.badgeStudent,
    pending_teacher: styles.badgePending,
  };
  return (
    <span className={`${styles.badge} ${map[role] || styles.badgeStudent}`}>
      {role.replace("_", " ")}
    </span>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      className={styles.search}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function BanModal({ user, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      className={styles.modalBackdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div className={styles.modalIcon}>🚫</div>
        <h3 className={styles.modalTitle}>Ban {user.username}?</h3>
        <p className={styles.modalSub}>
          This user will be immediately locked out of their account.
        </p>
        <textarea
          className={styles.reasonInput}
          placeholder="Reason for ban (optional — shown to the user)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.dangerBtn}
            onClick={() => onConfirm(reason)}
          >
            Ban User
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <PageHeader
        title="Admin"
        subtitle="Superuser controls — only visible to admin accounts"
      />
      <div className={styles.placeholder}>
        <p>Admin tools coming soon.</p>
      </div>
    </div>
  );
}
