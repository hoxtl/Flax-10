import Home from "../pages/Home";
import Tasks from "../pages/Tasks";

// import Calendar from "../pages/Calendar"; etc....

export const APP_ROUTES = [
    { id: "home", label: "Home", icon: "🏠", path: "/", element: <Home /> },
    { id: "tasks", label: "Tasks", icon: "📝", path: "/tasks", element: <Tasks /> },
    // { id: "calendar", label: "Calendar", icon: "📅", path: "/calendar", element: <Calendar /> },
    // { id: "todo", label: "To-do", icon: "✅", path: "/todo", element: <Todo /> },
    // { id: "courses", label: "Courses", icon: "📘", path: "/courses", element: <Courses /> }
    // { id: "activities", label: "Activities", icon: "⚡️", path: "/activities", element: <Activities /> }
    // { id: "settings", label: "Settings", icon: "⚙️", path: "/settings", element: <Settings /> }
    // add other routes here later
];