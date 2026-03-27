/*
 * Dashboard top navigation bar.
 */

import styles from "./Topbar.module.css";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../notifications/NotificationPanel";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import MiniTimer from "../timer/MiniTimer";
import {
  Bell,
  BookOpen,
  ChevronDown,
  Calendar,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { SegmentedControl } from "../common";
import AnimatedDropdown from "../common/animated_dropdown";
import { APP_ROUTES } from "../../lib/routes";
import { motion as Motion } from "framer-motion";
import { useState, useRef } from "react";


function BrandLogo({ onNavChange }) {
  return (
    <div data-tour="home" className={styles.brandContainer} onClick={() => onNavChange?.("home")} style={{ cursor: "pointer" }}>
      <Motion.div className={styles.logoMark} whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} />
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

function parseRouteOption(r, user) {
  const isTeacher = user?.role === "teacher";
  const routeLabel = isTeacher && r.teacherLabel ? r.teacherLabel : r.label;
  const label = (
    <div className={styles.dropdownLabelRow}>
      <span className={styles.dropdownIcon}>{r.icon}</span>
      <span className={styles.dropdownLabel}>{routeLabel}</span>
    </div>
  );
  return { value: r.id, label };
}

function buildNavDropdownOptions(routes, user) {
  return routes.map(r => parseRouteOption(r, user));
}

function handleNavSelection(nextId, onNavChange) {
  if (nextId === "modules") window.dispatchEvent(new CustomEvent("modules:show-all"));
  onNavChange?.(nextId);
}

function NavDropdownMenu(props) {
  return (
    <AnimatedDropdown
      customTrigger={<NavDropdownTrigger title={props.title} hasActive={props.routes.some((route) => route.id === props.activeNav)} />}
      options={buildNavDropdownOptions(props.routes, props.user)}
      value={props.activeNav}
      onChange={(nextId) => handleNavSelection(nextId, props.onNavChange)}
      hideCheckmark={true}
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      usePortal={props.usePortal}
    />
  );
}

function NavDropdown({ title, routes, activeNav, onNavChange, isOpen, onOpenChange, usePortal, user }) {
  return (
    <div className={styles.navGroup}>
      <NavDropdownMenu title={title} routes={routes} activeNav={activeNav} onNavChange={onNavChange} isOpen={isOpen} onOpenChange={onOpenChange} usePortal={usePortal} user={user} />
    </div>
  );
}

const NAV_SECTIONS = [
  { title: "Plan", ids: ["calendar", "tasks"], tourIds: ["calendar"] },
  { title: "Study", ids: ["modules", "group-work", "timer"], tourIds: ["timer"] },
  { title: "Explore", ids: ["map", "societies", "users"], tourIds: ["societies"] },
  { title: "My Insights", ids: ["analytics", "attendance"], tourIds: ["analytics", "attendance"] },
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

function NavSectionItem({ title, ids, tourIds = [], routes, activeNav, onNavChange, activeMenu, onEnter, onOpenChange, user }) {
  const isTeacher = user?.role === "teacher";
  const displayTitle = isTeacher && title === "Study" ? "Teaching" : title;
  const sub = ids
    .map((id) => routes.find((route) => route.id === id))
    .filter(Boolean);
  if (sub.length === 0) return null;
  const change = (v) => onOpenChange(title, v);
  return (
    <div data-tour={tourIds[0] || undefined} style={{ position: "relative" }} onMouseEnter={() => onEnter(title)}>
      {tourIds.slice(1).map((tid) => (
        <span key={tid} data-tour={tid} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      ))}
      <NavDropdown title={displayTitle} routes={sub} activeNav={activeNav} onNavChange={onNavChange}
        isOpen={activeMenu === title} onOpenChange={change} usePortal={true} user={user} />
    </div>
  );
}

function isRouteVisible(route, user) {
  if (route.isAdminOnly && !user?.isAdmin) return false;
  if (route.studentOnly && user?.role === "teacher") return false;
  return true;
}

function TopBarNav({ activeNav, onNavChange, user }) {
  const { activeMenu, onEnter, onLeave, onOpenChange } = useTopBarHover();
  const routes = APP_ROUTES.filter(r => isRouteVisible(r, user));
  return (
    <nav className={styles.navContainer} onMouseLeave={onLeave}>
      {NAV_SECTIONS.map(s => (
        <NavSectionItem key={s.title} {...s} routes={routes} activeNav={activeNav} onNavChange={onNavChange}
          activeMenu={activeMenu} onEnter={onEnter} onOpenChange={onOpenChange} user={user} />
      ))}
    </nav>
  );
}

function NotifTab() {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [{ title: "Notifications", icon: Bell, badge: unreadCount }];
  return <ExpandableTabs tabs={tabs} onChange={(i) => i !== null && togglePanel()} />;
}

function ActionPill({ onNavChange }) {
  const openQuickActions = () => window.dispatchEvent(new CustomEvent("quick-actions:open"));
  return (
    <div className={styles.actionPill}>
      <button type="button" className={styles.quickActionsBtn} onClick={openQuickActions}>
        Quick actions
        <span className={styles.quickActionsKey}>/</span>
      </button>
      <div className={styles.pillDivider} />
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <NotifTab />
      <NotificationPanel onNavChange={onNavChange} />
    </div>
  );
}

const STUDENT_TOOL_OPTIONS = [
  { value: 'calendar', icon: Calendar, title: 'Calendar' },
  { value: 'timer', icon: Clock, title: 'Timer' },
  { value: 'attendance', icon: ClipboardCheck, title: 'Record my attendance' },
];

const TEACHER_TOOL_OPTIONS = [
  { value: 'calendar', icon: Calendar, title: 'Calendar' },
  { value: 'timer', icon: Clock, title: 'Timer' },
  { value: 'modules', icon: BookOpen, title: 'Manage my modules' },
];

function ToolsPill({ onNavChange, activeNav, user }) {
  const isTeacher = user?.role === "teacher";
  const options = isTeacher ? TEACHER_TOOL_OPTIONS : STUDENT_TOOL_OPTIONS;
  return (
    <SegmentedControl
      options={options}
      value={activeNav}
      onChange={(val) => onNavChange?.(val)}
      tooltipPosition="bottom"
    />
  );
}

const TopbarTools = ({ onNavChange, activeNav, user }) => (
  <div className={styles.toolsWrapper}>
    <MiniTimer onNavigate={onNavChange} activeNav={activeNav} />
    <ToolsPill onNavChange={onNavChange} activeNav={activeNav} user={user} />
  </div>
);

function TopBarActions({ user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  const tools = <TopbarTools onNavChange={onNavChange} activeNav={activeNav} user={user} />;
  const action = <ActionPill onNavChange={onNavChange} />;
  const pDrop = <ProfileDropdown user={user} onSettingsClick={onSettingsClick} onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} />;
  return <div className={styles.actions}>{tools}{action}{pDrop}</div>;
}

const TopBarLeftSection = ({ onNavChange, activeNav, user }) => (
  <div className={styles.leftSection}>
    <BrandLogo onNavChange={onNavChange} />
    <TopBarNav activeNav={activeNav} onNavChange={onNavChange} user={user} />
  </div>
);

export default function TopBar({ user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  const left = <TopBarLeftSection onNavChange={onNavChange} activeNav={activeNav} user={user} />;
  const right = <div className={styles.rightSection}><TopBarActions user={user} onSettingsClick={onSettingsClick} onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} onNavChange={onNavChange} activeNav={activeNav} /></div>;
  return <header className={styles.container}>{left}{right}</header>;
}
