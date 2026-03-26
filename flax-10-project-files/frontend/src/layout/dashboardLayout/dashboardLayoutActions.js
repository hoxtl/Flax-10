/*
 * Dashboard action helpers.
 */

import { authService } from "../../api/authenticationApi";
import { clearUserData } from "../../components/Authentication/utils/authenticationHelpers";

export async function handleLogoutClick() {
  try {
    await authService.logout();
  } catch {
    // Ignore logout failures and still clear local auth state.
  } finally {
    clearUserData();
  }
}

export function shouldShowBackToTop(activeNav) {
  const hiddenPages = ["home", "map", "modules", "tasks", "group-work"];
  return !hiddenPages.includes(activeNav);
}

export function shouldBlockTimerNavigation(activeNav, timer) {
  const mode = timer?.mode || "work";
  return activeNav === "timer" && timer?.isActive && !timer?.isPaused && mode === "work";
}

export function resolveQuickAddModal(id, extra, actions) {
  if (id === "society") return actions.openSociety();
  if (id === "task") return actions.openTask();
  if (id === "create_module") return actions.openModuleCreator();
  if (id === "add_deadline") return actions.openDeadline(extra);
  if (id === "add_reading") return actions.openReading(extra);
  return actions.openCalendar(id);
}

export function handlePendingAction(pendingNav, setShowQuickAdd, onNavChange) {
  if (pendingNav === "QUICK_ADD") return setShowQuickAdd(true);
  return onNavChange?.(pendingNav);
}
