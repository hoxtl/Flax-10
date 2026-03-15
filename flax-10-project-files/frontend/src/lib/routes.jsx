import Homepage from "../pages/Homepage/Homepage";
import CalendarPage from "../pages/Calendar/CalendarPage";
import SocietiesPage from "../pages/Societies/SocietiesPage";
import ModulesPage from "../pages/Modules/ModulesPage";
import CampusMap from "../pages/CampusMap/CampusMap";
import TimerPage from "../pages/Timer/TimerPage";
import AnalyticsPage from "../pages/Analytics/AnalyticsPage";
import AdminPage from "../pages/AdminPage";
import Discover from "../pages/Discover/Discover";
import SchedulesPage from "../pages/Schedules/SchedulesPage";

export const APP_ROUTES = [
    { id: "home", label: "Home", icon: "🏠", path: "/", element: <Homepage /> },
    { id: "calendar", label: "Calendar", icon: "🗓️", path: "/calendar", element: <CalendarPage /> },
    { id: "timer", label: "Timer", icon: "⏲️", path: "/timer", element: <TimerPage /> },
    { id: "users", label: "Users", icon: "🔍", path: "/users", element: <Discover /> },
    { id: "societies", label: "Societies", icon: "👨‍👨‍👧‍👧", path: "/societies", element: <SocietiesPage /> },
    { id: "modules", label: "Modules", icon: "📚", path: "/modules", element: <ModulesPage /> },
    { id: "map", label: "UniMap", icon: "🗺️", path: "/map", element: <CampusMap /> },
    { id: "analytics", label: "Analytics", icon: "📊", path: "/analytics", element: <AnalyticsPage /> },
    { id: "admin", label: "Admin", icon: "🛡️", path: "/admin", element: <AdminPage />, isAdminOnly: true },
    { id: "schedules", label: "Schedules", icon: "🗂️", path: "/schedules", element: <SchedulesPage /> },
    // { id: "todo", label: "To-do", icon: "✅", path: "/todo", element: <Todo /> },
    // { id: "courses", label: "Courses", icon: "📘", path: "/courses", element: <Courses /> }
    // { id: "activities", label: "Activities", icon: "⚡️", path: "/activities", element: <Activities /> }
    // { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", element: <Settings /> }
    // add other routes here later
];
