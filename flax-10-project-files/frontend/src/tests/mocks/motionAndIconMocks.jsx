import { vi } from "vitest";

const PlainWrapper = ({ children, ...props }) => <div {...props}>{children}</div>;

vi.mock("framer-motion", () => {
    const handler = (target, prop) => {
        if (prop === "then" || prop === "__esModule" || typeof prop === "symbol") return Reflect.get(target, prop);
        return PlainWrapper;
    };
    return {
        AnimatePresence: ({ children }) => <>{children}</>,
        motion: new Proxy({}, { get: handler }),
    };
});

const makeIcon = (iconName) => ({ children, ...props }) => <span data-testid={`icon-${String(iconName)}`} {...props}>{children}</span>;

vi.mock("lucide-react", () => ({
    Home: makeIcon("Home"),
    Calendar: makeIcon("Calendar"),
    Clock: makeIcon("Clock"),
    Users: makeIcon("Users"),
    BarChart2: makeIcon("BarChart2"),
    ClipboardCheck: makeIcon("ClipboardCheck"),
    Plus: makeIcon("Plus"),
    X: makeIcon("X"),
    ChevronRight: makeIcon("ChevronRight"),
    ChevronLeft: makeIcon("ChevronLeft"),
    Settings: makeIcon("Settings"),
    User: makeIcon("User"),
    LogOut: makeIcon("LogOut"),
    Search: makeIcon("Search"),
    Menu: makeIcon("Menu"),
    MoreVertical: makeIcon("MoreVertical"),
    Trash2: makeIcon("Trash2"),
    Edit2: makeIcon("Edit2"),
    CheckCircle2: makeIcon("CheckCircle2"),
    Circle: makeIcon("Circle"),
    AlertCircle: makeIcon("AlertCircle"),
    Info: makeIcon("Info"),
    ExternalLink: makeIcon("ExternalLink"),
    ChevronUp: makeIcon("ChevronUp"),
    ChevronDown: makeIcon("ChevronDown"),
    ArrowRight: makeIcon("ArrowRight"),
    ArrowLeft: makeIcon("ArrowLeft"),
    GripVertical: makeIcon("GripVertical"),
    Link: makeIcon("Link"),
    Play: makeIcon("Play"),
    Pause: makeIcon("Pause"),
    RefreshCw: makeIcon("RefreshCw"),
    Camera: makeIcon("Camera"),
    Image: makeIcon("Image"),
    Video: makeIcon("Video"),
    FileText: makeIcon("FileText"),
    Mic: makeIcon("Mic"),
    default: new Proxy({}, { get: (_, prop) => makeIcon(prop) })
}));
