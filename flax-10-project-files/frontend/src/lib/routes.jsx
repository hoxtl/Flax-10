import Home from "../pages/Home/Home";
import CalendarPage from "../pages/Calendar/CalendarPage";
import SocietiesPage from "../pages/Societies/SocietiesPage";
import ModulesPage from "../pages/Modules/ModulesPage";
import CampusMap from "../pages/CampusMap/CampusMap";
import TimerPage from "../pages/Timer/TimerPage";
import AnalyticsPage from "../pages/Analytics/AnalyticsPage";
import AdminPage from "../pages/AdminPage";
import TasksPage from "../pages/Tasks/TasksPage";

export const APP_ROUTES = [
    { id: "home",      label: "Home",      icon: "🏠",          path: "/",          element: <Home /> },
    { id: "calendar",  label: "Calendar",  icon: "🗓️",          path: "/calendar",  element: <CalendarPage /> },
    { id: "timer",     label: "Timer",     icon: "⏲️",          path: "/timer",     element: <TimerPage /> },
    { id: "tasks",     label: "Tasks",     icon: "✅",          path: "/tasks",     element: <TasksPage /> },
    { id: "societies", label: "Societies", icon: "👨‍👨‍👧‍👧",  path: "/societies", element: <SocietiesPage /> },
    { id: "modules",   label: "Modules",   icon: "📚",          path: "/modules",   element: <ModulesPage /> },
    { id: "map",       label: "UniMap",    icon: "🗺️",          path: "/map",       element: <CampusMap /> },
    { id: "analytics", label: "Analytics", icon: "📊",          path: "/analytics", element: <AnalyticsPage /> },
    { id: "admin",     label: "Admin",     icon: "🛡️",          path: "/admin",     element: <AdminPage />, isAdminOnly: true },
];