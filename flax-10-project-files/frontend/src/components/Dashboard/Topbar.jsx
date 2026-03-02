import styles from "./Topbar.module.css";
import { DAYS, MONTHS } from "../../lib/uiConstants";
import { getGreeting } from "../Calendar/utils/dateUtils";
import ProfileDropdown from "./ProfileDropdown";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "../Notifications/NotificationPanel";
import { getDisplayName } from "../Authentication/utils/userDisplay";
import { ExpandableTabs } from "./ExpandableTabs";
import ThemeToggle from "./ThemeToggle";
import MiniTimer from "../Timer/MiniTimer";
import { Bell, Plus, ChevronDown, Calendar, Timer } from "lucide-react";
import { TypingAnimation } from "./TypingAnimation";
import { APP_ROUTES } from "../../lib/routes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

function getFirstName(user) {
  const displayName = (getDisplayName(user) || "").trim();
  return displayName ? displayName.split(" ")[0] : "";
}

function getCurrentDateString() {
  const now = new Date();
  return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

function TopBarGreeting({ user }) {
  const firstName = getFirstName(user);
  return (
    <div className={styles.greeting}>
      <span className={styles.subGreeting}>{getGreeting()}!</span>
      <div className={styles.nameRow}>
        {!!firstName && (
          <h1 className={styles.name}>
            <TypingAnimation text={firstName} duration={180} />
          </h1>
        )}
        <span className={styles.date}>{getCurrentDateString()}</span>
      </div>
    </div>
  );
}

function BrandLogo({ onNavChange }) {
  return (
    <div
      className={styles.brandContainer}
      onClick={() => onNavChange?.("home")}
      style={{ cursor: "pointer" }}
    >
      <motion.div
        className={styles.logoMark}
        whileHover={{ rotate: 8, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      />
      <span className={styles.brandName}>StudyFlax</span>
    </div>
  );
}

function NavDropdown({ title, routes, activeNav, onNavChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveItem = routes.some(r => r.id === activeNav);

  return (
    <div className={styles.navGroup} ref={dropdownRef}>
      <button
        className={`${styles.navGroupTrigger} ${hasActiveItem ? styles.navGroupTriggerActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown size={14} className={isOpen ? styles.chevronOpen : styles.chevronClosed} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdownMenu}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {routes.map((n) => {
              const isActive = activeNav === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    onNavChange?.(n.id);
                    setIsOpen(false);
                  }}
                  className={`${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ""}`}
                >
                  <span className={styles.dropdownIcon}>{n.icon}</span>
                  <span className={styles.dropdownLabel}>{n.label}</span>
                  {isActive && (
                    <motion.div
                      className={styles.dropdownActivePill}
                      layoutId="topbarDropdownPill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopBarNav({ activeNav, onNavChange, user }) {
  const routes = APP_ROUTES.filter(route => route.isAdminOnly ? user?.isAdmin : true);

  const academicRoutes = routes.filter(r => ["modules"].includes(r.id));
  const planningRoutes = routes.filter(r => ["analytics"].includes(r.id));
  const campusRoutes = routes.filter(r => ["map"].includes(r.id));
  const socialRoutes = routes.filter(r => ["discover", "societies"].includes(r.id));
  const adminRoutes = routes.filter(r => ["admin"].includes(r.id));

  return (
    <nav className={styles.navContainer}>
      {planningRoutes.length > 0 && <NavDropdown title="Planning" routes={planningRoutes} activeNav={activeNav} onNavChange={onNavChange} />}
      {academicRoutes.length > 0 && <NavDropdown title="Academic" routes={academicRoutes} activeNav={activeNav} onNavChange={onNavChange} />}
      {campusRoutes.length > 0 && <NavDropdown title="Campus" routes={campusRoutes} activeNav={activeNav} onNavChange={onNavChange} />}
      {socialRoutes.length > 0 && <NavDropdown title="Social" routes={socialRoutes} activeNav={activeNav} onNavChange={onNavChange} />}
      {adminRoutes.length > 0 && <NavDropdown title="Admin" routes={adminRoutes} activeNav={activeNav} onNavChange={onNavChange} />}
    </nav>
  );
}

function QuickTabs({ onAddClick }) {
  const { togglePanel, notifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const tabs = [
    { title: "Add", icon: Plus, autoCollapse: true },
    { type: "separator" },
    { title: "Notifications", icon: Bell, badge: unreadCount },
  ];
  const handleChange = (index) => {
    if (index === 0) onAddClick?.();
    if (index === 2) togglePanel();
  };
  return <ExpandableTabs tabs={tabs} onChange={handleChange} />;
}

function ActionPill({ onAddClick }) {
  return (
    <div className={styles.actionPill}>
      <ThemeToggle />
      <div className={styles.pillDivider} />
      <QuickTabs onAddClick={onAddClick} />
      <NotificationPanel />
    </div>
  );
}

function TopBarTool({ icon: Icon, onClick, isActive, title }) {
  return (
    <button
      className={`${styles.toolBtn} ${isActive ? styles.toolBtnActive : ""}`}
      onClick={onClick}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}

function TopBarActions({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  return (
    <div className={styles.actions}>
      <TopBarTool icon={Calendar} onClick={() => onNavChange?.('calendar')} isActive={activeNav === 'calendar'} title="Calendar" />
      <TopBarTool icon={Timer} onClick={() => onNavChange?.('timer')} isActive={activeNav === 'timer'} title="Timer" />
      <MiniTimer onNavigate={onNavChange} activeNav={activeNav} />
      <ActionPill onAddClick={onAddClick} />
      <ProfileDropdown
        user={user}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}

export default function TopBar({ onAddClick, user, onSettingsClick, onLogoutClick, onProfileClick, onNavChange, activeNav }) {
  return (
    <header className={styles.container}>
      <div className={styles.leftSection}>
        <BrandLogo onNavChange={onNavChange} />
        <TopBarNav activeNav={activeNav} onNavChange={onNavChange} user={user} />
      </div>

      <div className={styles.rightSection}>
        <TopBarGreeting user={user} />
        <TopBarActions
          onAddClick={onAddClick}
          user={user}
          onSettingsClick={onSettingsClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          onNavChange={onNavChange}
          activeNav={activeNav}
        />
      </div>
    </header>
  );
}
