import styles from "./Topbar.module.css";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import MiniTimer from "../Timer/MiniTimer";
import { Bell, Plus, ChevronDown, Calendar, Clock } from "lucide-react";
import { SegmentedControl } from "../ui/SegmentedControl";
import AnimatedDropdown from "../common/AnimatedDropdown";
import { APP_ROUTES } from "../../lib/routes";
import { motion } from "framer-motion";
import { useState, useRef } from "react";


function BrandLogo({ onNavChange }) {
  return (
    <div className={styles.brandContainer} onClick={() => onNavChange?.("home")} style={{ cursor: "pointer" }}>
      <motion.div className={styles.logoMark} whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} />
      <span className={styles.brandName}>StudyFlax</span>
    </div>
  );
}

function NavDropdownTrigger({ title, isOpen, hasActive, onClick }) {
  const cls = `${styles.navGroupTrigger} ${hasActive ? styles.navGroupTriggerActive : ""}`;
  const iconCls = isOpen ? styles.chevronOpen : styles.chevronClosed;
  return (
    <button className={cls} onClick={onClick}>
      {title}
      <ChevronDown size={14} className={iconCls} />
    </button>
  );
}

function parseRouteOption(r) {
  const label = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span className={styles.dropdownIcon}>{r.icon}</span>
      <span className={styles.dropdownLabel}>{r.label}</span>
    </div>
  );
  return { value: r.id, label };
}

function NavDropdown({ title, routes, activeNav, onNavChange, isOpen, onOpenChange }) {
  const hasActive = routes.some(r => r.id === activeNav);
  const trigger = <NavDropdownTrigger title={title} hasActive={hasActive} />;
  const handleSelect = (nextId) => {
    if (nextId === "modules") {
      window.dispatchEvent(new CustomEvent("modules:show-all"));
    }
    onNavChange?.(nextId);
  };
  return (
    <div className={styles.navGroup}>
      <AnimatedDropdown customTrigger={trigger} options={routes.map(parseRouteOption)}
        value={activeNav} onChange={handleSelect} hideCheckmark={true}
        isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  );
}

const NAV_SECTIONS = [
  { title: "Plan", ids: ["calendar", "tasks", "timer", "analytics", "schedules"] },
  { title: "Study", ids: ["modules", "group-work"] },
  { title: "My KCL", ids: ["map", "societies", "users"] },
  { title: "Admin", ids: ["admin"] }
];

function useTopBarHover() {
  const [activeMenu, setActiveMenu] = useState(null);
  const timeout = useRef(null);
  const onEnter = (id) => { clearTimeout(timeout.current); setActiveMenu(id); };
  const onLeave = () => { timeout.current = setTimeout(() => setActiveMenu(null), 150); };
  const onOpenChange = (id, isOpen) => { if (!isOpen && activeMenu === id) setActiveMenu(null); };
  return { activeMenu, onEnter, onLeave, onOpenChange };
}

function NavSectionItem({ title, ids, routes, activeNav, onNavChange, activeMenu, onEnter, onOpenChange }) {
  const sub = ids
    .map((id) => routes.find((route) => route.id === id))
    .filter(Boolean);
  if (sub.length === 0) return null;
  const change = (v) => onOpenChange(title, v);
  return (
    <div onMouseEnter={() => onEnter(title)}>
      <NavDropdown title={title} routes={sub} activeNav={activeNav} onNavChange={onNavChange}
        isOpen={activeMenu === title} onOpenChange={change} />
    </div>
  );
}

function TopBarNav({ activeNav, onNavChange, user }) {
  const { activeMenu, onEnter, onLeave, onOpenChange } = useTopBarHover();
  const routes = APP_ROUTES.filter(r => r.isAdminOnly ? user?.isAdmin : true);
  return (
    <nav className={styles.navContainer} onMouseLeave={onLeave}>
      {NAV_SECTIONS.map(s => (
        <NavSectionItem key={s.title} {...s} routes={routes} activeNav={activeNav} onNavChange={onNavChange}
          activeMenu={activeMenu} onEnter={onEnter} onOpenChange={onOpenChange} />
      ))}
    </nav>
  );
}

function AddTab({ onAddClick }) {
  const tabs = [{ title: "Add", icon: Plus, autoCollapse: true }];
  return <ExpandableTabs tabs={tabs} onChange={(i) => i !== null && onAddClick?.()} />;
}

function NotifTab() {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [{ title: "Notifications", icon: Bell, badge: unreadCount }];
  return <ExpandableTabs tabs={tabs} onChange={(i) => i !== null && togglePanel()} />;
}

function ActionPill({ onAddClick, onNavChange }) {
  return (
    <div className={styles.actionPill}>
      <AddTab onAddClick={onAddClick} />
      <div className={styles.pillDivider} />
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <NotifTab />
      <NotificationPanel onNavChange={onNavChange} />
    </div>
  );
}

const TOOL_OPTIONS = [
  { value: 'calendar', icon: Calendar, title: 'Calendar' },
  { value: 'timer', icon: Clock, title: 'Timer' },
];

function ToolsPill({ onNavChange, activeNav }) {
  return (
    <SegmentedControl
      options={TOOL_OPTIONS}
      value={activeNav}
      onChange={(val) => onNavChange?.(val)}
    />
  );
}

const TopbarTools = ({ onNavChange, activeNav }) => (
  <div className={styles.toolsWrapper}>
    <MiniTimer onNavigate={onNavChange} activeNav={activeNav} />
    <ToolsPill onNavChange={onNavChange} activeNav={activeNav} />
  </div>
);

function TopBarActions({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  const tools = <TopbarTools onNavChange={onNavChange} activeNav={activeNav} />;
  const action = <ActionPill onAddClick={onAddClick} onNavChange={onNavChange} />;
  const pDrop = <ProfileDropdown user={user} onSettingsClick={onSettingsClick} onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} />;
  return <div className={styles.actions}>{tools}{action}{pDrop}</div>;
}

const TopBarLeftSection = ({ onNavChange, activeNav, user }) => (
  <div className={styles.leftSection}>
    <BrandLogo onNavChange={onNavChange} />
    <TopBarNav activeNav={activeNav} onNavChange={onNavChange} user={user} />
  </div>
);

export default function TopBar({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  const left = <TopBarLeftSection onNavChange={onNavChange} activeNav={activeNav} user={user} />;
  const right = <div className={styles.rightSection}><TopBarActions onAddClick={onAddClick} user={user} onSettingsClick={onSettingsClick} onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} onNavChange={onNavChange} activeNav={activeNav} /></div>;
  return <header className={styles.container}>{left}{right}</header>;
}
