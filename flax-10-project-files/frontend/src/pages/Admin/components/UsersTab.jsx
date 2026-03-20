/** Admin tab for managing all users with filtering, search, and ban functionality. */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchAdminUsers, banUser, unbanUser } from "../../../api/adminApi";
import { useAsyncList, usePaginatedItems, toggleArrayValue, matchesAllUserFilters, USER_FILTER_GROUPS, stagger, rowAnim } from "../hooks/useAdminData";
import { SectionCard, EmptyState, LoadingSpinner, StatusBadge, RoleBadge, SearchBar, FilterToggleGroup, BanModal, CardHeader } from "./AdminUI";
import styles from "../AdminPage.module.css";

function UserTableHeader() {
  return <div className={`${styles.tableRow} ${styles.tableHead}`}><span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span></div>;
}

function UserNameCell({ user, onNavigate }) {
  return (
    <span className={styles.nameCell}>
      <button className={styles.nameBtn} onClick={() => onNavigate?.(`profile_${user.id}`)}>{user.first_name} {user.last_name}<span className={styles.username}>@{user.username}</span></button>
    </span>
  );
}

function UserActionsCell({ user, busy, onBan, onUnban }) {
  if (user.is_staff || user.is_superuser) return <span className={styles.staffBadge}>Staff</span>;
  if (user.is_active) return <button className={styles.banBtn} disabled={busy} onClick={onBan}>Ban</button>;
  return <button className={styles.unbanBtn} disabled={busy} onClick={onUnban}>Unban</button>;
}

function UserRow({ user, busy, onNavigate, onBan, onUnban }) {
  return (
    <motion.div className={styles.tableRow} variants={rowAnim} layout>
      <UserNameCell user={user} onNavigate={onNavigate} />
      <span className={styles.emailCell}>{user.email}</span>
      <span><RoleBadge role={user.role} /></span>
      <span><StatusBadge active={user.is_active} /></span>
      <span className={styles.actionsCell}><UserActionsCell user={user} busy={busy} onBan={onBan} onUnban={onUnban} /></span>
    </motion.div>
  );
}

function UserFilters({ filters, toggleGroup, hasActive, onClear }) {
  return (
    <div className={styles.filterGroupsWrap}>
      <FilterToggleGroup options={USER_FILTER_GROUPS.roles} selected={filters.roles} onToggle={(v) => toggleGroup("roles", v)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup options={USER_FILTER_GROUPS.staff} selected={filters.staff} onToggle={(v) => toggleGroup("staff", v)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup options={USER_FILTER_GROUPS.status} selected={filters.status} onToggle={(v) => toggleGroup("status", v)} />
      {hasActive && <button type="button" className={styles.clearFiltersBtn} onClick={onClear}>Clear filters</button>}
    </div>
  );
}

function useUserFilters(setPage) {
  const [filters, setFilters] = useState({ roles: [], staff: [], status: [] });
  const [search, setSearch] = useState("");
  const toggle = (g, v) => setFilters((p) => ({ ...p, [g]: toggleArrayValue(p[g], v) }));
  const clear = () => setFilters({ roles: [], staff: [], status: [] });
  const hasActive = filters.roles.length > 0 || filters.staff.length > 0 || filters.status.length > 0;
  useEffect(() => { setPage(1); }, [search, filters, setPage]);
  return { filters, search, setSearch, toggle, clear, hasActive };
}

function useUserBan(setUsers, setError) {
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const confirm = (reason) => {
    if (!target) return;
    setBusy(true);
    banUser(target.id, reason).then(() => setUsers((p) => p.map((u) => u.id === target.id ? { ...u, is_active: false, ban_reason: reason } : u))).catch((e) => setError(e.message || "Ban failed.")).finally(() => { setBusy(false); setTarget(null); });
  };
  const unban = (user) => {
    setBusy(true);
    unbanUser(user.id).then(() => setUsers((p) => p.map((u) => u.id === user.id ? { ...u, is_active: true, ban_reason: "" } : u))).catch((e) => setError(e.message || "Unban failed.")).finally(() => setBusy(false));
  };
  return { target, setTarget, busy, confirm, unban };
}

function filterUsers(users, search, filters) {
  return users.filter((u) => `${u.username} ${u.email} ${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) && matchesAllUserFilters(u, filters));
}

function UsersTable({ users, busy, onNavigate, onBan, onUnban, pagination }) {
  return (
    <>
      <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <motion.div className={styles.table} variants={stagger} initial="initial" animate="animate">
        <UserTableHeader />
        <AnimatePresence>{pagination.pageItems.map((u) => <UserRow key={u.id} user={u} busy={busy} onNavigate={onNavigate} onBan={() => onBan(u)} onUnban={() => onUnban(u)} />)}</AnimatePresence>
      </motion.div>
    </>
  );
}

export default function UsersTab({ onNavigate }) {
  const { items: users, setItems: setUsers, loading, error, setError } = useAsyncList(fetchAdminUsers);
  const pagination = usePaginatedItems([]);
  const { filters, search, setSearch, toggle, clear, hasActive } = useUserFilters(pagination.setCurrentPage);
  const ban = useUserBan(setUsers, setError);
  const filtered = useMemo(() => filterUsers(users, search, filters), [users, search, filters]);
  const paginated = usePaginatedItems(filtered);
  return (
    <>
      <SectionCard>
        <CardHeader title="All Users"><div className={styles.headerControls}><UserFilters filters={filters} toggleGroup={toggle} hasActive={hasActive} onClear={clear} /><SearchBar className={styles.searchCompact} value={search} onChange={setSearch} placeholder="Search" /></div></CardHeader>
        {error && <p className={styles.errorMsg}>{error}</p>}
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState message="No users found." /> : <UsersTable users={filtered} busy={ban.busy} onNavigate={onNavigate} onBan={ban.setTarget} onUnban={ban.unban} pagination={paginated} />}
      </SectionCard>
      <AnimatePresence>{ban.target && <BanModal user={ban.target} onConfirm={ban.confirm} onCancel={() => ban.setTarget(null)} />}</AnimatePresence>
    </>
  );
}
