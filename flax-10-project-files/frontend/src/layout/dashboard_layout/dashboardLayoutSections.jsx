/*
 * Dashboard layout view sections.
 */

import { useLocation } from "react-router-dom";

import styles from "../DashboardLayout.module.css";
<<<<<<< HEAD
import TopBar from "../../components/Dashboard/Topbar";
import Sidebar from "../../components/Dashboard/Sidebar";
import WeekBar from "../../components/Dashboard/WeekBar";
=======
import TopBar from "../../components/dashboard/Topbar";
import Sidebar from "../../components/dashboard/Sidebar";
import WeekBar from "../../components/dashboard/WeekBar";
>>>>>>> origin/main

function getContentStyle(activeNav) {
  if (activeNav === "map") return { padding: 0, overflow: "hidden", height: "100%" };
  if (activeNav === "tasks") return { padding: 0 };
}

export function PageContent({ activeNav, children }) {
  return (
    <div className={styles.content} style={getContentStyle(activeNav)}>
      {children}
    </div>
  );
}

export function MainArea(props) {
  return (
    <div className={styles.main} data-dashboard-main>
      <MainContent {...props} />
    </div>
  );
}

function MainContent(props) {
  return (
    <div className={styles.mainContent} data-dashboard-main-content>
      <DesktopTopBar {...props} />
      <DesktopWeekBar {...props} />
      <PageContent activeNav={props.activeNav}>{props.children}</PageContent>
    </div>
  );
}

function DesktopTopBar(props) {
  const { isMobile } = props;
  if (isMobile) return null;
  return <TopBar {...getTopBarProps(props)} />;
}

function getTopBarProps(props) {
  return {
    user: props.user,
    onAddClick: props.onQuickAdd,
    onSettingsClick: props.onSettingsClick,
    onLogoutClick: props.onLogoutClick,
    onProfileClick: props.onProfileClick,
    onNavChange: props.onNavChange,
    activeNav: props.activeNav,
  };
}

function DesktopWeekBar({ isMobile, showWeekBar, selectedDate }) {
  const location = useLocation();
  if (!shouldRenderWeekBar(isMobile, showWeekBar, location.pathname)) return null;
  return <WeekBar date={selectedDate} />;
}

function shouldRenderWeekBar(isMobile, showWeekBar, pathname) {
  if (isMobile) return false;
  if (showWeekBar) return true;
  return pathname.startsWith("/calendar");
}

export function DashboardSidebars(props) {
  const { isMobile } = props;
  if (!isMobile) return null;
  return <Sidebar {...getSidebarProps(props)} />;
}

function getSidebarProps(props) {
  return {
    user: props.user,
    active: props.activeNav,
    onChange: props.onPickNav,
    isMobile: props.isMobile,
    isOpen: props.mobileSidebarOpen,
    onToggle: () => props.setMobileSidebarOpen(!props.mobileSidebarOpen),
    onSettingsClick: props.onSettings,
    onLogoutClick: props.onLogout,
    onProfileClick: props.onProfile,
  };
}
