/*
 * Dashboard action helpers.
 */

import { authService } from "../../api/authService";
import { clearUserData } from "../../components/Authentication/utils/authHelpers";

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
  const hiddenPages = ["home", "map", "modules", "tasks"];
  return !hiddenPages.includes(activeNav);
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
