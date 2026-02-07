import { NAV } from "../../constants/uiConstants";
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

// Main Sidebar component that composes the header, navigation, and user profile components, adjusting width based on collapsed state
export default function Sidebar({ active, onChange, collapsed }) {
  const W = collapsed ? 72 : 224;

  return (
    <aside className={styles.sidebar} style={{ width: W, minWidth: W }}>
      <SidebarHeader collapsed={collapsed} />
      <SidebarNav active={active} onChange={onChange} collapsed={collapsed} />
      <SidebarUserProfile collapsed={collapsed} />
    </aside>
  );
}

// Component that renders the navigation items in the sidebar, highlighting the active item and adjusting layout based on collapsed state
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
