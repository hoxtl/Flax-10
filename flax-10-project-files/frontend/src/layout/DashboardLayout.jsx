import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import styles from "./DashboardLayout.module.css";
import TopBar from "../components/Dashboard/Topbar";
import QuickCommandBar from "../components/common/QuickCommandBar/QuickCommandBar";
import Sidebar from "../components/Dashboard/Sidebar";
import WeekBar from "../components/Dashboard/WeekBar";
import QuickAddModal from "../components/Dashboard/QuickAddModal";
import { EventModal } from "../components/Calendar/EventModal/EventModal";
import { useEventModal, useCalendar } from "../context/CalendarContext";
import { authService } from "../api/authService";
import { clearUserData } from "../components/Authentication/utils/authHelpers";
import FloatingChat from "../components/FloatingChat";
import { BackToTop } from "../components/Pagination/Pagination";
import CreateSocietyModal from "../components/Society/CreateSocietyModal";
import DeadlineModal from "../components/Modules/DeadlineModal";
import ReadingModal from "../components/Modules/ReadingModal";
import { createSociety } from "../api/societyApi";
import { createTask, fetchTaskLists } from "../api/taskService";
import { getModules, getEnrollments } from "../api/moduleApi";
import { isEnrolledIn } from "../components/Modules/utils/moduleUtils";
import CreateTaskModal from "../pages/Tasks/components/CreateTaskModal";
import { useTimerContext } from "../context/TimerContext";
import { LeaveTimerModal } from "../components/Timer/TimerPopups";
import useBreakpoint from "../hooks/useBreakpoint";

function parseStoredUser(user) {
  const formatYear = (year) => {
    if (!year) return "Year: ";
    const trimmed = String(year).trim();
    if (/^year\s+/i.test(trimmed)) return trimmed;
    if (!Number.isNaN(Number(trimmed))) return `Year ${trimmed}`;
    return trimmed;
  };
  const name =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;
  return {
    name,
    year: formatYear(user.year),
    major: user.major || "Major: ",
    email: user.email,
    username: user.username,
    isAdmin: !!user.is_superuser,
    role: user.role,
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
      style={isMapPage ? mapStyle : isTasksPage ? tasksStyle : undefined}
    >
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
    <div className={styles.main} data-dashboard-main>
      <div className={styles.mainContent} data-dashboard-main-content>
        {/* Topbar shown on desktop only */}
        {!isMobile && (
          <TopBar
            user={user}
            onSettingsClick={onSettingsClick}
            onLogoutClick={onLogoutClick}
            onProfileClick={onProfileClick}
            onNavChange={onNavChange}
            activeNav={activeNav}
          />
        )}
        {showWeekBar && !isMobile && <WeekBar date={selectedDate} />}
        <PageContent activeNav={activeNav}>{children}</PageContent>
      </div>
    </div>
  );
}

function QuickAddGate({ open, onClose, onSelectType, isTeacher }) {
  if (!open) return null;
  return (
    <QuickAddModal
      onClose={onClose}
      onSelectType={onSelectType}
      isTeacher={isTeacher}
    />
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

function useUserSync() {
  const [user, setUser] = useState(() => getUser());
  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, []);
  return user;
}

function useModalStates() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [deadlineModule, setDeadlineModule] = useState(null);
  const [readingModule, setReadingModule] = useState(null);
  return { showQuickAdd, setShowQuickAdd, showSocietyModal, setShowSocietyModal, showTaskModal, setShowTaskModal, deadlineModule, setDeadlineModule, readingModule, setReadingModule };
}

function useTimerNav(activeNav, onNavChange, t) {
  const [pendingNav, setPendingNav] = useState(null);
  const handleNavChange = (nav) => {
    if (activeNav === "timer" && t.isActive && !t.isPaused && nav !== "timer") setPendingNav(nav);
    else onNavChange?.(nav);
  };
  return { pendingNav, setPendingNav, handleNavChange };
}

function useDashboardState(activeNav, onNavChange) {
  const location = useLocation();
  const isMobile = useBreakpoint(900);
  const user = useUserSync();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const modals = useModalStates();
  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar =
    activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const modal = useEventModal();
  const t = useTimerContext();
  const { pendingNav, setPendingNav, handleNavChange } = useTimerNav(activeNav, onNavChange, t);

  const onPickNav = (id) => { handleNavChange(id); setMobileSidebarOpen(false); };
  const onSelectType = (id, extra) => {
    modals.setShowQuickAdd(false);
    if (id === 'society') modals.setShowSocietyModal(true);
    else if (id === 'task') modals.setShowTaskModal(true);
    else if (id === 'create_module') onPickNav('modules_create');
    else if (id === 'add_deadline') modals.setDeadlineModule(extra);
    else if (id === 'add_reading') modals.setReadingModule(extra);
    else modal.openModal(null, id, selectedDate);
  };
  return { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, selectedDate, showWeekBar, modal, onPickNav, onSelectType, handleNavChange, pendingNav, setPendingNav, t, ...modals };
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

function useSocietyCreation(setShowSocietyModal) {
  const create = async (form) => {
    try {
      await createSociety(form);
      setShowSocietyModal(false);
    } catch (e) {
      console.error("Failed to create society:", e);
    }
  };
  return create;
}

function GlobalTaskModal({ onClose }) {
  const [lists, setLists] = useState([]);
  const [modules, setModules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    fetchTaskLists()
      .then((res) => setLists(Array.isArray(res) ? res : []))
      .catch(() => { });
    getModules()
      .then((res) => setModules(Array.isArray(res) ? res : []))
      .catch(() => { });
    getEnrollments()
      .then((res) => setEnrollments(Array.isArray(res) ? res : []))
      .catch(() => { });
  }, []);

  const enrolledModules = useMemo(
    () => modules.filter((m) => isEnrolledIn(m.id, enrollments)),
    [modules, enrollments],
  );

  const handleSave = async (data) => {
    try {
      await createTask(data);
      onClose();
      window.dispatchEvent(new Event("task-created"));
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  };

  return (
    <CreateTaskModal
      lists={lists}
      modules={enrolledModules}
      onSave={handleSave}
      onClose={onClose}
    />
  );
}

function DashboardModals({ state }) {
  const createSoc = useSocietyCreation(state.setShowSocietyModal);
  return (
    <>
      <QuickAddGate
        open={state.showQuickAdd}
        onClose={() => state.setShowQuickAdd(false)}
        onSelectType={state.onSelectType}
        isTeacher={state.user?.role === "teacher"}
      />
      <EventModalGate modal={state.modal} />
      {state.showSocietyModal && (
        <CreateSocietyModal
          onClose={() => state.setShowSocietyModal(false)}
          onCreate={createSoc}
        />
      )}
      {state.showTaskModal && (
        <GlobalTaskModal onClose={() => state.setShowTaskModal(false)} />
      )}
      {state.deadlineModule && (
        <DeadlineModal
          module={state.deadlineModule}
          onClose={() => state.setDeadlineModule(null)}
          startCreating={true}
        />
      )}
      {state.readingModule && (
        <ReadingModal
          module={state.readingModule}
          onClose={() => state.setReadingModule(null)}
        />
      )}
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
    setPendingNav,
    setShowTaskModal,
  } = state;
  return (
    <>
      <MainArea
        user={user}
        onQuickAdd={() => {
          if (activeNav === "timer" && t.isActive && !t.isPaused) {
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
      <DashboardModals state={state} />
      <QuickCommandBar
        onNavChange={onNavChange}
        onOpenTask={() => setShowTaskModal(true)}
      />
    </>
  );
}

function handlePendingAction(pendingNav, setShowQuickAdd, onNavChange) {
  if (pendingNav === "QUICK_ADD") setShowQuickAdd(true);
  else onNavChange(pendingNav);
}

function LeaveTimerActions({ pendingNav, setPendingNav, t, setShowQuickAdd, onNavChange }) {
  const onPause = () => {
    if (!t.isPaused) t.togglePause();
    handlePendingAction(pendingNav, setShowQuickAdd, onNavChange);
    setPendingNav(null);
  };
  const onTakeBreak = () => {
    const breakSeconds = 5 * 60;
    t.setMode('break');
    t.setTimeLeft(breakSeconds);
    t.setIsActive(true);
    setPendingNav(null);
  };
  const onExit = () => {
    t.setIsActive(false);
    t.resetTimer();
    handlePendingAction(pendingNav, setShowQuickAdd, onNavChange);
    setPendingNav(null);
  };
  const sessionTotalSeconds = Math.max(
    60,
    Number((t.mode === 'break' ? t.breakTime : t.workTime) || 25) * 60
  );
  return (
    <LeaveTimerModal
      onCancel={() => setPendingNav(null)}
      onPause={onPause}
      onExit={onExit}
      onTakeBreak={onTakeBreak}
      timeLeftSeconds={Math.max(0, Number(t.timeLeft || 0))}
      sessionTotalSeconds={sessionTotalSeconds}
    />
  );
}

function shouldShowBackToTop(activeNav) {
  return activeNav !== "home" && activeNav !== "map" && activeNav !== "modules" && activeNav !== "tasks";
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const { handleNavChange, pendingNav, setPendingNav, t, setShowQuickAdd } = state;
  return (
    <div className={styles.root}>
      <DashboardSidebars {...state} activeNav={activeNav} onSettings={() => handleNavChange("settings")} onLogout={handleLogoutClick} onProfile={() => handleNavChange("profile")} />
      <DashboardMain state={{ ...state, activeNav }} onNavChange={handleNavChange}>{children}</DashboardMain>
      <FloatingChat />
      {pendingNav && <LeaveTimerActions pendingNav={pendingNav} setPendingNav={setPendingNav} t={t} setShowQuickAdd={setShowQuickAdd} onNavChange={onNavChange} />}
      {shouldShowBackToTop(activeNav) && <BackToTop containerSelector="[data-dashboard-main]" />}
    </div>
  );
}
