<<<<<<< HEAD
/*
 * Users admin tab.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import SearchBar from "../../../components/common/search_bar/SearchBar";
import EmptyState from "../../../components/common/empty_state/EmptyState";
import { banUser, unbanUser } from "../../../api/adminApi";
import styles from "../styles";
import { USER_FILTER_GROUPS, USER_LIST_PAGE_SIZE } from "../constants";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { FilterToggleGroup } from "./AdminFilters";
import { CardHeader, EmptyMessage, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";
import { MobileRoleBadge, RoleBadge, StatusBadge } from "./AdminBadges";
import BanUserModal from "./BanUserModal";
import AdminPagination from "./AdminPagination";
import { filterUsers, getUserRoleValue, toggleArrayValue } from "../utils/userFilters";
import { banUserState, unbanUserState } from "../utils/userState";
import { rowAnim, stagger } from "../utils/adminMotion";
import { isProtectedFixtureUser } from "../utils/protectedUsers";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import { navigateToProfile } from "../utils/adminNavigation";
import { useUsersTabState } from "../hooks/useUsersTabState";

function UserAvatar({ firstName, lastName }) {
  return <div className={styles.userAvatar}>{firstName?.[0]}{lastName?.[0]}</div>;
}

function AdminMarker() {
  return <span className={styles.staffBadge}>Admin</span>;
}

function MobileAdminMarker() {
  return <span className={styles.staffPillBadge}>Admin</span>;
}

function ProtectedMarker() {
  return <span className={styles.staffBadge}>Protected</span>;
}

function MobileProtectedMarker() {
  return <span className={styles.staffPillBadge}>Protected</span>;
}

function UserNameButton({ onNavigate, user }) {
  return <button className={styles.nameBtn} onClick={() => navigateToProfile(onNavigate, user.id)}>{user.first_name} {user.last_name}<span className={styles.username}>@{user.username}</span></button>;
}

function UserActionButton({ busy, className, label, onClick }) {
  return <button className={className} disabled={busy} onClick={onClick}>{label}</button>;
}
=======
/** Admin tab for managing all users with filtering, search, and ban functionality. */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchAdminUsers, banUser, unbanUser } from "../../../api/adminApi";
import { useAsyncList, usePaginatedItems, toggleArrayValue, matchesAllUserFilters, USER_FILTER_GROUPS, stagger, rowAnim } from "../hooks/useAdminData";
import { SectionCard, EmptyState, LoadingSpinner, StatusBadge, RoleBadge, SearchBar, FilterToggleGroup, BanModal, CardHeader } from "./AdminUI";
import styles from "../AdminPage.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

function UserTableHeader() {
  return <div className={`${styles.tableRow} ${styles.tableHead}`}><span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span></div>;
}

<<<<<<< HEAD
function UserDesktopActions({ busy, onBan, onUnban, user }) {
  if (user.is_staff || user.is_superuser) return <AdminMarker />;
  if (user.is_active && isProtectedFixtureUser(user)) return <ProtectedMarker />;
  if (user.is_active) return <UserActionButton className={styles.banBtn} busy={busy} label="Ban" onClick={onBan} />;
  return <UserActionButton className={styles.unbanBtn} busy={busy} label="Unban" onClick={onUnban} />;
}

function UserDesktopRow({ busy, onBan, onNavigate, onUnban, user }) {
  return (
    <motion.div className={styles.tableRow} variants={rowAnim} layout>
      <span className={styles.nameCell}><UserNameButton user={user} onNavigate={onNavigate} /></span>
      <span className={styles.emailCell}>{user.email}</span>
      <span><RoleBadge role={getUserRoleValue(user)} /></span>
      <span><StatusBadge active={user.is_active} /></span>
      <span className={styles.actionsCell}><UserDesktopActions user={user} busy={busy} onBan={onBan} onUnban={onUnban} /></span>
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </motion.div>
  );
}

<<<<<<< HEAD
function UserMobileActions({ busy, onBan, onUnban, user }) {
  if (user.is_staff || user.is_superuser) return <MobileAdminMarker />;
  if (user.is_active && isProtectedFixtureUser(user)) return <MobileProtectedMarker />;
  if (user.is_active) return <UserActionButton className={styles.banPillBtn} busy={busy} label="Ban" onClick={onBan} />;
  return <UserActionButton className={styles.unbanPillBtn} busy={busy} label="Unban" onClick={onUnban} />;
}

function UserMobileRow({ busy, onBan, onUnban, user }) {
  return (
    <motion.div className={styles.userCard} variants={rowAnim} layout>
      <div className={styles.cardInfoMetaBlock}><div className={styles.cardProfile}><UserAvatar firstName={user.first_name} lastName={user.last_name} /><div className={styles.nameHandle}><span className={styles.userName}>{user.first_name} {user.last_name}</span><span className={styles.userHandle}>@{user.username}</span></div></div><div className={styles.metaBadges}><span className={`${styles.statusBadge} ${user.is_active ? styles.active : styles.banned}`}>{user.is_active ? "Active" : "Banned"}</span><MobileRoleBadge role={getUserRoleValue(user)} /></div></div>
      <div className={styles.cardActions}><UserMobileActions user={user} busy={busy} onBan={onBan} onUnban={onUnban} /></div>
    </motion.div>
  );
}

function UsersDesktopTable({ busy, items, onBan, onNavigate, onUnban }) {
  return (
    <motion.div className={`${styles.table} ${styles.desktopUsersView}`} variants={stagger} initial="initial" animate="animate">
      <UserTableHeader />
      <AnimatePresence>{items.map((user) => <UserDesktopRow key={`desktop-${user.id}`} user={user} busy={busy} onNavigate={onNavigate} onBan={() => onBan(user)} onUnban={() => onUnban(user)} />)}</AnimatePresence>
    </motion.div>
  );
}

function UsersMobileList({ busy, items, onBan, onUnban }) {
  return (
    <motion.div className={`${styles.list} ${styles.mobileUsersView}`} variants={stagger} initial="initial" animate="animate">
      <AnimatePresence>{items.map((user) => <UserMobileRow key={`mobile-${user.id}`} user={user} busy={busy} onBan={() => onBan(user)} onUnban={() => onUnban(user)} />)}</AnimatePresence>
    </motion.div>
  );
}

function UserFilters({ filters, onToggle }) {
  return (
    <div className={styles.filterGroupsWrap}>
      <FilterToggleGroup ariaLabel="Filter users by role" options={USER_FILTER_GROUPS.roles} selected={filters.roles} onToggle={(value) => onToggle("roles", value)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup ariaLabel="Filter users by status" options={USER_FILTER_GROUPS.status} selected={filters.status} onToggle={(value) => onToggle("status", value)} />
=======
function UserFilters({ filters, toggleGroup, hasActive, onClear }) {
  return (
    <div className={styles.filterGroupsWrap}>
      <FilterToggleGroup options={USER_FILTER_GROUPS.roles} selected={filters.roles} onToggle={(v) => toggleGroup("roles", v)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup options={USER_FILTER_GROUPS.staff} selected={filters.staff} onToggle={(v) => toggleGroup("staff", v)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup options={USER_FILTER_GROUPS.status} selected={filters.status} onToggle={(v) => toggleGroup("status", v)} />
      {hasActive && <button type="button" className={styles.clearFiltersBtn} onClick={onClear}>Clear filters</button>}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}

<<<<<<< HEAD
function UsersHeader({ filters, onSearchChange, onToggle, search }) {
  return (
    <div className={styles.headerControls}>
      <UserFilters filters={filters} onToggle={onToggle} />
      <SearchBar className={styles.searchCompact} inputClassName={styles.searchInput} value={search} onChange={onSearchChange} placeholder="Search users... (/)" showShortcutHint={false} />
    </div>
  );
}

function UsersContent({ busy, items, onBan, onNavigate, onUnban, pagination }) {
  return (
    <>
      <AdminPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <UsersDesktopTable items={pagination.pageItems} busy={busy} onNavigate={onNavigate} onBan={onBan} onUnban={onUnban} />
      <UsersMobileList items={pagination.pageItems} busy={busy} onBan={onBan} onUnban={onUnban} />
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </>
  );
}

export default function UsersTab({ onNavigate }) {
<<<<<<< HEAD
  const viewModel = useUsersTabViewModel();
  return <UsersTabLayout {...viewModel} onNavigate={onNavigate} />;
}

function useUsersTabViewModel() {
  const state = useUsersTabState();
  const filteredUsers = useFilteredUsers(state);
  const pagination = useUsersPagination(filteredUsers);
  useResetPageOnFilterChange(pagination.setCurrentPage, state.filters, state.search);
  return {
    state,
    filteredUsers,
    pagination,
    toggleGroup: (group, value) => toggleFilterGroup(state.setFilters, group, value),
    confirmBan: (reason) => confirmBanHandler(state, reason),
    handleUnban: (user) => unbanHandler(state, user),
  };
}

function useFilteredUsers(state) {
  return useMemo(() => filterUsers(state.users, state.search, state.filters), [state.filters, state.search, state.users]);
}

function useUsersPagination(filteredUsers) {
  return usePaginatedItems(filteredUsers, USER_LIST_PAGE_SIZE);
}

function useResetPageOnFilterChange(setPage, filters, search) {
  useEffect(() => { setPage(1); }, [setPage, filters, search]);
}

function toggleFilterGroup(setFilters, group, value) {
  setFilters((current) => ({ ...current, [group]: toggleArrayValue(current[group], value) }));
}

function confirmBanHandler(state, reason) {
  const trimmedReason = reason.trim();
  if (!state.banTarget || !trimmedReason) return;
  state.setBusy(true);
  banUser(state.banTarget.id, trimmedReason)
    .then(() => state.setUsers((users) => banUserState(users, state.banTarget.id, trimmedReason)))
    .catch((error) => state.setError(error?.message || "Failed to ban user."))
    .finally(() => {
      state.setBanTarget(null);
      state.setBusy(false);
    });
}

function unbanHandler(state, user) {
  state.setBusy(true);
  unbanUser(user.id)
    .then(() => state.setUsers((users) => unbanUserState(users, user.id)))
    .catch((error) => state.setError(error?.message || "Failed to unban user."))
    .finally(() => state.setBusy(false));
}

function UsersTabLayout({ state, filteredUsers, pagination, toggleGroup, confirmBan, handleUnban, onNavigate }) {
  return (
    <>
      <SectionCard>
        <CardHeader title="All Users">
          <UsersHeader filters={state.filters} onToggle={toggleGroup} search={state.search} onSearchChange={state.setSearch} />
        </CardHeader>
        <ErrorMessage message={state.error} />
        {renderUsersBody({ state, filteredUsers, pagination, onNavigate, handleUnban })}
      </SectionCard>
      <AnimatePresence>{renderBanModal(state, confirmBan)}</AnimatePresence>
    </>
  );
}

function renderUsersBody({ state, filteredUsers, pagination, onNavigate, handleUnban }) {
  if (state.loading) return <LoadingSpinner />;
  if (filteredUsers.length) {
    return (
      <UsersContent
        items={filteredUsers}
        busy={state.busy}
        onNavigate={onNavigate}
        onBan={state.setBanTarget}
        onUnban={handleUnban}
        pagination={pagination}
      />
    );
  }
  if (state.search) return <SearchEmptyState query={state.search} itemLabel="users" />;
  return <EmptyState icon="👥" title="No users found" description="New accounts will appear here once people join the platform." />;
}

function renderBanModal(state, confirmBan) {
  if (!state.banTarget) return null;
  return <BanUserModal user={state.banTarget} onConfirm={confirmBan} onCancel={() => state.setBanTarget(null)} />;
}
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
