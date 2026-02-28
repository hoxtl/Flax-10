import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Sidebar.module.css";
import { APP_ROUTES } from "../../lib/routes";

const EXPANDED_W = 224;
const COLLAPSED_W = 72;
const NAV_SPRING = { type: "spring", stiffness: 400, damping: 25 };
const SIDEBAR_SPRING = { type: "spring", stiffness: 280, damping: 30 };
const LOGO_SPRING = { type: "spring", stiffness: 400, damping: 20 };

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

function SidebarHeader({ open }) {
  return (
    <div className={styles.header}>
      <LogoMark />
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
      <AnimatePresence>{open && <NavLabel label={item.label} />}</AnimatePresence>
      {isActive && <ActivePill />}
    </motion.button>);
}

function getRoutes(user) {
  return APP_ROUTES.filter(route => route.isAdminOnly ? user?.isAdmin : true);
}

function SidebarNav({ active, onChange, open, user }) {
  return (
    <nav className={styles.nav}>
      {getRoutes(user).map((n) => (
        <NavItem key={n.id} item={n} isActive={active === n.id} open={open} onClick={() => onChange?.(n.id)} />
      ))}
    </nav>
  );
}

export default function Sidebar({ active, onChange, user }) {
  const [open, setOpen] = useState(false);
  const w = open ? EXPANDED_W : COLLAPSED_W;
  return (
    <motion.aside
      className={styles.sidebar}
      animate={{ width: w, minWidth: w }}
      transition={SIDEBAR_SPRING}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader open={open} />
      <SidebarNav active={active} onChange={onChange} open={open} user={user} />
    </motion.aside>);
}