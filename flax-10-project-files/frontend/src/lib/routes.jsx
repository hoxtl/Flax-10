/*
 * Defines all app routes and their page components for the dashboard.
 */

<<<<<<< HEAD
import Homepage from "../pages/homepage/Homepage";
import CalendarPage from "../pages/calendar/CalendarPage";
import SocietiesPage from "../pages/societies/SocietiesPage";
import ModulesPage from "../pages/modules/ModulesPage";
import CampusMap from "../pages/campus_map/CampusMap";
import TimerPage from "../pages/timer/TimerPage";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";
import AdminPage from "../pages/admin/AdminPage";
import TasksPage from "../pages/tasks/TasksPage";
import GroupWorkIndexPage from "../pages/group_work/GroupWorkIndexPage";
import Discover from "../pages/discover/Discover";
import AttendancePage from "../pages/attendance/AttendancePage";
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
    label: "My Venio Details",
    icon: "✔️",
    path: "/attendance",
    element: <AttendancePage />,
<<<<<<< HEAD
    studentOnly: true,
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  },
  {
    id: "timer",
    label: "Focus Timer",
    icon: "⏲️",
    path: "/timer",
    element: <TimerPage />,
  },
  {
    id: "tasks",
    label: "To-do Tasks",
    icon: "✅",
    path: "/tasks",
    element: <TasksPage />,
  },
  {
    id: "group-work",
<<<<<<< HEAD
    label: "Group Projects",
    icon: "🤝",
    path: "/group-work",
    element: <GroupWorkIndexPage />,
    studentOnly: true,
=======
    label: "Group Study",
    icon: "🤝",
    path: "/group-work",
    element: <GroupWorkIndexPage />,
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
    studentOnly: true,
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  },
  {
    id: "modules",
    label: "Modules",
<<<<<<< HEAD
    teacherLabel: "Manage My Modules",
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
