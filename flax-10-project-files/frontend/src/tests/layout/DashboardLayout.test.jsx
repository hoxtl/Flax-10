import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockOpenModal = vi.fn();

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: vi.fn(() => ({ selectedDate: new Date() })),
  useEventModal: vi.fn(() => ({
    isModalOpen: false,
    closeModal: vi.fn(),
    openModal: mockOpenModal,
    modalEvent: null,
    modalType: null,
    modalInitialDate: null,
  })),
}));

import DashboardLayout from "../../layout/DashboardLayout";
import { authService } from "../../api/authService";
import { clearUserData } from "../../components/Authentication/utils/authHelpers";
import { useEventModal, useCalendar } from "../../context/CalendarContext";
import { useLocation } from "react-router-dom";

vi.mock("../../components/Dashboard/Sidebar", () => ({
  default: ({ user, onChange, onSettingsClick, onLogoutClick, onProfileClick, onToggle }) => (
    <div data-testid="sidebar">
      <span>User: {user?.name}</span>
      <button onClick={() => onChange("settings")}>Nav to Settings</button>
      <button onClick={() => onChange("timer")}>Nav to Timer</button>
      <button onClick={onSettingsClick}>Sidebar Settings</button>
      <button onClick={onLogoutClick}>Sidebar Logout</button>
      <button onClick={onProfileClick}>Sidebar Profile</button>
      <button onClick={onToggle}>Toggle Sidebar</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/Topbar", () => ({
  default: ({ onLogoutClick, onAddClick, onSettingsClick, onProfileClick, onNavChange }) => (
    <div data-testid="topbar">
      <button onClick={onLogoutClick}>Logout</button>
      <button onClick={onAddClick}>Quick Add</button>
      <button onClick={onSettingsClick}>Settings</button>
      <button onClick={onProfileClick}>Profile</button>
      <button onClick={() => onNavChange?.("other")}>Nav Other</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/WeekBar", () => ({
  default: () => <div data-testid="weekbar" />,
}));

vi.mock("../../components/Dashboard/QuickAddModal", () => ({
  default: ({ onClose, onSelectType }) => (
    <div data-testid="quick-add-modal">
      <button onClick={onClose}>Close Quick Add</button>
      <button onClick={() => onSelectType("event", null)}>Add Event</button>
      <button onClick={() => onSelectType("society", null)}>Add Society</button>
      <button onClick={() => onSelectType("task", null)}>Add Task</button>
      <button onClick={() => onSelectType("create_module", null)}>Add Module</button>
      <button onClick={() => onSelectType("add_deadline", { id: 1, module_code: "CS101" })}>Add Deadline</button>
    </div>
  ),
}));

vi.mock("../../components/Calendar/EventModal/EventModal", () => ({
  EventModal: ({ onClose }) => (
    <div data-testid="event-modal">
      <button onClick={onClose}>Close Event Modal</button>
    </div>
  ),
}));

vi.mock("../../components/Society/CreateSocietyModal", () => ({
  default: ({ onClose, onCreate }) => (
    <div data-testid="society-modal">
      <button onClick={onClose}>Close Society Modal</button>
      <button onClick={() => onCreate({ name: "Soc", description: "" })}>Create Society</button>
    </div>
  ),
}));

vi.mock("../../components/Modules/DeadlineModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="deadline-modal">
      <button onClick={onClose}>Close Deadline Modal</button>
    </div>
  ),
}));

vi.mock("../../components/Timer/TimerPopups", () => ({
  LeaveTimerModal: ({ onCancel, onPause, onExit }) => (
    <div data-testid="leave-timer-modal">
      <button onClick={onCancel}>Stay</button>
      <button onClick={onPause}>Pause and Leave</button>
      <button onClick={onExit}>Exit Timer</button>
    </div>
  ),
}));

vi.mock("../../components/FloatingChat", () => ({
  default: () => <div data-testid="floating-chat" />,
}));

vi.mock("../../components/Pagination/Pagination", () => ({
  BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock("../../pages/Tasks/components/CreateTaskModal", () => ({
  default: ({ onClose, onSave }) => (
    <div data-testid="create-task-modal">
      <button onClick={onClose}>Close Task Modal</button>
      <button onClick={() => onSave && onSave({ title: "New Task" })}>Save Task</button>
    </div>
  ),
}));

vi.mock("../../api/authService", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Authentication/utils/authHelpers", () => ({ clearUserData: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({ pathname: "/", search: "", hash: "", state: null, key: "default" })),
}));

const mockTimerContext = {
  isActive: false,
  isPaused: false,
  timeLeft: 1500,
  togglePause: vi.fn(),
  setIsActive: vi.fn(),
  resetTimer: vi.fn(),
};
vi.mock("../../context/TimerContext", () => ({
  useTimerContext: vi.fn(() => mockTimerContext),
}));

vi.mock("../../context/NotificationContext", () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

vi.mock("../../api/societyApi", () => ({
  createSociety: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../api/taskService", () => ({
  createTask: vi.fn().mockResolvedValue({}),
  fetchTaskLists: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]),
  getEnrollments: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../components/Modules/utils/moduleUtils", () => ({
  isEnrolledIn: vi.fn(() => false),
}));

const mockStore = {};
vi.stubGlobal('localStorage', {
  setItem: (key, val) => { mockStore[key] = val.toString(); },
  getItem: (key) => mockStore[key] || null,
  removeItem: (key) => { delete mockStore[key]; },
});

describe("DashboardLayout", () => {
  const mockUser = {
    name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    username: "jdoe",
    email: "j@d.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useEventModal.mockReturnValue({
      isModalOpen: false,
      closeModal: vi.fn(),
      openModal: mockOpenModal,
      modalEvent: null,
      modalType: null,
      modalInitialDate: null,
    });
    useCalendar.mockReturnValue({ selectedDate: new Date() });
    mockTimerContext.isActive = false;
    mockTimerContext.isPaused = false;
    useLocation.mockReturnValue({ pathname: "/", search: "", hash: "", state: null, key: "default" });
    localStorage.setItem("user", JSON.stringify(mockUser));
    global.innerWidth = 1024;
    global.dispatchEvent(new Event("resize"));
  });

  it("renders Desktop view with Topbar and content", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("renders FloatingChat", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("floating-chat")).toBeTruthy();
  });

  it("does not render BackToTop for home page", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("does not render BackToTop on map page", () => {
    render(<DashboardLayout activeNav="map" onNavChange={() => {}}>Map</DashboardLayout>);
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("does not render BackToTop on modules page", () => {
    render(<DashboardLayout activeNav="modules" onNavChange={() => {}}>Modules</DashboardLayout>);
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("does not render BackToTop on tasks page", () => {
    render(<DashboardLayout activeNav="tasks" onNavChange={() => {}}>Tasks</DashboardLayout>);
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("handles logout flow", async () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Logout"));
    expect(authService.logout).toHaveBeenCalled();
    await waitFor(() => {
      expect(clearUserData).toHaveBeenCalled();
    });
  });

  it("navigates to settings when Settings clicked", () => {
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Settings"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("navigates to profile when Profile clicked", () => {
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Profile"));
    expect(onNavChange).toHaveBeenCalledWith("profile");
  });

  it("Topbar Nav Other calls onNavChange", () => {
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav Other"));
    expect(onNavChange).toHaveBeenCalledWith("other");
  });

  it("handles undefined onNavChange without throwing", () => {
    render(<DashboardLayout activeNav="home" onNavChange={undefined}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Settings"));
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Close Quick Add"));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("parseStoredUser sets isAdmin from is_superuser", () => {
    localStorage.setItem("user", JSON.stringify({ ...mockUser, is_superuser: true }));
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows sidebar on mobile", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByText("User: John Doe")).toBeTruthy();
  });

  it("useIsMobile resize listener updates isMobile when window is resized", async () => {
    global.innerWidth = 1000;
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).toBeNull();
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.queryByTestId("topbar")).toBeNull();
    });
  });

  it("sidebar Settings and Profile call handleNavChange on mobile", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Sidebar Settings"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
    fireEvent.click(screen.getByText("Sidebar Profile"));
    expect(onNavChange).toHaveBeenCalledWith("profile");
  });

  it("sidebar Logout on mobile triggers handleLogoutClick", async () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Sidebar Logout"));
    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
  });

  it("sidebar Toggle on mobile toggles mobileSidebarOpen", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Toggle Sidebar"));
    fireEvent.click(screen.getByText("Toggle Sidebar"));
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("applies specific styles for the Map page", () => {
    const { container } = render(
      <DashboardLayout activeNav="map" onNavChange={() => {}}>Map</DashboardLayout>,
    );
    const content = container.querySelector('[class*="content"]');
    expect(content).toBeTruthy();
  });

  it("opens QuickAdd modal when add button clicked", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("quick-add-modal")).toBeTruthy();
  });

  it("closes QuickAdd modal when Close is clicked", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Close Quick Add"));
    expect(screen.queryByTestId("quick-add-modal")).toBeNull();
  });

  it("opens CreateSociety modal from QuickAdd", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Society"));
    expect(screen.getByTestId("society-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Close Society Modal"));
    expect(screen.queryByTestId("society-modal")).toBeNull();
  });

  it("opens CreateTask modal from QuickAdd", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    expect(screen.getByTestId("create-task-modal")).toBeTruthy();
  });

  it("calls openModal from QuickAdd event selection", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Event"));
    // openModal should be called for event type
    expect(mockOpenModal).toHaveBeenCalled();
  });

  it("shows EventModal when isModalOpen is true", () => {
    useEventModal.mockReturnValue({
      isModalOpen: true,
      closeModal: vi.fn(),
      openModal: vi.fn(),
      modalEvent: { id: 1, title: 'Test' },
      modalType: 'event',
      modalInitialDate: null,
    });
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("event-modal")).toBeTruthy();
  });

  it("EventModal closeModal is called when Close Event Modal clicked", () => {
    const closeModal = vi.fn();
    useEventModal.mockReturnValue({
      isModalOpen: true,
      closeModal,
      openModal: vi.fn(),
      modalEvent: null,
      modalType: null,
      modalInitialDate: null,
    });
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Close Event Modal"));
    expect(closeModal).toHaveBeenCalled();
  });

  it("does not show Topbar on mobile", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.queryByTestId("topbar")).toBeNull();
  });

  it("uses username when first_name or last_name missing (parseStoredUser)", () => {
    localStorage.setItem("user", JSON.stringify({ username: "alice", email: "a@b.com" }));
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByText("User: alice")).toBeInTheDocument();
  });

  it("parseStoredUser uses username when only first_name present (falsy last_name branch)", () => {
    localStorage.setItem("user", JSON.stringify({ username: "bob", first_name: "Bob", email: "b@b.com" }));
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByText("User: bob")).toBeInTheDocument();
  });

  it("getUser returns undefined when no user in localStorage", () => {
    localStorage.removeItem("user");
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
  });

  it("getUser handles invalid JSON in localStorage", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("user", "{ invalid json");
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handleLogoutClick clears user data even when logout throws", async () => {
    const { authService } = await import("../../api/authService");
    authService.logout.mockRejectedValueOnce(new Error("network error"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(clearUserData).toHaveBeenCalled());
  });

  it("applies tasks page style when activeNav is tasks", () => {
    const { container } = render(
      <DashboardLayout activeNav="tasks" onNavChange={() => {}}>Tasks</DashboardLayout>,
    );
    const content = container.querySelector('[class*="content"]');
    expect(content).toBeTruthy();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("shows WeekBar on calendar when not mobile", () => {
    useLocation.mockReturnValue({ pathname: "/calendar", search: "", hash: "", state: null, key: "default" });
    render(<DashboardLayout activeNav="calendar" onNavChange={() => {}}>Calendar</DashboardLayout>);
    expect(screen.getByTestId("weekbar")).toBeInTheDocument();
  });

  it("shows WeekBar when pathname starts with /calendar even if activeNav is not calendar", () => {
    useLocation.mockReturnValue({ pathname: "/calendar/2024/01", search: "", hash: "", state: null, key: "default" });
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("weekbar")).toBeInTheDocument();
  });

  it("passes isTeacher to QuickAdd when user role is teacher", () => {
    localStorage.setItem("user", JSON.stringify({ ...mockUser, role: "teacher" }));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("quick-add-modal")).toBeInTheDocument();
  });

  it("onSelectType create_module calls onNavChange with modules_create", () => {
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Module"));
    expect(onNavChange).toHaveBeenCalledWith("modules_create");
  });

  it("onSelectType add_deadline opens DeadlineModal", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Deadline"));
    expect(screen.getByTestId("deadline-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close Deadline Modal"));
    expect(screen.queryByTestId("deadline-modal")).toBeNull();
  });

  it("society creation error is caught and logged", async () => {
    const { createSociety } = await import("../../api/societyApi");
    createSociety.mockRejectedValueOnce(new Error("fail"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Society"));
    fireEvent.click(screen.getByText("Create Society"));
    await waitFor(() => expect(createSociety).toHaveBeenCalled());
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Failed to create society:", expect.any(Error)));
    consoleSpy.mockRestore();
  });

  it("society creation success closes modal", async () => {
    const { createSociety } = await import("../../api/societyApi");
    createSociety.mockResolvedValueOnce({});
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Society"));
    fireEvent.click(screen.getByText("Create Society"));
    await waitFor(() => expect(createSociety).toHaveBeenCalledWith({ name: "Soc", description: "" }));
    await waitFor(() => expect(screen.queryByTestId("society-modal")).toBeNull());
  });

  it("GlobalTaskModal handleSave error is caught", async () => {
    const { createTask } = await import("../../api/taskService");
    createTask.mockRejectedValueOnce(new Error("fail"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    fireEvent.click(screen.getByText("Save Task"));
    await waitFor(() => expect(createTask).toHaveBeenCalled());
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Failed to create task:", expect.any(Error)));
    consoleSpy.mockRestore();
  });

  it("when timer active and not paused, Quick Add sets pendingNav to QUICK_ADD", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    render(<DashboardLayout activeNav="timer" onNavChange={() => {}}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
  });

  it("LeaveTimerModal Pause and Leave runs handlePendingAction and clears pending", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pause and Leave"));
    expect(mockTimerContext.togglePause).toHaveBeenCalled();
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
    expect(screen.getByTestId("quick-add-modal")).toBeInTheDocument();
  });

  it("LeaveTimerModal Exit Timer runs handlePendingAction and clears pending", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Exit Timer"));
    expect(mockTimerContext.setIsActive).toHaveBeenCalledWith(false);
    expect(mockTimerContext.resetTimer).toHaveBeenCalled();
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("LeaveTimerModal Stay cancels pending nav", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    render(<DashboardLayout activeNav="timer" onNavChange={() => {}}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Stay"));
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("LeaveTimerModal Pause when already paused does not call togglePause", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    const { rerender } = render(<DashboardLayout activeNav="timer" onNavChange={() => {}}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    mockTimerContext.isPaused = true;
    rerender(<DashboardLayout activeNav="timer" onNavChange={() => {}}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Pause and Leave"));
    expect(mockTimerContext.togglePause).not.toHaveBeenCalled();
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("LeaveTimerModal Exit when pendingNav is nav target calls onNavChange", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    const onNavChange = vi.fn();
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav to Settings"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Exit Timer"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("handleNavChange when nav is timer calls onNavChange without setting pending", () => {
    const onNavChange = vi.fn();
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav to Timer"));
    expect(onNavChange).toHaveBeenCalledWith("timer");
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("user sync on auth-changed updates user", async () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByText("User: John Doe")).toBeInTheDocument();
    localStorage.setItem("user", JSON.stringify({ ...mockUser, first_name: "Jane", last_name: "Doe" }));
    window.dispatchEvent(new Event("auth-changed"));
    await waitFor(() => expect(screen.getByText("User: Jane Doe")).toBeInTheDocument());
  });

  it("parseStoredUser includes year and major when present", () => {
    localStorage.setItem("user", JSON.stringify({ username: "u", first_name: "F", last_name: "L", year: 2, major: "CS", email: "e@e.com" }));
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByText("User: F L")).toBeInTheDocument();
  });

  it("GlobalTaskModal handles non-array API responses", async () => {
    const { fetchTaskLists, createTask } = await import("../../api/taskService");
    const { getModules, getEnrollments } = await import("../../api/moduleApi");
    fetchTaskLists.mockResolvedValueOnce(null);
    getModules.mockResolvedValueOnce("invalid");
    getEnrollments.mockResolvedValueOnce({});
    createTask.mockResolvedValue({});
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    await waitFor(() => expect(screen.getByTestId("create-task-modal")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Save Task"));
    await waitFor(() => expect(screen.queryByTestId("create-task-modal")).not.toBeInTheDocument());
  });

  it("GlobalTaskModal handles fetchTaskLists rejection", async () => {
    const { fetchTaskLists } = await import("../../api/taskService");
    fetchTaskLists.mockRejectedValueOnce(new Error("network error"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    await waitFor(() => expect(screen.getByTestId("create-task-modal")).toBeInTheDocument());
  });

  it("GlobalTaskModal handles getModules getEnrollments rejection", async () => {
    const { getModules, getEnrollments } = await import("../../api/moduleApi");
    getModules.mockRejectedValueOnce(new Error("err"));
    getEnrollments.mockRejectedValueOnce(new Error("err"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    await waitFor(() => expect(screen.getByTestId("create-task-modal")).toBeInTheDocument());
  });

  it("GlobalTaskModal filters modules by isEnrolledIn so enrolledModules is passed to CreateTaskModal", async () => {
    const { getModules, getEnrollments } = await import("../../api/moduleApi");
    const { isEnrolledIn } = await import("../../components/Modules/utils/moduleUtils");
    getModules.mockResolvedValueOnce([{ id: 1, module_code: "CS101" }, { id: 2, module_code: "CS102" }]);
    getEnrollments.mockResolvedValueOnce([{ module: 1 }]);
    isEnrolledIn.mockImplementation((moduleId, enrollments) =>
      enrollments.some((e) => e.module === moduleId),
    );
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    await waitFor(() => expect(screen.getByTestId("create-task-modal")).toBeInTheDocument());
    expect(isEnrolledIn).toHaveBeenCalledWith(1, [{ module: 1 }]);
    expect(isEnrolledIn).toHaveBeenCalledWith(2, [{ module: 1 }]);
  });

  it("uses fallback selectedDate when useCalendar returns no selectedDate", () => {
    useCalendar.mockReturnValueOnce({});
    render(<DashboardLayout activeNav="calendar" onNavChange={() => {}}>Calendar</DashboardLayout>);
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("unmounts cleanly and removes event listeners", () => {
    const { unmount } = render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    unmount();
    expect(document.body.textContent).not.toContain("Content");
  });
});
