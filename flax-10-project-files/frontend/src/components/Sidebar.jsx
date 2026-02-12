import { NAV } from "../lib/uiConstants";
import styles from "./Sidebar.module.css";
import { getInitials } from "../utils/userUtils";
import { APP_ROUTES } from "../lib/routes";

// Header component that displays the app name and adjusts styling based on collapsed state
function SidebarHeader({ collapsed }) {
  return (
    <div className={`${styles.header} ${collapsed ? styles.headerCollapsed : ""}`}>
      {!collapsed && <span className={styles.brand}>StudyFlax</span>}
    </div>
  );
}

// Component for each navigation item in the sidebar
function NavItem({ item, isActive, collapsed, onClick }) {
  const cls = [
    styles.navItem,
    collapsed ? styles.navItemCollapsed : styles.navItemExpanded,
    isActive ? styles.navItemActive : "",
  ].filter(Boolean).join(" ");

  return (
    <button onClick={onClick} className={cls}>
      <span className={styles.icon}>{item.icon}</span>
      {!collapsed && <span className={styles.label}>{item.label}</span>}
    </button>
  );
}

// Profile button that redirects user to their profile
function ProfileButton({ onClick, collapsed, isActive }) {
  const cls = [
    styles.navItem,
    collapsed ? styles.navItemCollapsed : styles.navItemExpanded,
    isActive ? styles.navItemActive : "",
  ].filter(Boolean).join(" ");

  return (
    <button onClick={onClick} className={cls}>
      <span className={styles.icon}>👤</span>
      {!collapsed && <span className={styles.label}>Profile</span>}
    </button>
  );
}

// User profile component that displays the user's initials, name, year, and major, adjusting layout based on collapsed state
function SidebarUserProfile({ collapsed, user }) {
  const initials = getInitials(user?.name) || "?";
  const year = user?.year || "Year 2";
  const major = user?.major || "CS";

  return (
    <div className={`${styles.user} ${collapsed ? styles.userCollapsed : styles.userExpanded}`}>
      <div className={styles.avatar}>{initials}</div>

      {!collapsed && (
        <div className={styles.userText}>
          <div className={styles.userName}>{user?.name || "Guest"}</div>
          <div className={styles.userMeta}>{year} · {major}</div>
        </div>
      )}
    </div>
  );
}

// Component that renders the navigation items in the sidebar
function SidebarNav({ active, onChange, collapsed }) {
  return (
    <nav className={styles.nav}>
      {APP_ROUTES.map((n) => (
        <NavItem
          key={n.id}
          item={n}
          isActive={active === n.id}
          collapsed={collapsed}
          onClick={() => onChange?.(n.id)}
        />
      ))}
    </nav>
  );
}

// Main Sidebar component
export default function Sidebar({ user, active, onChange, collapsed }) {
  const handleProfileClick = () => {
    onChange?.("profile");
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <SidebarHeader collapsed={collapsed} />
      <SidebarNav active={active} onChange={onChange} collapsed={collapsed} />
      <div className={styles.sidebarFooter}>
      <ProfileButton onClick={handleProfileClick} collapsed={collapsed} />
        <SidebarUserProfile user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}