/*
 * Users admin tab.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "../../../components/common/SearchBar/SearchBar";
import { fetchAdminUsers, banUser, unbanUser } from "../../../api/adminApi";
import styles from "../styles";
import { USER_FILTER_GROUPS, USER_LIST_PAGE_SIZE } from "../constants";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { FilterToggleGroup } from "./AdminFilters";
import { CardHeader, EmptyMessage, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";
import { MobileRoleBadge, RoleBadge, StatusBadge } from "./AdminBadges";
import BanUserModal from "./BanUserModal";
import AdminPagination from "./AdminPagination";
import { filterUsers, createEmptyUserFilters, hasActiveUserFilters, toggleArrayValue } from "../utils/userFilters";
import { banUserState, unbanUserState } from "../utils/userState";
import { rowAnim, stagger } from "../utils/adminMotion";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import { navigateToProfile } from "../utils/adminNavigation";

function UserAvatar({ firstName, lastName }) {
  return <div className={styles.userAvatar}>{firstName?.[0]}{lastName?.[0]}</div>;
}

function StaffMarker() {
  return <span className={styles.staffBadge}>Staff</span>;
}

function MobileStaffMarker() {
  return <span className={styles.staffPillBadge}>Staff</span>;
}

function UserNameButton({ onNavigate, user }) {
  return <button className={styles.nameBtn} onClick={() => navigateToProfile(onNavigate, user.id)}>{user.first_name} {user.last_name}<span className={styles.username}>@{user.username}</span></button>;
}

function UserActionButton({ busy, className, label, onClick }) {
  return <button className={className} disabled={busy} onClick={onClick}>{label}</button>;
}

function UserTableHeader() {
  return <div className={`${styles.tableRow} ${styles.tableHead}`}><span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span></div>;
}

function UserDesktopActions({ busy, onBan, onUnban, user }) {
  if (user.is_staff || user.is_superuser) return <StaffMarker />;
  if (user.is_active) return <UserActionButton className={styles.banBtn} busy={busy} label="Ban" onClick={onBan} />;
  return <UserActionButton className={styles.unbanBtn} busy={busy} label="Unban" onClick={onUnban} />;
}

function UserDesktopRow({ busy, onBan, onNavigate, onUnban, user }) {
  return (
    <motion.div className={styles.tableRow} variants={rowAnim} layout>
      <span className={styles.nameCell}><UserNameButton user={user} onNavigate={onNavigate} /></span>
      <span className={styles.emailCell}>{user.email}</span>
      <span><RoleBadge role={user.role} /></span>
      <span><StatusBadge active={user.is_active} /></span>
      <span className={styles.actionsCell}><UserDesktopActions user={user} busy={busy} onBan={onBan} onUnban={onUnban} /></span>
    </motion.div>
  );
}

function UserMobileActions({ busy, onBan, onUnban, user }) {
  if (user.is_staff || user.is_superuser) return <MobileStaffMarker />;
  if (user.is_active) return <UserActionButton className={styles.banPillBtn} busy={busy} label="Ban" onClick={onBan} />;
  return <UserActionButton className={styles.unbanPillBtn} busy={busy} label="Unban" onClick={onUnban} />;
}

function UserMobileRow({ busy, onBan, onUnban, user }) {
  return (
    <motion.div className={styles.userCard} variants={rowAnim} layout>
      <div className={styles.cardInfoMetaBlock}><div className={styles.cardProfile}><UserAvatar firstName={user.first_name} lastName={user.last_name} /><div className={styles.nameHandle}><span className={styles.userName}>{user.first_name} {user.last_name}</span><span className={styles.userHandle}>@{user.username}</span></div></div><div className={styles.metaBadges}><span className={`${styles.statusBadge} ${user.is_active ? styles.active : styles.banned}`}>{user.is_active ? "Active" : "Banned"}</span><MobileRoleBadge role={user.role} /></div></div>
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

function UserFilters({ filters, hasActive, onClear, onToggle }) {
  return (
    <div className={styles.filterGroupsWrap}>
      <FilterToggleGroup options={USER_FILTER_GROUPS.roles} selected={filters.roles} onToggle={(value) => onToggle("roles", value)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup options={USER_FILTER_GROUPS.staff} selected={filters.staff} onToggle={(value) => onToggle("staff", value)} />
      <span className={styles.pillDivider} />
      <FilterToggleGroup options={USER_FILTER_GROUPS.status} selected={filters.status} onToggle={(value) => onToggle("status", value)} />
      {hasActive ? <button type="button" className={styles.clearFiltersBtn} onClick={onClear}>Clear filters</button> : null}
    </div>
  );
}

function UsersHeader({ filters, hasActive, onClear, onSearchChange, onToggle, search }) {
  return (
    <div className={styles.headerControls}>
      <UserFilters filters={filters} hasActive={hasActive} onClear={onClear} onToggle={onToggle} />
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
    </>
  );
}

function useUsersState() {
  const [banTarget, setBanTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(createEmptyUserFilters());
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); setError(""); fetchAdminUsers().then(setUsers).catch((value) => setError(value?.message || "Failed to load users.")).finally(() => setLoading(false)); }, []);
  return { banTarget, busy, error, filters, loading, search, setBanTarget, setBusy, setError, setFilters, setSearch, setUsers, users };
}

export default function UsersTab({ onNavigate }) {
  const state = useUsersState();
  const filteredUsers = useMemo(() => filterUsers(state.users, state.search, state.filters), [state.filters, state.search, state.users]);
  const pagination = usePaginatedItems(filteredUsers, USER_LIST_PAGE_SIZE), hasActive = hasActiveUserFilters(state.filters);
  useEffect(() => { pagination.setCurrentPage(1); }, [pagination.setCurrentPage, state.filters, state.search]);
  const toggleGroup = (group, value) => state.setFilters((current) => ({ ...current, [group]: toggleArrayValue(current[group], value) }));
  const clearFilters = () => state.setFilters(createEmptyUserFilters());
  const confirmBan = (reason) => { if (!state.banTarget) return; state.setBusy(true); banUser(state.banTarget.id, reason).then(() => state.setUsers((users) => banUserState(users, state.banTarget.id, reason))).catch((error) => state.setError(error?.message || "Failed to ban user.")).finally(() => { state.setBanTarget(null); state.setBusy(false); }); };
  const handleUnban = (user) => { state.setBusy(true); unbanUser(user.id).then(() => state.setUsers((users) => unbanUserState(users, user.id))).catch((error) => state.setError(error?.message || "Failed to unban user.")).finally(() => state.setBusy(false)); };
  return (
    <>
      <SectionCard>
        <CardHeader title="All Users"><UsersHeader filters={state.filters} hasActive={hasActive} onClear={clearFilters} onToggle={toggleGroup} search={state.search} onSearchChange={state.setSearch} /></CardHeader>
        <ErrorMessage message={state.error} />
        {state.loading ? <LoadingSpinner /> : filteredUsers.length ? <UsersContent items={filteredUsers} busy={state.busy} onNavigate={onNavigate} onBan={state.setBanTarget} onUnban={handleUnban} pagination={pagination} /> : state.search ? <SearchEmptyState query={state.search} itemLabel="users" /> : <EmptyMessage>No users found.</EmptyMessage>}
      </SectionCard>
      <AnimatePresence>{state.banTarget ? <BanUserModal user={state.banTarget} onConfirm={confirmBan} onCancel={() => state.setBanTarget(null)} /> : null}</AnimatePresence>
    </>
  );
}
