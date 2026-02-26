import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Sidebar.module.css";
import { APP_ROUTES } from "../../lib/routes";
import { getUpcomingDeadlines } from "../../api/deadlineApi";

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

function SidebarHeader({ open }) {
  return (
    <div className={styles.header}>
      <LogoMark sidebarHovered={open} />
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
      <AnimatePresence>{open && <NavLabel label={item.label} />}</AnimatePresence>
      {isActive && <ActivePill />}
    </motion.button>);}

function getRoutes(user) {
  return APP_ROUTES.filter(route => route.isAdminOnly ? user?.isAdmin : true);
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

export default function Sidebar({ active, onChange, user }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
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

  const isExpanded = open;
  const w = isExpanded ? EXPANDED_W : COLLAPSED_W;
  const toggleCollapse = () => {
    setOpen((o) => !o);
    setPinned((p) => !p);
  };
  return (
    <motion.aside
      className={styles.sidebar}
      animate={{ width: w, minWidth: w }}
      transition={SIDEBAR_SPRING}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!pinned) setOpen(false); }}
    >
      <SidebarHeader open={isExpanded} />
      <SidebarNav active={active} onChange={onChange} open={isExpanded} user={user} hasPressure={hasPressure} />
    </motion.aside>
  );
}