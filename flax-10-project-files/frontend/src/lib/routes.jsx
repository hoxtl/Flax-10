import Home from "../pages/Home";
import CalendarPage from "../pages/CalendarPage";
import TimerPage from "../pages/TimerPage";
import ModulesPage from "../pages/ModulesPage"

export const APP_ROUTES = [
    { id: "home", label: "Home", icon: "🏠", path: "/", element: <Home /> },
    { id: "calendar", label: "Calendar", icon: "🗓️", path: "/calendar", element: <CalendarPage /> },
    { id: "timer", label: "Timer", icon: "⏲️", path: "/timer", element: <TimerPage /> },
    // { id: "todo", label: "To-do", icon: "✅", path: "/todo", element: <Todo /> },
    { id: "modules", label: "Modules", icon: "📚", path: "/modules", element: <ModulesPage /> },
    // { id: "courses", label: "Courses", icon: "📘", path: "/courses", element: <Courses /> }
    // { id: "activities", label: "Activities", icon: "⚡️", path: "/activities", element: <Activities /> }
    // { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", element: <Settings /> }
    // add other routes here later
];