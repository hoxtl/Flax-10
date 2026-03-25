/*
 * Desktop sidebar navigation.
 */

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { motion as Motion } from "framer-motion";

import sharedStyles from "../SidebarShell.module.css";
import { COLLAPSED_W, EXPANDED_W, LOGO_SPRING, NAV_SPRING, PRESSURE_ROUTE_IDS, SIDEBAR_SPRING } from "./sidebarConstants";
import { getSidebarRoutes } from "./sidebarUtils";

function toggleMenu(setShowMenu, value) {
  setShowMenu(value);
}

function UserMenu({ showMenu, onClose, onSettings, onLogout, onProfile }) {
  if (!showMenu) return null;
  return (
    <>
      <div className={sharedStyles.menuBackdrop} onClick={onClose} />
      <Motion.div className={sharedStyles.userMenu} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={getUserMenuTransition()}>
        <button onClick={onProfile}>Profile</button>
        <button onClick={onSettings}>Settings</button>
        <div className={sharedStyles.menuDivider} />
        <button onClick={onLogout} className={sharedStyles.logoutBtn}>Log out</button>
      </Motion.div>
    </>
  );
}

function getUserMenuTransition() {
  return { type: "tween", ease: "easeOut", duration: 0.2, exit: { duration: 0.13 }, scale: 0.5 };
}

function UserButton({ user, open, onClick }) {
  const rowClass = [sharedStyles.userRow, open ? "" : sharedStyles.userRowCollapsed].filter(Boolean).join(" ");
  return (
    <button className={rowClass} onClick={onClick}>
      <div className={sharedStyles.avatar}>{user?.name?.charAt(0) || "U"}</div>
      <ExpandedUserInfo open={open} user={user} />
    </button>
  );
}

function ExpandedUserInfo({ open, user }) {
  if (!open) return null;
  return (
    <div className={sharedStyles.userInfo}>
      <span className={sharedStyles.userName}>{user?.name}</span>
      <span className={sharedStyles.userEmail}>{user?.email}</span>
    </div>
  );
}

function UserFooter({ user, open, onSettings, onLogout, onProfile }) {
  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => toggleMenu(setShowMenu, false), [open]);
  return (
    <div className={sharedStyles.sidebarFooter}>
      <AnimatePresence>
        <UserMenu
          showMenu={showMenu}
          onClose={() => toggleMenu(setShowMenu, false)}
          onSettings={onSettings}
          onLogout={onLogout}
          onProfile={onProfile}
        />
      </AnimatePresence>
      <UserButton user={user} open={open} onClick={() => toggleMenu(setShowMenu, !showMenu)} />
    </div>
  );
}

function LogoMark({ sidebarHovered }) {
  return <Motion.div className={sharedStyles.logoMark} animate={{ rotate: sidebarHovered ? 8 : 0, scale: sidebarHovered ? 1.08 : 1 }} transition={LOGO_SPRING} />;
}

function BrandName() {
  return <Motion.span className={sharedStyles.brand} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>StudyFlax</Motion.span>;
}

function SidebarHeader({ open }) {
  return (
    <div className={sharedStyles.header}>
      <LogoMark sidebarHovered={open} />
      <AnimatePresence>{open && <BrandName />}</AnimatePresence>
    </div>
  );
}

function NavLabel({ label }) {
  return <Motion.span className={sharedStyles.label} initial={{ opacity: 0, x: -4, width: 0 }} animate={{ opacity: 1, x: 0, width: "auto" }} exit={{ opacity: 0, x: -4, width: 0 }} transition={{ duration: 0.16 }}>{label}</Motion.span>;
}

function ActivePill() {
  return <Motion.span className={sharedStyles.activePill} layoutId="activePill" transition={{ type: "spring", stiffness: 380, damping: 30 }} />;
}

function NavItem({ item, isActive, open, onClick, hasPressure }) {
  return (
    <Motion.button onClick={onClick} className={getNavItemClass(isActive, hasPressure, item.id)} style={{ justifyContent: open ? "flex-start" : "center" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={NAV_SPRING}>
      <span className={sharedStyles.icon}>{item.icon}</span>
      <AnimatePresence>{open && <NavLabel label={item.label} />}</AnimatePresence>
      {isActive && <ActivePill />}
    </Motion.button>
  );
}

function getNavItemClass(isActive, hasPressure, itemId) {
  const showPressure = hasPressure && PRESSURE_ROUTE_IDS.includes(itemId);
  return [sharedStyles.navItem, isActive ? sharedStyles.navItemActive : "", showPressure ? sharedStyles.navItemPressure : ""].filter(Boolean).join(" ");
}

function SidebarNav({ active, onChange, open, user, hasPressure }) {
  return <nav className={sharedStyles.nav}>{getSidebarRoutes(user).map((item) => <NavItem key={item.id} item={item} isActive={active === item.id} open={open} onClick={() => onChange?.(item.id)} hasPressure={hasPressure} />)}</nav>;
}

export default function SidebarDesktop({ active, onChange, user, onSettingsClick, onLogoutClick, onProfileClick, hasPressure }) {
  const [isHovered, setIsHovered] = useState(false);
  const open = isHovered;
  const width = open ? EXPANDED_W : COLLAPSED_W;
  return (
    <Motion.aside className={sharedStyles.sidebar} animate={{ width, minWidth: width }} transition={SIDEBAR_SPRING} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <SidebarHeader open={open} />
      <SidebarNav active={active} onChange={onChange} open={open} user={user} hasPressure={hasPressure} />
      <UserFooter user={user} open={open} onSettings={onSettingsClick} onLogout={onLogoutClick} onProfile={onProfileClick} />
    </Motion.aside>
  );
}
