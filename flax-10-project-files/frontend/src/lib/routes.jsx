import Home from "../pages/Home";
import CalendarPage from "../pages/CalendarPage";
import ModulesPage from "../pages/ModulesPage";
import CampusMap from "../pages/CampusMap";

export const APP_ROUTES = [
    { id: "home", label: "Home", icon: "🏠", path: "/", element: <Home /> },
    { id: "calendar", label: "Calendar", icon: "🗓️", path: "/calendar", element: <CalendarPage /> },
    { id: "modules", label: "Modules", icon: "📚", path: "/modules", element: <ModulesPage />},
    { id: "map", label: "UniMap", icon: "🗺️", path: "/map", element: <CampusMap /> },
    // { id: "courses", label: "Courses", icon: "📘", path: "/courses", element: <Courses /> }
    // { id: "activities", label: "Activities", icon: "⚡️", path: "/activities", element: <Activities /> }
    // { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", element: <Settings /> }
    // add other routes here later
];