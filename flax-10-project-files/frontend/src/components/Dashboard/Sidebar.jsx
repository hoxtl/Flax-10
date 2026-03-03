import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { APP_ROUTES } from "../../lib/routes";
import { getUpcomingDeadlines } from "../../api/deadlineApi";

import styles from "./Sidebar.module.css";

const EXPANDED_W = 224;
const COLLAPSED_W = 72;
const NAV_SPRING = { type: "spring", stiffness: 400, damping: 25 };
const SIDEBAR_SPRING = { type: "spring", stiffness: 280, damping: 30 };
const LOGO_SPRING = { type: "spring", stiffness: 400, damping: 20 };

const EXPANDED_W = 224;
const COLLAPSED_W = 72;
const NAV_SPRING = { type: "spring", stiffness: 400, damping: 25 };
const SIDEBAR_SPRING = { type: "spring", stiffness: 280, damping: 30 };
const LOGO_SPRING = { type: "spring", stiffness: 400, damping: 20 };

const PRESSURE_ROUTE_IDS = ["tasks", "home"];
const MS_48H = 48 * 60 * 60 * 1000;

function hasDeadlineWithin48Hours(deadlines) {
  if (!Array.isArray(deadlines) || deadlines.length === 0) return false;
  const now = Date.now();
  return deadlines.some((d) => {
    const due = d.start_due_date ? new Date(d.start_due_date).getTime() : NaN;
    return Number.isFinite(due) && due - now > 0 && due - now < MS_48H;
  });
}

function UserFooter({ user, open, onSettings, onLogout, onProfile, isMobile }) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setShowMenu(false);
  }, [open]);

  return (
    <div className={styles.sidebarFooter}>
      <AnimatePresence>
        {showMenu && (
          <>
            <div
              className={styles.menuBackdrop}
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              className={styles.userMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{
                type: "tween",
                ease: "easeOut",
                duration: 0.2,
                exit: { duration: 0.13 },
                scale: 0.5,
              }}
            >
              <button onClick={onProfile}>Profile</button>
              <button onClick={onSettings}>Settings</button>
              <div className={styles.menuDivider} />
              <button onClick={onLogout} className={styles.logoutBtn}>
                Log out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        className={`${styles.userRow} ${open ? styles.userRowExpanded : styles.userRowCollapsed}`}
        onClick={() => setShowMenu(!showMenu)}
      >
        <div className={styles.avatar}>{user?.name?.charAt(0) || "U"}</div>
        {open && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        )}
      </button>
    </div>
  );
}

function Hamburger({ onClick }) {
  return (
    <button className={styles.hamburger} onClick={onClick}>
      <div className={styles.hamburgerLine} />
      <div className={styles.hamburgerLine} />
      <div className={styles.hamburgerLine} />
    </button>
  );
}

function LogoMark({ sidebarHovered }) {
  return (
    <motion.div
      className={styles.logoMark}
      animate={{
        rotate: sidebarHovered ? 8 : 0,
        scale: sidebarHovered ? 1.08 : 1,
      }}
      transition={LOGO_SPRING}
    />
  );
}

function BrandName() {
  return (
    <motion.span
      className={styles.brand}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.18 }}
    >
      StudyFlax
    </motion.span>
  );
}

function SidebarHeader({ open, isMobile, onToggle }) {
  return (
    <div className={styles.header}>
      {isMobile ? <Hamburger onClick={onToggle} /> : <LogoMark sidebarHovered={open} />}
      <AnimatePresence>{open && <BrandName />}</AnimatePresence>
    </div>
  );
}

function NavLabel({ label }) {
  return (
    <motion.span
      className={styles.label}
      initial={{ opacity: 0, x: -4, width: 0 }}
      animate={{ opacity: 1, x: 0, width: "auto" }}
      exit={{ opacity: 0, x: -4, width: 0 }}
      transition={{ duration: 0.16 }}
    >
      {label}
    </motion.span>
  );
}

function ActivePill() {
  return (
    <motion.span
      className={styles.activePill}
      layoutId="activePill"
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    />
  );
}

function NavItem({ item, isActive, open, onClick, hasPressure }) {
  const showPressure = hasPressure && PRESSURE_ROUTE_IDS.includes(item.id);
  const cls = [
    styles.navItem,
    isActive ? styles.navItemActive : "",
    showPressure ? styles.navItemPressure : "",
  ].filter(Boolean).join(" ");
  return (
    <motion.button
      onClick={onClick}
      className={cls}
      style={{ justifyContent: open ? "flex-start" : "center" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={NAV_SPRING}
    >
      <span className={styles.icon}>{item.icon}</span>
      <AnimatePresence>
        {open && <NavLabel label={item.label} />}
      </AnimatePresence>
      {isActive && <ActivePill />}
    </motion.button>
  );
}

function getRoutes(user) {
  return APP_ROUTES.filter((route) =>
    route.isAdminOnly ? user?.isAdmin : true,
  );
}

function SidebarNav({ active, onChange, open, user, hasPressure }) {
  return (
    <nav className={styles.nav}>
      {getRoutes(user).map((n) => (
        <NavItem key={n.id} item={n} isActive={active === n.id} open={open} onClick={() => onChange?.(n.id)} hasPressure={hasPressure} />
      ))}
    </nav>
  );
}

export default function Sidebar({
  active,
  onChange,
  user,
  isMobile,
  isOpen,
  onToggle,
  onSettingsClick,
  onLogoutClick,
  onProfileClick,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasPressure, setHasPressure] = useState(false);

  useEffect(() => {
    getUpcomingDeadlines()
      .then((list) => setHasPressure(hasDeadlineWithin48Hours(Array.isArray(list) ? list : [])))
      .catch(() => setHasPressure(false));
    const interval = setInterval(() => {
      getUpcomingDeadlines()
        .then((list) => setHasPressure(hasDeadlineWithin48Hours(Array.isArray(list) ? list : [])))
        .catch(() => setHasPressure(false));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const open = isMobile ? isOpen : isHovered;
  const sidebarStatusClass = open ? styles.sidebarOpen : styles.sidebarClosed;
  const w = isMobile
    ? open
      ? "100vw"
      : COLLAPSED_W
    : open
      ? EXPANDED_W
      : COLLAPSED_W;

  return (
    <motion.aside
      className={`${styles.sidebar} ${sidebarStatusClass}`}
      animate={{ width: w, minWidth: w }}
      transition={SIDEBAR_SPRING}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      <SidebarHeader open={open} isMobile={isMobile} onToggle={onToggle} />
      <SidebarNav active={active} onChange={onChange} open={open} user={user} hasPressure={hasPressure} />

      <UserFooter
        user={user}
        open={open}
        isMobile={isMobile}
        onSettings={onSettingsClick}
        onLogout={onLogoutClick}
        onProfile={onProfileClick}
      />
    </motion.aside>
  );
}
