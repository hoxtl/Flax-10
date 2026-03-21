/*
 * Shared dashboard shell composition.
 */

import styles from "./DashboardLayout.module.css";
<<<<<<< HEAD
import QuickCommandBar from "../components/common/quick_command_bar/QuickCommandBar";
import FloatingChat from "../components/FloatingChat";
import { BackToTop } from "../components/pagination/Pagination";
import { handleLogoutClick, shouldBlockTimerNavigation, shouldShowBackToTop } from "./dashboard_layout/dashboardLayoutActions";
import { useDashboardState } from "./dashboard_layout/dashboardLayoutHooks";
import { DashboardModals, LeaveTimerActions } from "./dashboard_layout/dashboardLayoutModals";
import { DashboardSidebars, MainArea } from "./dashboard_layout/dashboardLayoutSections";
=======
import QuickCommandBar from "../components/common/QuickCommandBar/QuickCommandBar";
import FloatingChat from "../components/FloatingChat";
import { BackToTop } from "../components/Pagination/Pagination";
import { handleLogoutClick, shouldShowBackToTop } from "./dashboardLayout/dashboardLayoutActions";
import { useDashboardState } from "./dashboardLayout/dashboardLayoutHooks";
import { DashboardModals, LeaveTimerActions } from "./dashboardLayout/dashboardLayoutModals";
import { DashboardSidebars, MainArea } from "./dashboardLayout/dashboardLayoutSections";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
<<<<<<< HEAD
  if (shouldBlockTimerNavigation(state.activeNav, state.t)) return state.setPendingNav("QUICK_ADD");
=======
  const shouldPause = state.activeNav === "timer" && state.t.isActive && !state.t.isPaused;
  if (shouldPause) return state.setPendingNav("QUICK_ADD");
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  state.setQuickAddInitialView("type");
  state.setShowQuickAdd(true);
}

export default function DashboardLayout({ activeNav, onNavChange, children }) {
  const state = useDashboardState(activeNav, onNavChange);
  const stateWithNav = { ...state, activeNav };
  return (
<<<<<<< HEAD
    <div className={styles.root} data-role={state.user?.role}>
=======
    <div className={styles.root}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
