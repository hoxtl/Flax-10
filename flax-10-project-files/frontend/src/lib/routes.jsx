import Homepage from "../pages/Homepage/Homepage";
import CalendarPage from "../pages/Calendar/CalendarPage";
import SocietiesPage from "../pages/Societies/SocietiesPage";
import ModulesPage from "../pages/Modules/ModulesPage";
import CampusMap from "../pages/CampusMap/CampusMap";
import TimerPage from "../pages/Timer/TimerPage";
import AnalyticsPage from "../pages/Analytics/AnalyticsPage";
import AdminPage from "../pages/Admin/AdminPage";
import TasksPage from "../pages/Tasks/TasksPage";
import GroupWorkIndexPage from "../pages/GroupWork/GroupWorkIndexPage";
import Discover from "../pages/Discover/Discover";
import AttendancePage from "../pages/Attendance/AttendancePage";

export const APP_ROUTES = [
  { id: "home", label: "Home", icon: "🏠", path: "/", element: <Homepage /> },
  {
    id: "calendar",
    label: "Calendar",
    icon: "🗓️",
    path: "/calendar",
    element: <CalendarPage />,
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: "✔️",
    path: "/attendance",
    element: <AttendancePage />,
  },
  {
    id: "timer",
    label: "Timer",
    icon: "⏲️",
    path: "/timer",
    element: <TimerPage />,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "✅",
    path: "/tasks",
    element: <TasksPage />,
  },
  {
    id: "group-work",
    label: "Group Work",
    icon: "🤝",
    path: "/group-work",
    element: <GroupWorkIndexPage />,
  },
  {
    id: "users",
    label: "Users",
    icon: "🔍",
    path: "/users",
    element: <Discover />,
  },
  {
    id: "societies",
    label: "Societies",
    icon: "👥",
    path: "/societies",
    element: <SocietiesPage />,
  },
  {
    id: "modules",
    label: "Modules",
    icon: "📚",
    path: "/modules",
    element: <ModulesPage />,
  },
  {
    id: "map",
    label: "UniMap",
    icon: "🗺️",
    path: "/map",
    element: <CampusMap />,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "📊",
    path: "/analytics",
    element: <AnalyticsPage />,
  },
  {
    id: "admin",
    label: "Admin",
    icon: "🛡️",
    path: "/admin",
    element: <AdminPage />,
    isAdminOnly: true,
  },
];
