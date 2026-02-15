import styles from "./Sidebar.module.css";
import { getInitials } from "../utils/userUtils";
import { APP_ROUTES } from "../lib/routes";
import { getPreferredFirstName } from "../utils/userDisplay";

function SidebarHeader({ collapsed }) {
  return (
    <div className={`${styles.header} ${collapsed ? styles.headerCollapsed : ""}`}>
      {!collapsed && <span className={styles.brand}>StudyFlax</span>}
    </div>
  );
}

function NavItem({ item, isActive, collapsed, onClick }) {
  const cls = [
    styles.navItem,
    collapsed ? styles.navItemCollapsed : styles.navItemExpanded,
    isActive ? styles.navItemActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button onClick={onClick} className={cls}>
      <span className={styles.icon}>{item.icon}</span>
      {!collapsed && <span className={styles.label}>{item.label}</span>}
    </button>
  );
}

function SidebarUserProfile({ collapsed, user }) {
  const firstName = getPreferredFirstName(user); 
  const initials = getInitials(firstName) || "?";
  const year = user?.year ? `Year ${user.year}` : "Year 2";
  const major = user?.major || "CS";

  return (
    <div className={`${styles.user} ${collapsed ? styles.userCollapsed : styles.userExpanded}`}>
      <div className={styles.avatar}>{initials}</div>

      {!collapsed && (
        <div className={styles.userText}>
          <div className={styles.userName}>{firstName}</div> 
          <div className={styles.userMeta}>{year} · {major}</div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ active, onChange, collapsed, user }) {
  const W = collapsed ? 72 : 224;

  return (
    <aside className={styles.sidebar} style={{ width: W, minWidth: W }}>
      <SidebarHeader collapsed={collapsed} />
      <SidebarNav active={active} onChange={onChange} collapsed={collapsed} />
      <SidebarUserProfile collapsed={collapsed} user={user} />
    </aside>
  );
}

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