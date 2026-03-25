/*
 * Admin tab configuration.
 */

import CourseChangeRequestsTab from "./components/CourseChangeRequestsTab";
import RatificationsTab from "./components/RatificationsTab";
import ReportedSocietiesTab from "./components/ReportedSocietiesTab";
import UsersTab from "./components/UsersTab";

export function buildAdminTabs(onNavigate) {
  return [
    { id: "users", icon: "👤", label: "Users Overview", content: <UsersTab onNavigate={onNavigate} /> },
    { id: "ratifications", icon: "🤝", label: "Society Ratifications", content: <RatificationsTab /> },
    { id: "reports", icon: "🚩", label: "Reported Societies", content: <ReportedSocietiesTab /> },
    { id: "course-changes", icon: "📚", label: "Course Switch Requests", content: <CourseChangeRequestsTab onNavigate={onNavigate} /> },
  ];
}
