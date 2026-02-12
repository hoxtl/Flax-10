import Home from "../pages/Home";
import CalendarPage from "../pages/CalendarPage";
import SocietiesPage from "../pages/SocietiesPage";

export const APP_ROUTES = [
    { id: "home", label: "Home", icon: "🏠", path: "/", element: <Home /> },
    { id: "calendar", label: "Calendar", icon: "🗓️", path: "/calendar", element: <CalendarPage /> },
    { id: "societies", label: "Societies", icon: "👨‍👨‍👧‍👧", path: "/societies", element: <SocietiesPage /> },
    // { id: "todo", label: "To-do", icon: "✅", path: "/todo", element: <Todo /> },
    // { id: "courses", label: "Courses", icon: "📘", path: "/courses", element: <Courses /> }
    // { id: "activities", label: "Activities", icon: "⚡️", path: "/activities", element: <Activities /> }
    // { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", element: <Settings /> }
    // add other routes here later
];