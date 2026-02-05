import { NAV } from "../lib/uiConstants";
import styles from "./Sidebar.module.css";

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
  ].filter(Boolean).join(" ");

  return (
    <button
      onClick={onClick}
      className={cls}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "#faf9fc";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <span className={styles.icon}>{item.icon}</span>
      {!collapsed && <span className={styles.label}>{item.label}</span>}
    </button>
  );
}

function SidebarUserProfile({ collapsed }) {
  return (
    <div className={`${styles.user} ${collapsed ? styles.userCollapsed : styles.userExpanded}`}>
      <div className={styles.avatar}>JS</div>

      {!collapsed && (
        <div className={styles.userText}>
          <div className={styles.userName}>Jane Smith</div>
          <div className={styles.userMeta}>Year 2 · CS</div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ active, onChange, collapsed }) {
  const W = collapsed ? 72 : 224;

  return (
    <aside className={styles.sidebar} style={{ width: W, minWidth: W }}>
      <SidebarHeader collapsed={collapsed} />

      <nav className={styles.nav}>
        {NAV.map((n) => (
          <NavItem
            key={n.id}
            item={n}
            isActive={active === n.id}
            collapsed={collapsed}
            onClick={() => onChange?.(n.id)}
          />
        ))}
      </nav>

      <SidebarUserProfile collapsed={collapsed} />
    </aside>
  );
}
