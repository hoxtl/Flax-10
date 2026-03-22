import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackToTop, Pagination } from "../../components/Pagination/Pagination";
import Badge from "../../components/Common/Badge/Badge";
import SearchBar from "../../components/Common/SearchBar/SearchBar";
import Tabs from "../../components/Common/Tabs/Tabs";
import SearchEmptyState from "../../components/Common/SearchEmptyState/SearchEmptyState";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchCourseChangeRequests,
  fetchTeacherRequests,
  resolveTeacherRequest,
  fetchReportedSocieties,
  dismissReport,
  banReportedSociety,
  fetchPendingRatifications,
  approveRatification,
  rejectRatification,
  resolveCourseChangeRequest,
} from "../../api/admin/adminApi";
import styles from "./AdminPage.module.css";
import AppPage from "../../components/Common/AppPage/AppPage";

const _ = motion;

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

const PAGE_SIZE = 20;
const ADMIN_LIST_PAGE_SIZE = 10;

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
  const [requestedPage, setRequestedPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((items?.length || 0) / pageSize)),
    [items, pageSize],
  );

  const currentPage = Math.min(requestedPage, totalPages);

  const setCurrentPage = useCallback((page) => {
    setRequestedPage(page);
  }, []);

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
    <span
      className={`${styles.badge} ${active ? styles.badgeActive : styles.badgeBanned}`}
    >
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

function FilterToggleGroup({ label, options, selected, onToggle }) {
  void label;
  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterButtons}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <FilterPillButton
              key={opt.value}
              label={opt.label}
              active={active}
              onClick={() => onToggle(opt.value)}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterPillButton({ label, active, onClick }) {
  return (
    <button type="button" className={styles.filterPillButton} onClick={onClick}>
      <Badge
        tone={active ? "default" : "muted"}
        className={active ? styles.filterPillBadgeActive : styles.filterPillBadge}
      >
        {label}
      </Badge>
    </button>
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
    usePaginatedItems(filtered, 10);

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

  const UserAvatar = ({ firstName, lastName }) => (
    <div className={styles.userAvatar}>
      {firstName?.[0]}
      {lastName?.[0]}
    </div>
  );

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
              inputClassName={styles.searchInput}
              value={search}
              onChange={setSearch}
              placeholder="Search users... (/)"
              showShortcutHint={false}
            />
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <SearchEmptyState query={search} itemLabel="users" />
        ) : (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <motion.div
              className={`${styles.table} ${styles.desktopUsersView}`}
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
                    key={`desktop-${u.id}`}
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

            <motion.div
              className={`${styles.list} ${styles.mobileUsersView}`}
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence>
                {pageItems.map((u) => (
                  <motion.div
                    key={`mobile-${u.id}`}
                    className={styles.userCard}
                    variants={rowAnim}
                    layout
                  >
                    <div className={styles.cardInfoMetaBlock}>
                      <div className={styles.cardProfile}>
                        <UserAvatar
                          firstName={u.first_name}
                          lastName={u.last_name}
                        />
                        <div className={styles.nameHandle}>
                          <span className={styles.userName}>
                            {u.first_name} {u.last_name}
                          </span>
                          <span className={styles.userHandle}>
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      <div className={styles.metaBadges}>
                        <span
                          className={`${styles.statusBadge} ${u.is_active ? styles.active : styles.banned}`}
                        >
                          {u.is_active ? "Active" : "Banned"}
                        </span>
                        <MobileRoleBadge role={u.role} />
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      {!u.is_staff &&
                        !u.is_superuser &&
                        (u.is_active ? (
                          <button
                            className={styles.banPillBtn}
                            disabled={busy}
                            onClick={() => setBanTarget(u)}
                          >
                            Ban
                          </button>
                        ) : (
                          <button
                            className={styles.unbanPillBtn}
                            disabled={busy}
                            onClick={() => handleUnban(u)}
                          >
                            Unban
                          </button>
                        ))}
                      {(u.is_staff || u.is_superuser) && (
                        <span className={styles.staffPillBadge}>Staff</span>
                      )}
                    </div>
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

function MobileRoleBadge({ role }) {
  const map = {
    teacher: styles.roleTeacher,
    student: styles.roleStudent,
    pending_teacher: styles.rolePending,
  };
  return (
    <span className={`${styles.roleTag} ${map[role] || styles.roleStudent}`}>
      {role.replace("_", " ")}
    </span>
  );
}

function RatificationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);

  const navigateToSociety = (societyId) => {
    window.dispatchEvent(
      new CustomEvent("navigate", { detail: `societies_${societyId}` }),
    );
  };

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
          Society Ratifications{" "}
          <span className={styles.count}>({items.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <SearchEmptyState title="No societies awaiting ratification" hint="New society ratification requests will appear here." />
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
                onClick={() => navigateToSociety(s.society_id ?? s.id)}
                style={{ cursor: "pointer" }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      decide(s.id, "approve");
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busy === s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      decide(s.id, "reject");
                    }}
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

function TeacherRequestsTab({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);

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
          Teacher Switch Requests{" "}
          <span className={styles.count}>({items.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <SearchEmptyState title="No teacher switch requests" hint="Teacher role requests from students will appear here." />
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
                onClick={() => onNavigate?.(`profile_${u.id}`)}
                style={{ cursor: "pointer" }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      decide(u.id, "approve");
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busy === u.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      decide(u.id, "reject");
                    }}
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
    usePaginatedItems(reports, ADMIN_LIST_PAGE_SIZE);

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
        <SearchEmptyState title="No reported societies" hint="Society reports from users will appear here." />
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

function CourseChangeRequestsTab({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const { currentPage, setCurrentPage, totalPages, pageItems } =
    usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);

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
          Course Switch Requests{" "}
          <span className={styles.count}>({items.length})</span>
        </h2>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <SearchEmptyState title="No course switch requests" hint="Student course change requests will appear here." />
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
                onClick={() => {
                  if (r.user_id) onNavigate?.(`profile_${r.user_id}`);
                }}
                style={{ cursor: r.user_id ? "pointer" : "default" }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      decide(r.id, "approve");
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className={styles.rejectBtn}
                    disabled={busy === r.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      decide(r.id, "reject");
                    }}
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

function AdminPage({ onNavChange, onBack }) {
  const [activeTab, setActiveTab] = useState("users");
  const tabs = [
    { id: "users", icon: "👤", label: "Users Overview", content: <UsersTab onNavigate={onNavChange} /> },
    { id: "ratifications", icon: "🤝", label: "Society Ratifications", content: <RatificationsTab /> },
    { id: "reports", icon: "🚩", label: "Reported Societies", content: <ReportedSocietiesTab /> },
    { id: "course-changes", icon: "📚", label: "Course Switch Requests", content: <CourseChangeRequestsTab onNavigate={onNavChange} /> },
    { id: "teachers", icon: "🧑‍🏫", label: "Teacher Switch Requests", content: <TeacherRequestsTab onNavigate={onNavChange} /> },
  ];
  return (
    <>
      <AppPage
        title={
          <>
            <span className={styles.adminWord}>Admin</span>
            <span className={styles.dashboardWord}> Dashboard</span>
          </>
        }
        subtitle={
          <span className={styles.subtitleText}>
            Manage users, societies and platform requests
          </span>
        }
        onBack={onBack}
        backPlacement="above"
        width="xl"
      >
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} layoutId="admin-tab-underline" />
      </AppPage>
      <BackToTop />
    </>
  );
}

export default AdminPage;
