import { useEffect, useMemo, useState } from "react";
import styles from "./DashboardLayout.module.css";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/Topbar";
import WeekBar from "../components/WeekBar";
import QuickAddModal from "../components/QuickAddModal";
import { EventModal } from "../components/Calendar/EventModal/EventModal";
import { useEventModal, useCalendar } from "../context/CalendarContext";
import { authService } from "../api/authService";
import { clearUserData } from "../utils/authHelpers";
import FloatingTasks from "../components/Tasks/FloatingTasks";
import { useLocation } from "react-router-dom";

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
  };
}

function getUser() {
  const userString = localStorage.getItem("user");
  if (!userString) return undefined;
  try {
    return parseStoredUser(JSON.parse(userString));
  } catch (err) {
    console.error("Error parsing user data:", err);
  }
}

function DesktopSidebar({ isMobile, user, activeNav, onNavChange }) {
  if (isMobile) return null;
  return <Sidebar user={user} active={activeNav} onChange={onNavChange} />;
}

function MobileSidebar({ isMobile, open, user, activeNav, onPick, onClose }) {
  if (!isMobile || !open) return null;
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <Sidebar user={user} active={activeNav} onChange={onPick} />
      </div>
    </>
  );
}

function MainArea({
  user,
  onQuickAdd,
  onSettingsClick,
  onLogoutClick,
  selectedDate,
  showWeekBar,
  children,
  activeNav,
}) {
  const isMapPage = activeNav === "map";
  return (
    <div className={styles.main}>
      <TopBar
        user={user}
        onAddClick={onQuickAdd}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />
      {showWeekBar && <WeekBar date={selectedDate} />}
      <div
        className={styles.content}
        style={
          isMapPage
            ? { padding: 0, overflow: "hidden", height: "100%" }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

function QuickAddGate({ open, onClose, onSelectType }) {
  if (!open) return null;
  return <QuickAddModal onClose={onClose} onSelectType={onSelectType} />;
}

async function handleLogoutClick() {
  try {
    await authService.logout();
  } catch (_) {}
  finally {
    clearUserData();
  }
}

function useDashboardState(activeNav, onNavChange) {
  const location = useLocation();
  const isMobile = useIsMobile(900);
  const user = useMemo(() => getUser(), []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar =
    activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const modal = useEventModal();
  const onPickNav = (id) => {
    onNavChange?.(id);
    setMobileSidebarOpen(false);
  };
  const onSelectType = (type) => {
    setShowQuickAdd(false);
    modal.openModal(null, type, selectedDate);
  };
  return {
    isMobile,
    user,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    showQuickAdd,
    setShowQuickAdd,
    selectedDate,
    showWeekBar,
    modal,
    onPickNav,
    onSelectType,
  };
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const s = useDashboardState(activeNav, onNavChange);
  const {
    isMobile,
    user,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    showQuickAdd,
    setShowQuickAdd,
    selectedDate,
    showWeekBar,
    modal,
    onPickNav,
    onSelectType,
  } = s;

  return (
    <div className={styles.root}>
      <DesktopSidebar
        isMobile={isMobile}
        user={user}
        activeNav={activeNav}
        onNavChange={onNavChange}
      />
      <MobileSidebar
        isMobile={isMobile}
        open={mobileSidebarOpen}
        user={user}
        activeNav={activeNav}
        onPick={onPickNav}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <MainArea
        user={user}
        onQuickAdd={() => setShowQuickAdd(true)}
        onSettingsClick={() => onNavChange?.("settings")}
        onLogoutClick={handleLogoutClick}
        selectedDate={selectedDate}
        showWeekBar={showWeekBar}
        activeNav={activeNav}
      >
        {children}
      </MainArea>
      <QuickAddGate
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSelectType={onSelectType}
      />
      {modal.isModalOpen && (
        <EventModal
          event={modal.modalEvent}
          initialType={modal.modalType}
          initialDate={modal.modalInitialDate}
          onClose={modal.closeModal}
        />
      )}
      <FloatingTasks />
    </div>
  );
}