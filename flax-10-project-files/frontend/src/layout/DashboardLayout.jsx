import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

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
import { BackToTop } from "../components/Pagination/Pagination";
import CreateSocietyModal from "../components/Society/CreateSocietyModal";
import DeadlineModal from "../components/Modules/DeadlineModal";
import { createSociety } from "../api/societyApi";
import { createTask, fetchTaskLists } from "../api/taskService";
import { getModules, getEnrollments } from "../api/moduleApi";
import { isEnrolledIn } from "../components/Modules/utils/moduleUtils";
import { useNotifications } from "../context/NotificationContext";
import CreateTaskModal from "../pages/Tasks/components/CreateTaskModal";
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
    </div>
  );
}

function QuickAddGate({ open, onClose, onSelectType, isTeacher }) {
  if (!open) return null;
  return <QuickAddModal onClose={onClose} onSelectType={onSelectType} isTeacher={isTeacher} />;
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
  const [user, setUser] = useState(() => getUser());
  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [deadlineModule, setDeadlineModule] = useState(null);
  const calendarState = useCalendar();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar = activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const modal = useEventModal();
  const t = useTimerContext();
  const [pendingNav, setPendingNav] = useState(null);

  const handleNavChange = (nav) => {
    if (activeNav === "timer" && t.isActive && !t.isPaused && nav !== "timer") {
      setPendingNav(nav);
    } else {
      onNavChange?.(nav);
    }
  };

  const onPickNav = (id) => {
    handleNavChange(id);
    setMobileSidebarOpen(false);
  };
  const onSelectType = (id, extra) => {
    setShowQuickAdd(false);
    if (id === 'society') setShowSocietyModal(true);
    else if (id === 'task') setShowTaskModal(true);
    else if (id === 'create_module') onPickNav('modules_create');
    else if (id === 'add_deadline') setDeadlineModule(extra);
    else modal.openModal(null, id, selectedDate);
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
    showSocietyModal,
    setShowSocietyModal,
    showTaskModal,
    setShowTaskModal,
    deadlineModule,
    setDeadlineModule,
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
  const { addNotification } = useNotifications();
  const create = async (form) => {
    try {
      await createSociety(form);
      addNotification("Society created successfully!", "success");
      setShowSocietyModal(false);
    } catch (e) { addNotification("Failed to create society.", "error"); }
  };
  return create;
}

function GlobalTaskModal({ onClose }) {
  const { addNotification } = useNotifications();
  const [lists, setLists] = useState([]);
  const [modules, setModules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    fetchTaskLists().then(res => setLists(Array.isArray(res) ? res : [])).catch(() => { });
    getModules().then(res => setModules(Array.isArray(res) ? res : [])).catch(() => { });
    getEnrollments().then(res => setEnrollments(Array.isArray(res) ? res : [])).catch(() => { });
  }, []);

  const enrolledModules = useMemo(() =>
    modules.filter(m => isEnrolledIn(m.id, enrollments)),
    [modules, enrollments]);

  const handleSave = async (data) => {
    try {
      await createTask(data);
      addNotification("Task created successfully!", "success");
      onClose();
      // Dispatch an event so views (like Homepage) know to refetch tasks
      window.dispatchEvent(new Event("task-created"));
    } catch {
      addNotification("Failed to create task.", "error");
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
      <QuickAddGate open={state.showQuickAdd} onClose={() => state.setShowQuickAdd(false)}
        onSelectType={state.onSelectType} isTeacher={state.user?.role === 'teacher'} />
      <EventModalGate modal={state.modal} />
      {state.showSocietyModal && <CreateSocietyModal onClose={() => state.setShowSocietyModal(false)} onCreate={createSoc} />}
      {state.showTaskModal && <GlobalTaskModal onClose={() => state.setShowTaskModal(false)} />}
      {state.deadlineModule && <DeadlineModal module={state.deadlineModule} onClose={() => state.setDeadlineModule(null)} startCreating={true} />}
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
    </>
  );
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const { isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, onPickNav, handleNavChange, pendingNav, setPendingNav, t, setShowQuickAdd } = state;
  return (
    <div className={styles.root}>
      <DashboardSidebars
        {...state}
        activeNav={activeNav}
        onSettings={() => handleNavChange("settings")}
        onLogout={handleLogoutClick}
        onProfile={() => handleNavChange("profile")}
      />
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

      {activeNav !== "map" &&
        activeNav !== "modules" &&
        activeNav !== "tasks" && (
          <BackToTop containerSelector="[data-dashboard-main]" />
        )}
    </div>
  );
}
