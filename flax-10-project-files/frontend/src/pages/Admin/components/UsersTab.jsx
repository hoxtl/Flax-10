/*
 * Users admin tab.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import SearchBar from "../../../components/common/SearchBar/SearchBar";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
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
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
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

function UserTableHeader() {
  return <div className={`${styles.tableRow} ${styles.tableHead}`}><span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span></div>;
}

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
    </motion.div>
  );
}

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
    </div>
  );
}

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
    </>
  );
}

export default function UsersTab({ onNavigate }) {
  const state = useUsersTabState();
  const filteredUsers = useMemo(() => filterUsers(state.users, state.search, state.filters), [state.filters, state.search, state.users]);
  const pagination = usePaginatedItems(filteredUsers, USER_LIST_PAGE_SIZE);
  useEffect(() => { pagination.setCurrentPage(1); }, [pagination.setCurrentPage, state.filters, state.search]);
  const toggleGroup = (group, value) => state.setFilters((current) => ({ ...current, [group]: toggleArrayValue(current[group], value) }));
  const confirmBan = (reason) => {
    const trimmedReason = reason.trim();
    if (!state.banTarget || !trimmedReason) return;
    state.setBusy(true);
    banUser(state.banTarget.id, trimmedReason)
      .then(() => state.setUsers((users) => banUserState(users, state.banTarget.id, trimmedReason)))
      .catch((error) => state.setError(error?.message || "Failed to ban user."))
      .finally(() => { state.setBanTarget(null); state.setBusy(false); });
  };
  const handleUnban = (user) => { state.setBusy(true); unbanUser(user.id).then(() => state.setUsers((users) => unbanUserState(users, user.id))).catch((error) => state.setError(error?.message || "Failed to unban user.")).finally(() => state.setBusy(false)); };
  return (
    <>
      <SectionCard>
        <CardHeader title="All Users"><UsersHeader filters={state.filters} onToggle={toggleGroup} search={state.search} onSearchChange={state.setSearch} /></CardHeader>
        <ErrorMessage message={state.error} />
        {state.loading ? <LoadingSpinner /> : filteredUsers.length ? <UsersContent items={filteredUsers} busy={state.busy} onNavigate={onNavigate} onBan={state.setBanTarget} onUnban={handleUnban} pagination={pagination} /> : state.search ? <SearchEmptyState query={state.search} itemLabel="users" /> : <EmptyState icon="👥" title="No users found" description="New accounts will appear here once people join the platform." />}
      </SectionCard>
      <AnimatePresence>{state.banTarget ? <BanUserModal user={state.banTarget} onConfirm={confirmBan} onCancel={() => state.setBanTarget(null)} /> : null}</AnimatePresence>
    </>
  );
}
