import { useEffect, useState } from "react";
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

function getUser() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      return {
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username,
        year: user.year ? `Year ${user.year}` : 'Year: ',
        major: user.major || "Major: ",
        email: user.email,
        username: user.username
      };
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }
}

function toggleByDevice(isMobile, setMobileOpen, setCollapsed) {
  if (isMobile) return setMobileOpen((v) => !v);
  setCollapsed((c) => !c);
}

function DesktopSidebar({ isMobile, user, activeNav, onNavChange, collapsed }) {
  if (isMobile) return null;
  return (
    <Sidebar
      user={user}
      active={activeNav}
      onChange={onNavChange}
      collapsed={collapsed}
    />
  );
}

function MobileSidebar({ isMobile, open, user, activeNav, onPick, onClose }) {
  if (!isMobile || !open) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <Sidebar
          user={user}
          active={activeNav}
          onChange={onPick}
          collapsed={false}
        />
      </div>
    </>
  );
}

function MainArea({ user, onToggle, onQuickAdd, onSettingsClick, onLogoutClick, selectedDate, showWeekBar, children }) {
  return (
    <div className={styles.main}>
      <TopBar
        user={user}
        onToggle={onToggle}
        onAddClick={onQuickAdd}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />
      {showWeekBar && <WeekBar date={selectedDate} />}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

function QuickAddGate({ open, onClose, onSelectType }) {
  if (!open) return null;
  return <QuickAddModal onClose={onClose} onSelectType={onSelectType} />;
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const location = useLocation();
  const isMobile = useIsMobile(900);
  const user = useMemo(() => getUser(), []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  
  const showWeekBar = activeNav == "calendar" || location.pathname.startsWith("/calendar");
  const { openModal, isModalOpen, modalEvent, modalType, modalInitialDate, closeModal } = useEventModal();

  function onToggle() {
    toggleByDevice(isMobile, setMobileSidebarOpen, setSidebarCollapsed);
  }

  function onPickNav(id) {
    onNavChange?.(id);
    setMobileSidebarOpen(false);
  }

  function onSelectType(type) {
    setShowQuickAdd(false);
    openModal(null, type, selectedDate);
  }

  function handleSettingsClick() {
    onNavChange?.("settings");
  }

  async function handleLogoutClick() {
    try {
      const { response } = await authService.logout();

      if (response.ok) {
        clearUserData();
      } else {
        clearUserData();
      }
    } catch (err) {
      clearUserData();
    }
  }

  return (
    <div className={styles.root}>
      <DesktopSidebar
        isMobile={isMobile}
        user={user}
        activeNav={activeNav}
        onNavChange={onNavChange}
        collapsed={sidebarCollapsed}
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
        onToggle={onToggle}
        onQuickAdd={() => setShowQuickAdd(true)}
        onSettingsClick={handleSettingsClick}
        onLogoutClick={handleLogoutClick}
        selectedDate={selectedDate}
        showWeekBar={showWeekBar}
      >
        {children}
      </MainArea>
      
      <QuickAddGate 
        open={showQuickAdd} 
        onClose={() => setShowQuickAdd(false)} 
        onSelectType={onSelectType} 
      />

      {isModalOpen && (
        <EventModal
          event={modalEvent}
          initialType={modalType}
          initialDate={modalInitialDate}
          onClose={closeModal}
        />
      )}

      <FloatingTasks />
    </div>
  );
}
