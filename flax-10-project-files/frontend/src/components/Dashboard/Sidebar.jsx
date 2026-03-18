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

  if (isMobile) return null;

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
    <button
      className={styles.hamburger}
      onClick={onClick}
      aria-label="Open menu"
    >
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
      {isMobile ? (
        <Hamburger onClick={onToggle} />
      ) : (
        <LogoMark sidebarHovered={open} />
      )}
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
  ]
    .filter(Boolean)
    .join(" ");
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
        <NavItem
          key={n.id}
          item={n}
          isActive={active === n.id}
          open={open}
          onClick={() => onChange?.(n.id)}
          hasPressure={hasPressure}
        />
      ))}
    </nav>
  );
}

function MobileNavIcon({ item, isActive, onClick }) {
  return (
    <motion.button
      className={`${styles.mobileNavIcon} ${isActive ? styles.mobileNavIconActive : ""}`}
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className={styles.mobileNavIconEmoji}>{item.icon}</span>
      <span className={styles.mobileNavIconLabel}>{item.label}</span>
    </motion.button>
  );
}

function MobileDrawer({
  isOpen,
  onClose,
  user,
  active,
  onChange,
  onSettings,
  onLogout,
  onProfile,
}) {
  const routes = APP_ROUTES.filter((r) => !r.isAdminOnly || user?.isAdmin);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.mobileDrawerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.mobileDrawer}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.mobileDrawerHandle} />

            <div className={styles.mobileDrawerHeader}>
              <div className={styles.mobileDrawerLogo}>
                <div className={styles.logoMark} />
                <span className={styles.mobileDrawerTitle}>StudyFlax</span>
              </div>
              <button
                className={styles.mobileDrawerClose}
                onClick={onClose}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className={styles.mobileDrawerDivider} />

            <nav className={styles.mobileDrawerNav}>
              {routes.map((item, i) => (
                <motion.button
                  key={item.id}
                  className={`${styles.mobileDrawerNavItem} ${
                    active === item.id ? styles.mobileDrawerNavItemActive : ""
                  }`}
                  onClick={() => {
                    onChange?.(item.id);
                    onClose();
                  }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.22 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className={styles.mobileDrawerNavIcon}>
                    {item.icon}
                  </span>
                  <span className={styles.mobileDrawerNavLabel}>
                    {item.label}
                  </span>
                  {active === item.id && (
                    <motion.span
                      className={styles.mobileDrawerActivePill}
                      layoutId="drawerActivePill"
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            <div className={styles.mobileDrawerDivider} />

            <div className={styles.mobileDrawerFooter}>
              <button
                className={styles.mobileDrawerFooterBtn}
                onClick={() => {
                  onProfile?.();
                  onClose();
                }}
              >
                <span>👤</span> Profile
              </button>
              <button
                className={styles.mobileDrawerFooterBtn}
                onClick={() => {
                  onSettings?.();
                  onClose();
                }}
              >
                <span>⚙️</span> Settings
              </button>
              <button
                className={`${styles.mobileDrawerFooterBtn} ${styles.mobileDrawerLogout}`}
                onClick={() => {
                  onLogout?.();
                  onClose();
                }}
              >
                <span>🚪</span> Log out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Mobile Bottom Bar ─────────────────────────────────────────────────────────

function MobileBottomBar({
  active,
  onChange,
  user,
  onToggleDrawer,
  drawerOpen,
}) {
  const routes = APP_ROUTES.filter((r) => !r.isAdminOnly || user?.isAdmin);

  return (
    <motion.div
      className={styles.mobileBottomBar}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
    >
      <div className={styles.mobileBottomLeft}>
        <motion.button
          className={`${styles.mobileHamburgerBtn} ${
            drawerOpen ? styles.mobileHamburgerBtnActive : ""
          }`}
          onClick={onToggleDrawer}
          whileTap={{ scale: 0.88 }}
          aria-label="Open menu"
        >
          <AnimatePresence mode="wait">
            {drawerOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={styles.mobileHamburgerIcon}
              >
                ✕
              </motion.span>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={styles.mobileHamburgerLines}
              >
                <div className={styles.hamburgerLine} />
                <div className={styles.hamburgerLine} />
                <div className={styles.hamburgerLine} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        <div className={styles.mobileBottomSeparator} />
      </div>

      <div className={styles.mobileBottomScrollHint}>
        <div className={styles.mobileBottomScroll}>
          {routes.map((item) => (
            <MobileNavIcon
              key={item.id}
              item={item}
              isActive={active === item.id}
              onClick={() => onChange?.(item.id)}
            />
          ))}
        </div>
        <div className={styles.mobileScrollFade} />
      </div>
    </motion.div>
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
      .then((list) =>
        setHasPressure(
          hasDeadlineWithin48Hours(Array.isArray(list) ? list : []),
        ),
      )
      .catch(() => setHasPressure(false));
    const interval = setInterval(() => {
      getUpcomingDeadlines()
        .then((list) =>
          setHasPressure(
            hasDeadlineWithin48Hours(Array.isArray(list) ? list : []),
          ),
        )
        .catch(() => setHasPressure(false));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

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
  const w = open ? EXPANDED_W : COLLAPSED_W;

  return (
    <motion.aside
      className={`${styles.sidebar} ${sidebarStatusClass}`}
      animate={{ width: w, minWidth: w }}
      transition={SIDEBAR_SPRING}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarHeader open={open} isMobile={isMobile} onToggle={onToggle} />
      <SidebarNav
        active={active}
        onChange={onChange}
        open={open}
        user={user}
        hasPressure={hasPressure}
      />

      <UserFooter
        user={user}
        open={open}
        isMobile={false}
        onSettings={onSettingsClick}
        onLogout={onLogoutClick}
        onProfile={onProfileClick}
      />
    </motion.aside>
  );
}
