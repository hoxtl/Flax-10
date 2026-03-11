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

function TeacherRequestsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchTeacherRequests());
    } catch (e) {
      setError(e.message || "Failed to load teacher requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (userId, decision) => {
    setBusy(userId);
    try {
      await resolveTeacherRequest(userId, decision);
      setItems((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setError(e.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SectionCard>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          Teacher Role Requests{" "}
          <span className={styles.count}>({items.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState message="No pending teacher role requests." />
      ) : (
        <motion.div
          className={styles.list}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {items.map((u) => (
            <motion.div
              key={u.id}
              className={styles.listRow}
              variants={rowAnim}
              layout
            >
              <div className={styles.listInfo}>
                <span className={styles.listName}>
                  {u.first_name} {u.last_name}
                </span>
                <span className={styles.listMeta}>
                  @{u.username} · {u.email}
                </span>
              </div>
              <div className={styles.listActions}>
                <button
                  className={styles.approveBtn}
                  disabled={busy === u.id}
                  onClick={() => decide(u.id, "approve")}
                >
                  ✓ Approve
                </button>
                <button
                  className={styles.rejectBtn}
                  disabled={busy === u.id}
                  onClick={() => decide(u.id, "reject")}
                >
                  ✗ Reject
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </SectionCard>
  );
}

function ReportedSocietiesTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReports(await fetchReportedSocieties());
    } catch (e) {
      setError(e.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = async (reportId) => {
    setBusy(reportId);
    try {
      await dismissReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      setError(e.message || "Failed to dismiss report.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SectionCard>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          Reported Societies{" "}
          <span className={styles.count}>({reports.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : reports.length === 0 ? (
        <EmptyState message="No reported societies — all clear! 🎉" />
      ) : (
        <motion.div
          className={styles.list}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {reports.map((r) => (
            <motion.div
              key={r.id}
              className={styles.listRow}
              variants={rowAnim}
              layout
            >
              <div className={styles.listInfo}>
                <span className={styles.listName}>{r.society_name}</span>
                <span className={styles.listMeta}>
                  Reported by <strong>@{r.reporter_username}</strong>
                  {r.reason ? ` · "${r.reason}"` : ""}
                </span>
              </div>
              <div className={styles.listActions}>
                <button
                  className={styles.dismissBtn}
                  disabled={busy === r.id}
                  onClick={() => dismiss(r.id)}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </SectionCard>
  );
}

function AdminPage({ onNavChange }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} {...fadeUp}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>
          Manage users, societies and platform requests
        </p>
      </motion.div>

      <motion.div
        className={styles.tabBar}
        {...fadeUp}
        transition={{ delay: 0.08, duration: 0.28 }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {activeTab === t.id && (
              <motion.div
                className={styles.tabUnderline}
                layoutId="admin-tab-underline"
              />
            )}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} {...fadeUp} className={styles.tabContent}>
          {activeTab === "users" && <UsersTab onNavigate={onNavChange} />}
          {activeTab === "ratifications" && <RatificationsTab />}
          {activeTab === "teachers" && <TeacherRequestsTab />}
          {activeTab === "reports" && <ReportedSocietiesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AdminPage;