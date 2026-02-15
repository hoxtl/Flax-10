import Home from "../pages/Home";
import CalendarPage from "../pages/CalendarPage";

export const APP_ROUTES = [
    { id: "home", label: "Home", icon: "🏠", path: "/", element: <Home /> },
    { id: "calendar", label: "Calendar", icon: "🗓️", path: "/calendar", element: <CalendarPage /> },
    // { id: "courses", label: "Courses", icon: "📘", path: "/courses", element: <Courses /> }
    // { id: "activities", label: "Activities", icon: "⚡️", path: "/activities", element: <Activities /> }
    // { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", element: <Settings /> }
    // add other routes here later
];