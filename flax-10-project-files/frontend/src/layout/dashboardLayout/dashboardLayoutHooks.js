/*
 * Dashboard layout state hooks.
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useCalendar, useEventModal } from "../../context/CalendarContext";
import { useTimerContext } from "../../context/TimerContext";
import useBreakpoint from "../../hooks/useBreakpoint";
import { resolveQuickAddModal, shouldBlockTimerNavigation } from "./dashboardLayoutActions";
import { getStoredUser } from "./dashboardLayoutUser";

export function useUserSync() {
  const [user, setUser] = useState(() => getStoredUser());
  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    window.addEventListener("auth-changed", syncUser);
    return () => window.removeEventListener("auth-changed", syncUser);
  }, []);
  return user;
}

export function useModalStates() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [deadlineModule, setDeadlineModule] = useState(null);
  const [readingModule, setReadingModule] = useState(null);
  const [quickAddInitialView, setQuickAddInitialView] = useState("type");
  return {
    showQuickAdd, setShowQuickAdd, showSocietyModal, setShowSocietyModal,
    showTaskModal, setShowTaskModal, deadlineModule, setDeadlineModule,
    readingModule, setReadingModule, quickAddInitialView, setQuickAddInitialView,
  };
}

export function useTimerNav(activeNav, onNavChange, timer) {
  const [pendingNav, setPendingNav] = useState(null);
  const handleNavChange = (nav) => {
    if (shouldBlockTimerNavigation(activeNav, timer) && nav !== "timer") return setPendingNav(nav);
    return onNavChange?.(nav);
  };
  return { pendingNav, setPendingNav, handleNavChange };
}

export function useQuickAddListener(setQuickAddInitialView, setShowQuickAdd) {
  useEffect(() => {
    const openQuickAdd = (event) => {
      setQuickAddInitialView(event?.detail?.view || "type");
      setShowQuickAdd(true);
    };
    window.addEventListener("quick-add:open", openQuickAdd);
    return () => window.removeEventListener("quick-add:open", openQuickAdd);
  }, [setQuickAddInitialView, setShowQuickAdd]);
}

export function useDashboardState(activeNav, onNavChange) {
  const location = useLocation();
  const isMobile = useBreakpoint(900);
  const user = useUserSync();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const modals = useModalStates();
  const calendarState = useCalendar();
  const modal = useEventModal();
  const timer = useTimerContext();
  const selectedDate = calendarState?.selectedDate || new Date();
  const showWeekBar = activeNav === "calendar" || location.pathname.startsWith("/calendar");
  const timerNav = useTimerNav(activeNav, onNavChange, timer);
  useQuickAddListener(modals.setQuickAddInitialView, modals.setShowQuickAdd);
  return buildDashboardState({
    activeNav, isMobile, user, mobileSidebarOpen, setMobileSidebarOpen,
    modals, modal, timer, timerNav, selectedDate, showWeekBar,
  });
}

function buildDashboardState({
  isMobile,
  user,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  modals,
  modal,
  timer,
  timerNav,
  selectedDate,
  showWeekBar,
}) {
  const onPickNav = (id) => pickNav(id, timerNav.handleNavChange, setMobileSidebarOpen);
  const onSelectType = (id, extra) => selectQuickAddType(id, extra, modals, modal, selectedDate, onPickNav);
  return {
    isMobile, user, mobileSidebarOpen, setMobileSidebarOpen, selectedDate,
    showWeekBar, modal, onPickNav, onSelectType, t: timer, ...timerNav, ...modals,
  };
}

function pickNav(id, handleNavChange, setMobileSidebarOpen) {
  handleNavChange(id);
  setMobileSidebarOpen(false);
}

function selectQuickAddType(id, extra, modals, modal, selectedDate, onPickNav) {
  modals.setShowQuickAdd(false);
  modals.setQuickAddInitialView("type");
  resolveQuickAddModal(id, extra, {
    openSociety: () => modals.setShowSocietyModal(true),
    openTask: () => modals.setShowTaskModal(true),
    openModuleCreator: () => onPickNav("modules_create"),
    openDeadline: (module) => modals.setDeadlineModule(module),
    openReading: (module) => modals.setReadingModule(module),
    openCalendar: (type) => modal.openModal(null, type, selectedDate),
  });
}
