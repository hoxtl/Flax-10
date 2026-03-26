/*
 * Sidebar route and deadline helpers.
 */

import { APP_ROUTES } from "../../../lib/routes";
import { MS_48H } from "./sidebarConstants";

export function getSidebarRoutes(user) {
  return APP_ROUTES.filter((route) => !route.isAdminOnly || user?.isAdmin);
}

export function getDeadlineTime(deadline) {
  if (!deadline?.start_due_date) return NaN;
  return new Date(deadline.start_due_date).getTime();
}

export function hasDeadlineWithin48Hours(deadlines) {
  if (!Array.isArray(deadlines) || deadlines.length === 0) return false;
  const now = Date.now();
  return deadlines.some((deadline) => isUpcomingDeadline(deadline, now));
}

function isUpcomingDeadline(deadline, now) {
  const due = getDeadlineTime(deadline);
  const remaining = due - now;
  return Number.isFinite(due) && remaining > 0 && remaining < MS_48H;
}
