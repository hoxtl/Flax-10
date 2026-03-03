import { useEffect, useMemo, useState } from "react";
import styles from "./DashboardLayout.module.css";
import TopBar from "../components/Dashboard/Topbar";
import Sidebar from "../components/Dashboard/Sidebar";
import WeekBar from "../components/Dashboard/WeekBar";
import QuickAddModal from "../components/Dashboard/QuickAddModal";
import { EventModal } from "../components/Calendar/EventModal/EventModal";
import { useEventModal, useCalendar } from "../context/CalendarContext";
import { authService } from "../api/authService";
import { clearUserData } from "../components/Authentication/utils/authHelpers";
import FloatingChat from "../components/FloatingChat";
import { useLocation } from "react-router-dom";
import { useTimerContext } from "../context/TimerContext";
import { LeaveTimerModal } from "../components/Timer/TimerPopups";

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
  const mapStyle = { padding: 0, overflow: "hidden", height: "100%" };
  return (
    <div className={styles.content} style={isMapPage ? mapStyle : undefined}>
      {children}
    </div>
  );
}

function MainArea({
  isMobile,
  user,
  onQuickAdd,
  onSettingsClick,
  onLogoutClick,
  onProfileClick,
  onNavChange,
  activeNav,
  selectedDate,
  showWeekBar,
  children,
}) {
  return (
    <div className={styles.main}>
      {/* Topbar shown on desktop only */}
      {!isMobile && (
        <TopBar
          user={user}
          onAddClick={onQuickAdd}
          onSettingsClick={onSettingsClick}
          onLogoutClick={onLogoutClick}
          onProfileClick={onProfileClick}
          onNavChange={onNavChange}
          activeNav={activeNav}
        />
      )}
      {showWeekBar && <WeekBar date={selectedDate} />}
      <PageContent activeNav={activeNav}>{children}</PageContent>
    </div>
  );
}

function QuickAddGate({ open, onClose, onSelectType }) {
  if (!open) return null;
  return <QuickAddModal onClose={onClose} onSelectType={onSelectType} />;
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar =
    activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const modal = useEventModal();

  const t = useTimerContext();
  const [pendingNav, setPendingNav] = useState(null);

  const handleNavChange = (nav) => {
    if (activeNav === "timer" && t.isActive && nav !== "timer") {
      setPendingNav(nav);
    } else {
      onNavChange?.(nav);
    }
  };

  const onPickNav = (id) => {
    handleNavChange(id);
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
    handleNavChange,
    pendingNav,
    setPendingNav,
    t,
  };
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

function DashboardModals({ showQuickAdd, setShowQuickAdd, onSelectType, modal }) {
  return (
    <>
      <QuickAddGate
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSelectType={onSelectType}
      />
      <EventModalGate modal={modal} />
    </>
  );
}

function DashboardMain({ state, onNavChange, children }) {
  const {
    user,
    showQuickAdd,
    setShowQuickAdd,
    selectedDate,
    showWeekBar,
    activeNav,
    modal,
    onSelectType,
    isMobile,
    t,
    setPendingNav
  } = state;
  return (
    <>
      <MainArea
        user={user}
        onQuickAdd={() => {
          if (activeNav === "timer" && t.isActive) {
            setPendingNav("QUICK_ADD");
          } else {
            setShowQuickAdd(true);
          }
        }}
        onSettingsClick={() => onNavChange?.("settings")}
        onLogoutClick={handleLogoutClick}
        onProfileClick={() => onNavChange?.("profile")}
        onNavChange={onNavChange}
        activeNav={activeNav}
        selectedDate={selectedDate}
        showWeekBar={showWeekBar}
        isMobile={isMobile}
      >
        {children}
      </MainArea>
      <DashboardModals
        showQuickAdd={showQuickAdd}
        setShowQuickAdd={setShowQuickAdd}
        onSelectType={onSelectType}
        modal={modal}
      />
    </>
  );
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, onPickNav, handleNavChange, pendingNav, setPendingNav, t, setShowQuickAdd } =
    state;
  return (
    <div className={styles.root}>
      {/* Sidebar — mobile only */}
      <DashboardSidebars
        {...state}
        activeNav={activeNav}
        onSettings={() => handleNavChange("settings")}
        onLogout={handleLogoutClick}
        onProfile={() => handleNavChange("profile")}
      />
      {/* Main area — Topbar shown inside on desktop */}
      <DashboardMain
        state={{ ...state, activeNav, isMobile }}
        onNavChange={handleNavChange}
      >
        {children}
      </DashboardMain>
      <FloatingChat />

      {pendingNav && (
        <LeaveTimerModal
          onCancel={() => setPendingNav(null)}
          onPause={() => {
            if (!t.isPaused) t.togglePause();
            if (pendingNav === "QUICK_ADD") {
              setShowQuickAdd(true);
            } else {
              onNavChange(pendingNav);
            }
            setPendingNav(null);
          }}
          onExit={() => {
            t.setIsActive(false);
            t.resetTimer();
            if (pendingNav === "QUICK_ADD") {
              setShowQuickAdd(true);
            } else {
              onNavChange(pendingNav);
            }
            setPendingNav(null);
          }}
        />
      )}
    </div>
  );
}
