/*
 * Mobile sidebar drawer and bottom bar.
 */

import { AnimatePresence } from "framer-motion";
import { motion as Motion } from "framer-motion";

import mobileStyles from "../styles/SidebarMobile.module.css";
import sharedStyles from "../styles/SidebarShell.module.css";
import { getSidebarRoutes } from "./sidebarUtils";

function MobileNavIcon({ item, isActive, onClick }) {
  const className = `${mobileStyles.mobileNavIcon} ${isActive ? mobileStyles.mobileNavIconActive : ""}`;
  return (
    <Motion.button className={className} onClick={onClick} whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
      <span className={mobileStyles.mobileNavIconEmoji}>{item.icon}</span>
      <span className={mobileStyles.mobileNavIconLabel}>{item.label}</span>
    </Motion.button>
  );
}

function DrawerRoute({ item, active, onChange, onClose, index }) {
  return (
    <Motion.button className={getDrawerItemClass(active === item.id)} onClick={() => handleDrawerNav(item.id, onChange, onClose)} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.22 }} whileTap={{ scale: 0.97 }}>
      <span className={mobileStyles.mobileDrawerNavIcon}>{item.icon}</span>
      <span className={mobileStyles.mobileDrawerNavLabel}>{item.label}</span>
      {active === item.id && <Motion.span className={mobileStyles.mobileDrawerActivePill} layoutId="drawerActivePill" />}
    </Motion.button>
  );
}

function getDrawerItemClass(isActive) {
  return `${mobileStyles.mobileDrawerNavItem} ${isActive ? mobileStyles.mobileDrawerNavItemActive : ""}`;
}

function handleDrawerNav(itemId, onChange, onClose) {
  onChange?.(itemId);
  onClose();
}

function FooterButton({ className = mobileStyles.mobileDrawerFooterBtn, icon, label, onClick }) {
  return <button className={className} onClick={onClick}><span>{icon}</span> {label}</button>;
}

function MobileDrawerFooter({ onProfile, onSettings, onLogout, onClose }) {
  return (
    <div className={mobileStyles.mobileDrawerFooter}>
      <FooterButton icon="👤" label="Profile" onClick={() => runFooterAction(onProfile, onClose)} />
      <FooterButton icon="⚙️" label="Settings" onClick={() => runFooterAction(onSettings, onClose)} />
      <FooterButton className={`${mobileStyles.mobileDrawerFooterBtn} ${mobileStyles.mobileDrawerLogout}`} icon="🚪" label="Log out" onClick={() => runFooterAction(onLogout, onClose)} />
    </div>
  );
}

function runFooterAction(action, onClose) {
  action?.();
  onClose();
}

function MobileDrawerHeader({ onClose }) {
  return (
    <div className={mobileStyles.mobileDrawerHeader}>
      <div className={mobileStyles.mobileDrawerLogo}>
        <div className={sharedStyles.logoMark} />
        <span className={mobileStyles.mobileDrawerTitle}>StudyFlax</span>
      </div>
      <button className={mobileStyles.mobileDrawerClose} onClick={onClose} aria-label="Close menu">✕</button>
    </div>
  );
}

function MobileDrawer({ isOpen, onClose, user, active, onChange, onSettings, onLogout, onProfile }) {
  const routes = getSidebarRoutes(user);
  return (
    <AnimatePresence>
      {isOpen && <DrawerContent routes={routes} active={active} onChange={onChange} onClose={onClose} onSettings={onSettings} onLogout={onLogout} onProfile={onProfile} />}
    </AnimatePresence>
  );
}

function DrawerContent({ routes, active, onChange, onClose, onSettings, onLogout, onProfile }) {
  return (
    <>
      <Motion.div className={mobileStyles.mobileDrawerBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={onClose} />
      <Motion.div className={mobileStyles.mobileDrawer} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
        <div className={mobileStyles.mobileDrawerHandle} />
        <MobileDrawerHeader onClose={onClose} />
        <div className={mobileStyles.mobileDrawerDivider} />
        <nav className={mobileStyles.mobileDrawerNav}>{routes.map((item, index) => <DrawerRoute key={item.id} item={item} active={active} onChange={onChange} onClose={onClose} index={index} />)}</nav>
        <div className={mobileStyles.mobileDrawerDivider} />
        <MobileDrawerFooter onProfile={onProfile} onSettings={onSettings} onLogout={onLogout} onClose={onClose} />
      </Motion.div>
    </>
  );
}

function MobileBottomBar({ active, onChange, user, onToggleDrawer, drawerOpen }) {
  const routes = getSidebarRoutes(user);
  return (
    <Motion.div className={mobileStyles.mobileBottomBar} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}>
      <BottomBarMenuButton drawerOpen={drawerOpen} onToggleDrawer={onToggleDrawer} />
      <BottomBarRoutes routes={routes} active={active} onChange={onChange} />
    </Motion.div>
  );
}

function BottomBarMenuButton({ drawerOpen, onToggleDrawer }) {
  return (
    <div className={mobileStyles.mobileBottomLeft}>
      <Motion.button className={getBottomButtonClass(drawerOpen)} onClick={onToggleDrawer} whileTap={{ scale: 0.88 }} aria-label="Open menu">
        <AnimatePresence mode="wait">{drawerOpen ? <CloseIcon /> : <OpenIcon />}</AnimatePresence>
      </Motion.button>
      <div className={mobileStyles.mobileBottomSeparator} />
    </div>
  );
}

function getBottomButtonClass(drawerOpen) {
  return `${mobileStyles.mobileHamburgerBtn} ${drawerOpen ? mobileStyles.mobileHamburgerBtnActive : ""}`;
}

function CloseIcon() {
  return <Motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className={mobileStyles.mobileHamburgerIcon}>✕</Motion.span>;
}

function OpenIcon() {
  return (
    <Motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className={mobileStyles.mobileHamburgerLines}>
      <div className={sharedStyles.hamburgerLine} />
      <div className={sharedStyles.hamburgerLine} />
      <div className={sharedStyles.hamburgerLine} />
    </Motion.div>
  );
}

function BottomBarRoutes({ routes, active, onChange }) {
  return (
    <div className={mobileStyles.mobileBottomScrollHint}>
      <div className={mobileStyles.mobileBottomScroll}>{routes.map((item) => <MobileNavIcon key={item.id} item={item} isActive={active === item.id} onClick={() => onChange?.(item.id)} />)}</div>
      <div className={mobileStyles.mobileScrollFade} />
    </div>
  );
}

export default function SidebarMobile(props) {
  return (
    <>
      <MobileDrawer isOpen={props.isOpen} onClose={props.onToggle} user={props.user} active={props.active} onChange={props.onChange} onSettings={props.onSettingsClick} onLogout={props.onLogoutClick} onProfile={props.onProfileClick} />
      <MobileBottomBar active={props.active} onChange={props.onChange} user={props.user} onToggleDrawer={props.onToggle} drawerOpen={props.isOpen} />
    </>
  );
}
