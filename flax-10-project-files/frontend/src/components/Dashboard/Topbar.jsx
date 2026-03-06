import styles from "./Topbar.module.css";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import MiniTimer from "../Timer/MiniTimer";
import { Bell, Plus, ChevronDown } from "lucide-react";
import { APP_ROUTES } from "../../lib/routes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";


function BrandLogo({ onNavChange }) {
  const nav = () => onNavChange?.("home");
  return (
    <div className={styles.brandContainer} onClick={() => onNavChange?.("home")} style={{ cursor: "pointer" }}>
      <motion.div className={styles.logoMark} whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} />
      <span className={styles.brandName}>StudyFlax</span>
    </div>
  );
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => ref.current && !ref.current.contains(event.target) && handler(event);
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function DropdownItem({ item, isActive, onClick }) {
  const cls = `${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ""}`;
  const pill = <motion.div className={styles.dropdownActivePill} layoutId="topbarDropdownPill" transition={{ type: "spring", stiffness: 380, damping: 30 }} />;
  return (
    <button onClick={onClick} className={cls}>
      <span className={styles.dropdownIcon}>{item.icon}</span>
      <span className={styles.dropdownLabel}>{item.label}</span>
      {isActive && pill}
    </button>
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

function NavDropdownMenu({ routes, activeNav, onNavChange, setIsOpen }) {
  const click = (id) => { onNavChange?.(id); setIsOpen(false); };
  return (
    <motion.div className={styles.dropdownMenu} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
      {routes.map(r => <DropdownItem key={r.id} item={r} isActive={activeNav === r.id} onClick={() => click(r.id)} />)}
    </motion.div>
  );
}

function NavDropdown({ title, routes, activeNav, onNavChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null), timeout = useRef(null);
  useClickOutside(ref, () => setIsOpen(false));
  const hasActive = routes.some(r => r.id === activeNav);
  const enter = () => { clearTimeout(timeout.current); setIsOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setIsOpen(false), 150); };
  const menu = <NavDropdownMenu routes={routes} activeNav={activeNav} onNavChange={onNavChange} setIsOpen={setIsOpen} />;
  return (
    <div className={styles.navGroup} ref={ref} onMouseEnter={enter} onMouseLeave={leave}>
      <NavDropdownTrigger title={title} isOpen={isOpen} hasActive={hasActive} onClick={() => setIsOpen(!isOpen)} />
      <AnimatePresence>{isOpen && menu}</AnimatePresence>
    </div>
  );
}

const NAV_SECTIONS = [
  { title: "Planning", ids: ["calendar", "timer", "analytics", "schedules"] },
  { title: "Academic", ids: ["modules"] }, { title: "Campus", ids: ["map"] },
  { title: "Social", ids: ["users", "societies"] }, { title: "Admin", ids: ["admin"] }
];

function TopBarNav({ activeNav, onNavChange, user }) {
  const routes = APP_ROUTES.filter(r => r.isAdminOnly ? user?.isAdmin : true);
  const getSub = (ids) => routes.filter(r => ids.includes(r.id));
  return (
    <nav className={styles.navContainer}>
      {NAV_SECTIONS.map(s => getSub(s.ids).length > 0 && <NavDropdown key={s.title} title={s.title} routes={getSub(s.ids)} activeNav={activeNav} onNavChange={onNavChange} />)}
    </nav>
  );
}

function QuickTabs({ onAddClick }) {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [{ title: "Add", icon: Plus, autoCollapse: true }, { type: "separator" }, { title: "Notifications", icon: Bell, badge: unreadCount }];
  const change = (i) => i === 0 ? onAddClick?.() : i === 2 && togglePanel();
  return <ExpandableTabs tabs={tabs} onChange={change} />;
}

function ActionPill({ onAddClick, onNavChange }) {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <QuickTabs onAddClick={onAddClick} />
      <NotificationPanel onNavChange={onNavChange} />
    </div>
  );
}

const NavIcon = ({ d, styles }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={styles.toolIcon}>
    {d}
  </svg>
);

function ToolsPill({ onNavChange, activeNav }) {
  const [cA, tA] = [activeNav === 'calendar', activeNav === 'timer'];
  const cD = <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>;
  const tD = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>;
  const click = (id) => onNavChange?.(id);
  return (
    <div className={styles.actionPill}>
      <button className={`${styles.toolBtn} ${cA ? styles.toolBtnActive : ""}`} onClick={() => click('calendar')} title="Calendar"><NavIcon d={cD} styles={styles} /></button>
      <button className={`${styles.toolBtn} ${tA ? styles.toolBtnActive : ""}`} onClick={() => click('timer')} title="Timer"><NavIcon d={tD} styles={styles} /></button>
    </div>
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
