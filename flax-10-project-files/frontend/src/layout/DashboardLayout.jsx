/*
 * Shared dashboard shell composition.
 */

import styles from "./DashboardLayout.module.css";
import QuickCommandBar from "../components/common/QuickCommandBar/QuickCommandBar";
import FloatingChat from "../components/FloatingChat";
import { BackToTop } from "../components/Pagination/Pagination";
import { handleLogoutClick, shouldBlockTimerNavigation, shouldShowBackToTop } from "./dashboardLayout/dashboardLayoutActions";
import { useDashboardState } from "./dashboardLayout/dashboardLayoutHooks";
import { DashboardModals, LeaveTimerActions } from "./dashboardLayout/dashboardLayoutModals";
import { DashboardSidebars, MainArea } from "./dashboardLayout/dashboardLayoutSections";

function DashboardMain({ state, onNavChange, children }) {
  return (
    <>
      <MainArea {...getMainAreaProps(state, onNavChange)}>
        {children}
      </MainArea>
      <DashboardModals state={state} />
      <QuickCommandBar onNavChange={onNavChange} onOpenTask={() => state.setShowTaskModal(true)} />
    </>
  );
}

function getMainAreaProps(state, onNavChange) {
  return {
    user: state.user,
    onQuickAdd: () => handleQuickAdd(state),
    onSettingsClick: () => onNavChange?.("settings"),
    onLogoutClick: handleLogoutClick,
    onProfileClick: () => onNavChange?.("profile"),
    onNavChange,
    activeNav: state.activeNav,
    selectedDate: state.selectedDate,
    showWeekBar: state.showWeekBar,
    isMobile: state.isMobile,
  };
}

function handleQuickAdd(state) {
  if (shouldBlockTimerNavigation(state.activeNav, state.t)) return state.setPendingNav("QUICK_ADD");
  state.setQuickAddInitialView("type");
  state.setShowQuickAdd(true);
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const stateWithNav = { ...state, activeNav };
  return (
    <div className={styles.root} data-role={state.user?.role}>
      <DashboardSidebars {...getSidebarProps(state, activeNav)} />
      <DashboardMain state={stateWithNav} onNavChange={state.handleNavChange}>{children}</DashboardMain>
      <FloatingChat />
      <PendingTimerGate state={state} onNavChange={onNavChange} />
      {shouldShowBackToTop(activeNav) && <BackToTop containerSelector="[data-dashboard-main]" />}
    </div>
  );
}

function getSidebarProps(state, activeNav) {
  return {
    ...state,
    activeNav,
    onSettings: () => state.handleNavChange("settings"),
    onLogout: handleLogoutClick,
    onProfile: () => state.handleNavChange("profile"),
  };
}

function PendingTimerGate({ state, onNavChange }) {
  if (!state.pendingNav) return null;
  return <LeaveTimerActions {...getPendingTimerProps(state, onNavChange)} />;
}

function getPendingTimerProps(state, onNavChange) {
  return {
    pendingNav: state.pendingNav,
    setPendingNav: state.setPendingNav,
    t: state.t,
    setShowQuickAdd: state.setShowQuickAdd,
    onNavChange,
  };
}
