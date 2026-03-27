/*
 * Admin tab configuration.
 */

import CourseChangeRequestsTab from "./CourseChangeRequestsTab";
import RatificationsTab from "./RatificationsTab";
import ReportedSocietiesTab from "./ReportedSocietiesTab";
import UsersTab from "./UsersTab";

export function buildAdminTabs(onNavigate) {
  return [
    { id: "users", icon: "👤", label: "Users Overview", content: <UsersTab onNavigate={onNavigate} /> },
    { id: "ratifications", icon: "🤝", label: "Society Ratifications", content: <RatificationsTab /> },
    { id: "reports", icon: "🚩", label: "Reported Societies", content: <ReportedSocietiesTab /> },
    { id: "course-changes", icon: "📚", label: "Course Switch Requests", content: <CourseChangeRequestsTab onNavigate={onNavigate} /> },
  ];
}
