import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Sidebar.module.css";
import { APP_ROUTES } from "../../lib/routes";

const EXPANDED_W = 224;
const COLLAPSED_W = 72;
const NAV_SPRING = { type: "spring", stiffness: 400, damping: 25 };
const SIDEBAR_SPRING = { type: "spring", stiffness: 280, damping: 30 };
const LOGO_SPRING = { type: "spring", stiffness: 400, damping: 20 };

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

function LogoMark() {
  return (
    <motion.div
      className={styles.logoMark}
      whileHover={{ rotate: 8, scale: 1.08 }}
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
      {isMobile ? <Hamburger onClick={onToggle} /> : <LogoMark />}
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

function NavItem({ item, isActive, open, onClick }) {
  const cls = `${styles.navItem} ${isActive ? styles.navItemActive : ""}`;
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

function SidebarNav({ active, onChange, open, user }) {
  return (
    <nav className={styles.nav}>
      {getRoutes(user).map((n) => (
        <NavItem
          key={n.id}
          item={n}
          isActive={active === n.id}
          open={open}
          onClick={() => onChange?.(n.id)}
        />
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

  if (isMobile) {
    return (
      <>
        <MobileDrawer
          isOpen={isOpen}
          onClose={onToggle}
          user={user}
          active={active}
          onChange={onChange}
          onSettings={onSettingsClick}
          onLogout={onLogoutClick}
          onProfile={onProfileClick}
        />
        <MobileBottomBar
          active={active}
          onChange={onChange}
          user={user}
          onToggleDrawer={onToggle}
          drawerOpen={isOpen}
        />
      </>
    );
  }

  const open = isHovered;
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
      <SidebarNav active={active} onChange={onChange} open={open} user={user} />

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
