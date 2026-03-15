import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pagination } from "../../components/Pagination/Pagination";
import BasePill from "../../components/Tags/BasePill";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchTeacherRequests,
  resolveTeacherRequest,
  fetchReportedSocieties,
  dismissReport,
  banReportedSociety,
  fetchPendingRatifications,
  approveRatification,
  rejectRatification,
  fetchCourseChangeRequests,
  resolveCourseChangeRequest,
} from "../../api/adminApi";
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
  { id: "course-changes", label: "📚 Course Change Requests" },
];

const PAGE_SIZE = 20;

const USER_FILTER_GROUPS = {
  roles: [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
  ],
  staff: [{ value: "staff", label: "Staff" }],
  status: [
    { value: "active", label: "Active" },
    { value: "banned", label: "Banned" },
  ],
};

function usePaginatedItems(items, pageSize = PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((items?.length || 0) / pageSize)),
    [items, pageSize],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return { currentPage, setCurrentPage, totalPages, pageItems };
}

function toggleArrayValue(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function matchesRoleFilter(user, selectedRoles) {
  if (!selectedRoles.length) return true;
  return selectedRoles.some((role) => {
    if (role === "teacher") {
      return user.role === "teacher" || user.role === "pending_teacher";
    }
    if (role === "student") {
      return user.role === "student";
    }
    return false;
  });
}

function matchesStaffFilter(user, selectedStaff) {
  if (!selectedStaff.length) return true;
  return selectedStaff.some(
    (option) => option === "staff" && (!!user.is_staff || !!user.is_superuser),
  );
}

function matchesStatusFilter(user, selectedStatus) {
  if (!selectedStatus.length) return true;
  return selectedStatus.some((status) => {
    if (status === "active") return !!user.is_active;
    if (status === "banned") return !user.is_active;
    return false;
  });
}

function matchesAllUserFilters(user, filters) {
  if (!matchesRoleFilter(user, filters.roles)) return false;
  if (!matchesStaffFilter(user, filters.staff)) return false;
  if (!matchesStatusFilter(user, filters.status)) return false;
  return true;
}

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

function SearchBar({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      className={`${styles.search} ${className}`.trim()}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function FilterToggleGroup({ label, options, selected, onToggle }) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterGroupLabel}>{label}</span>
      <div className={styles.filterButtons}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <BasePill
              key={opt.value}
              label={opt.label}
              isActive={active}
              onClick={() => onToggle(opt.value)}
            />
          );
        })}
      </div>
    </div>
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

function UsersTab({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilters, setUserFilters] = useState({
    roles: [],
    staff: [],
    status: [],
  });
  const [banTarget, setBanTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await fetchAdminUsers());
    } catch (e) {
      setError(e.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = `${u.username} ${u.email} ${u.first_name} ${u.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return q && matchesAllUserFilters(u, userFilters);
      }),
    [users, search, userFilters],
  );

  const hasActiveUserFilters = useMemo(
    () =>
      userFilters.roles.length > 0 ||
      userFilters.staff.length > 0 ||
      userFilters.status.length > 0,
    [userFilters],
  );

  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(filtered);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, userFilters, setCurrentPage]);

  const toggleGroup = (group, value) => {
    setUserFilters((prev) => ({
      ...prev,
      [group]: toggleArrayValue(prev[group], value),
    }));
  };

  const clearUserFilters = () => {
    setUserFilters({ roles: [], staff: [], status: [] });
  };

  const handleBanConfirm = async (reason) => {
    if (!banTarget) return;
    setBusy(true);
    try {
      await banUser(banTarget.id, reason);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === banTarget.id
            ? { ...u, is_active: false, ban_reason: reason }
            : u,
        ),
      );
    } catch (e) {
      setError(e.message || "Failed to ban user.");
    } finally {
      setBusy(false);
      setBanTarget(null);
    }
  };

  const handleUnban = async (user) => {
    setBusy(true);
    try {
      await unbanUser(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: true, ban_reason: "" } : u,
        ),
      );
    } catch (e) {
      setError(e.message || "Failed to unban user.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SectionCard>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>All Users</h2>
          <div className={styles.headerControls}>
            <div className={styles.filterGroupsWrap}>
              <FilterToggleGroup
                options={USER_FILTER_GROUPS.roles}
                selected={userFilters.roles}
                onToggle={(value) => toggleGroup("roles", value)}
              />
              <span className={styles.pillDivider} />
              <FilterToggleGroup
                options={USER_FILTER_GROUPS.staff}
                selected={userFilters.staff}
                onToggle={(value) => toggleGroup("staff", value)}
              />
              <span className={styles.pillDivider} />
              <FilterToggleGroup
                options={USER_FILTER_GROUPS.status}
                selected={userFilters.status}
                onToggle={(value) => toggleGroup("status", value)}
              />
              {hasActiveUserFilters && (
                <button
                  type="button"
                  className={styles.clearFiltersBtn}
                  onClick={clearUserFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
            <SearchBar
              className={styles.searchCompact}
              value={search}
              onChange={setSearch}
              placeholder="Search"
            />
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <motion.div
              className={styles.table}
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              <div className={`${styles.tableRow} ${styles.tableHead}`}>
                <span>User</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              <AnimatePresence>
                {pageItems.map((u) => (
                  <motion.div
                    key={u.id}
                    className={styles.tableRow}
                    variants={rowAnim}
                    layout
                  >
                    <span className={styles.nameCell}>
                      <button
                        className={styles.nameBtn}
                        onClick={() => onNavigate?.(`profile_${u.id}`)}
                      >
                        {u.first_name} {u.last_name}
                        <span className={styles.username}>@{u.username}</span>
                      </button>
                    </span>
                    <span className={styles.emailCell}>{u.email}</span>
                    <span>
                      <RoleBadge role={u.role} />
                    </span>
                    <span>
                      <StatusBadge active={u.is_active} />
                    </span>
                    <span className={styles.actionsCell}>
                      {!u.is_staff &&
                        !u.is_superuser &&
                        (u.is_active ? (
                          <button
                            className={styles.banBtn}
                            disabled={busy}
                            onClick={() => setBanTarget(u)}
                          >
                            Ban
                          </button>
                        ) : (
                          <button
                            className={styles.unbanBtn}
                            disabled={busy}
                            onClick={() => handleUnban(u)}
                          >
                            Unban
                          </button>
                        ))}
                      {(u.is_staff || u.is_superuser) && (
                        <span className={styles.staffBadge}>Staff</span>
                      )}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </SectionCard>

      <AnimatePresence>
        {banTarget && (
          <BanModal
            user={banTarget}
            onConfirm={handleBanConfirm}
            onCancel={() => setBanTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function RatificationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(items);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchPendingRatifications());
    } catch (e) {
      setError(e.message || "Failed to load ratifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (societyId, action) => {
    setBusy(societyId);
    try {
      if (action === "approve") await approveRatification(societyId);
      else await rejectRatification(societyId);
      setItems((prev) => prev.filter((s) => s.id !== societyId));
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
          Pending Ratifications{" "}
          <span className={styles.count}>({items.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState message="No societies are awaiting ratification." />
      ) : (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <motion.div
            className={styles.list}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {pageItems.map((s) => (
              <motion.div
                key={s.id}
                className={styles.listRow}
                variants={rowAnim}
                layout
              >
                <div className={styles.listInfo}>
                  <span className={styles.listName}>{s.name}</span>
                  <span className={styles.listMeta}>
                    {s.member_count ?? 0} members
                    {s.description ? ` · ${s.description.slice(0, 80)}…` : ""}
                  </span>
                </div>
                <div className={styles.listActions}>
                  <button
                    className={styles.approveBtn}
                    disabled={busy === s.id}
                    onClick={() => decide(s.id, "approve")}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busy === s.id}
                    onClick={() => decide(s.id, "reject")}
                  >
                    ✗ Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </SectionCard>
  );
}

function TeacherRequestsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(items);

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
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <motion.div
            className={styles.list}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {pageItems.map((u) => (
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
        </>
      )}
    </SectionCard>
  );
}

function ReportedSocietiesTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(reports);

  const navigateToSociety = (societyId) => {
    window.dispatchEvent(
      new CustomEvent("navigate", { detail: `societies_${societyId}` }),
    );
  };

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

  const ban = async (reportId) => {
    const reason = window.prompt(
      "Optional reason to send to the society creator:",
      "",
    );
    if (reason === null) return;

    setBusy(reportId);
    try {
      await banReportedSociety(reportId, reason);
      setReports((prev) => {
        const target = prev.find((r) => r.id === reportId);
        if (!target) return prev.filter((r) => r.id !== reportId);
        return prev.filter((r) => r.society_id !== target.society_id);
      });
    } catch (e) {
      setError(e.message || "Failed to ban society.");
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
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <motion.div
            className={styles.list}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {pageItems.map((r) => (
              <motion.div
                key={r.id}
                className={styles.listRow}
                variants={rowAnim}
                layout
                onClick={() => navigateToSociety(r.society_id)}
                style={{ cursor: "pointer" }}
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
                    className={styles.banBtn}
                    disabled={busy === r.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      ban(r.id);
                    }}
                  >
                    Ban
                  </button>
                  <button
                    className={styles.dismissBtn}
                    disabled={busy === r.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(r.id);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </SectionCard>
  );
}

function CourseChangeRequestsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(items);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchCourseChangeRequests());
    } catch (e) {
      setError(e.message || "Failed to load course change requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (requestId, decision) => {
    setBusy(requestId);
    try {
      await resolveCourseChangeRequest(requestId, decision);
      setItems((prev) => prev.filter((r) => r.id !== requestId));
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
          Course Change Requests{" "}
          <span className={styles.count}>({items.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState message="No pending course change requests." />
      ) : (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <motion.div
            className={styles.list}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {pageItems.map((r) => (
              <motion.div
                key={r.id}
                className={styles.listRow}
                variants={rowAnim}
                layout
              >
                <div className={styles.listInfo}>
                  <span className={styles.listName}>
                    {r.first_name} {r.last_name}
                  </span>
                  <span className={styles.listMeta}>
                    @{r.username} · {r.email}
                  </span>
                  <span className={styles.listMeta}>
                    {r.current_course
                      ? `${r.current_course} → ${r.requested_course}`
                      : `Requesting: ${r.requested_course}`}
                  </span>
                </div>
                <div className={styles.listActions}>
                  <button
                    className={styles.approveBtn}
                    disabled={busy === r.id}
                    onClick={() => decide(r.id, "approve")}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busy === r.id}
                    onClick={() => decide(r.id, "reject")}
                  >
                    ✗ Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
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
          {activeTab === "course-changes" && <CourseChangeRequestsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AdminPage;
