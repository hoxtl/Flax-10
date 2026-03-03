import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import styles from "./DashboardLayout.module.css";
import TopBar from "../components/Dashboard/Topbar";
import Sidebar from "../components/Dashboard/Sidebar";
import WeekBar from "../components/Dashboard/WeekBar";
import { EventModal } from "../components/Calendar/EventModal/EventModal";
import { useEventModal, useCalendar } from "../context/CalendarContext";
import { authService } from "../api/authService";
import { clearUserData } from "../components/Authentication/utils/authHelpers";
import { BackToTop } from "../components/Pagination/Pagination";


function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function parseStoredUser(user) {
  const name =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;
  return {
    name,
    year: user.year ? `Year ${user.year}` : "Year: ",
    major: user.major || "Major: ",
    email: user.email,
    username: user.username,
    isAdmin: !!user.is_superuser,
  };
}

function getUser() {
  const s = localStorage.getItem("user");
  if (!s) return undefined;
  try {
    return parseStoredUser(JSON.parse(s));
  } catch (err) {
    console.error("Error parsing user data:", err);
  }
}

async function handleLogoutClick() {
  try {
    await authService.logout();
  } catch (_) {
  } finally {
    clearUserData();
  }
}

function PageContent({ activeNav, children }) {
  const isMapPage = activeNav === "map";
  const isTasksPage = activeNav === "tasks";
  const mapStyle = { padding: 0, overflow: "hidden", height: "100%" };
  const tasksStyle = { padding: 0 };
  return (
    <div
      className={styles.content}
      style={isMapPage ? mapStyle : (isTasksPage ? tasksStyle : undefined)}
    >
      {children}
    </div>
  );
}

function MainArea({ user, onSettingsClick, onLogoutClick, onProfileClick, selectedDate, showWeekBar, activeNav, children }) {
  return (
    <div className={styles.main} data-dashboard-main>
      <div className={styles.mainContent} data-dashboard-main-content>
        <TopBar user={user} onSettingsClick={onSettingsClick}
          onLogoutClick={onLogoutClick} onProfileClick={onProfileClick} />
        {showWeekBar && <WeekBar date={selectedDate} />}
        <PageContent activeNav={activeNav}>{children}</PageContent>
      </div>
    </div>
  );
}

function EventModalGate({ modal }) {
  if (!modal.isModalOpen) return null;
  return (
    <EventModal
      event={modal.modalEvent}
      initialType={modal.modalType}
      initialDate={modal.modalInitialDate}
      onClose={modal.closeModal}
    />
  );
}

function useDashboardState(activeNav, onNavChange) {
  const location = useLocation();
  const isMobile = useIsMobile(900);
  const user = useMemo(() => getUser(), []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar =
    activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const modal = useEventModal();
  const onPickNav = (id) => { onNavChange?.(id); setMobileSidebarOpen(false); };
  return { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, selectedDate, showWeekBar, modal, onPickNav };
}

function DashboardSidebars({
  isMobile,
  mobileSidebarOpen,
  user,
  activeNav,
  onPickNav,
  setMobileSidebarOpen,
  onSettings,
  onLogout,
  onProfile,
}) {
  // Sidebar shown on mobile only
  if (!isMobile) return null;
  return (
    <Sidebar
      user={user}
      active={activeNav}
      onChange={onPickNav}
      isMobile={isMobile}
      isOpen={mobileSidebarOpen}
      onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      onSettingsClick={onSettings}
      onLogoutClick={onLogout}
      onProfileClick={onProfile}
    />
  );
}
export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, selectedDate, showWeekBar, modal, onPickNav } = state;

  return (
    <div className={styles.root}>
      <DashboardSidebars
        isMobile={isMobile}
        mobileSidebarOpen={mobileSidebarOpen}
        user={user}
        activeNav={activeNav}
        onPickNav={onPickNav}
        setMobileSidebarOpen={setMobileSidebarOpen}
        onSettings={() => onNavChange?.("settings")}
        onLogout={handleLogoutClick}
        onProfile={() => onNavChange?.("profile")}
      />
      <MainArea
        user={user}
        onSettingsClick={() => onNavChange?.("settings")}
        onLogoutClick={handleLogoutClick}
        onProfileClick={() => onNavChange?.("profile")}
        selectedDate={selectedDate}
        showWeekBar={showWeekBar}
        activeNav={activeNav}
      >
        {children}
      </MainArea>
      <EventModalGate modal={modal} />
      {activeNav !== "map" && activeNav !== "modules" && activeNav !== "tasks" && (
        <BackToTop containerSelector="[data-dashboard-main]" />
      )}
    </div>
  );
}
