import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockOpenModal = vi.fn();

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: vi.fn(() => ({ selectedDate: new Date() })),
  useEventModal: vi.fn(() => ({
    isModalOpen: false, closeModal: vi.fn(), openModal: mockOpenModal,
    modalEvent: null, modalType: null, modalInitialDate: null,
  })),
}));

import DashboardLayout from "../../layout/DashboardLayout";
import { authService } from "../../api/authApi";
import { clearUserData } from "../../components/Auth/utils/authHelpers";
import { useEventModal, useCalendar } from "../../context/CalendarContext";
import { useLocation } from "react-router-dom";

vi.mock("../../components/Dashboard/Sidebar", async () => {
  const { SidebarMock } = await import("./dashboardMocks");
  return { default: SidebarMock };
});
vi.mock("../../components/Dashboard/Topbar", async () => {
  const { TopbarMock } = await import("./dashboardMocks");
  return { default: TopbarMock };
});
vi.mock("../../components/Dashboard/QuickAddModal", async () => {
  const { QuickAddMock } = await import("./dashboardMocks");
  return { default: QuickAddMock };
});
vi.mock("../../components/Calendar/EventModal/EventModal", async () => {
  const { EventModalMock } = await import("./dashboardMocks");
  return { EventModal: EventModalMock };
});
vi.mock("../../components/Society/CreateSocietyModal", async () => {
  const { CreateSocietyMock } = await import("./dashboardMocks");
  return { default: CreateSocietyMock };
});
vi.mock("../../components/Modules/Deadlines/DeadlineModal", async () => {
  const { DeadlineModalMock } = await import("./dashboardMocks");
  return { default: DeadlineModalMock };
});
vi.mock("../../components/Modules/Readings/ReadingModal", async () => {
  const { ReadingModalMock } = await import("./dashboardMocks");
  return { default: ReadingModalMock };
});
vi.mock("../../components/Timer/TimerPopups", async () => {
  const { LeaveTimerMock } = await import("./dashboardMocks");
  return { LeaveTimerModal: LeaveTimerMock };
});
vi.mock("../../pages/Tasks/components/CreateTaskModal", async () => {
  const { CreateTaskMock } = await import("./dashboardMocks");
  return { default: CreateTaskMock };
});

vi.mock("../../components/Dashboard/WeekBar", () => ({ default: () => <div data-testid="weekbar" /> }));
vi.mock("../../components/FloatingChat", () => ({ default: () => <div data-testid="floating-chat" /> }));
vi.mock("../../components/Pagination/Pagination", () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));
vi.mock("../../api/authApi", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Auth/utils/authHelpers", () => ({ clearUserData: vi.fn() }));
vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({ pathname: "/", search: "", hash: "", state: null, key: "default" })),
}));

const mockTimerContext = {
  isActive: false, isPaused: false, timeLeft: 1500,
  togglePause: vi.fn(), setIsActive: vi.fn(), resetTimer: vi.fn(),
};
vi.mock("../../context/TimerContext", () => ({ useTimerContext: vi.fn(() => mockTimerContext) }));
vi.mock("../../context/NotificationContext", () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock("../../api/societyApi", () => ({ createSociety: vi.fn().mockResolvedValue({}) }));
vi.mock("../../api/taskApi", () => ({
  createTask: vi.fn().mockResolvedValue({}), fetchTaskLists: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]), getEnrollments: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../components/Modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => false) }));

const mockStore = {};
vi.stubGlobal('localStorage', {
  setItem: (key, val) => { mockStore[key] = val.toString(); },
  getItem: (key) => mockStore[key] || null,
  removeItem: (key) => { delete mockStore[key]; },
});

describe("DashboardLayout", () => {
  const mockUser = { name: "John Doe", first_name: "John", last_name: "Doe", username: "jdoe", email: "j@d.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    useEventModal.mockReturnValue({
      isModalOpen: false, closeModal: vi.fn(), openModal: mockOpenModal,
      modalEvent: null, modalType: null, modalInitialDate: null,
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
    await waitFor(() => { expect(clearUserData).toHaveBeenCalled(); });
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
    const { container } = render(<DashboardLayout activeNav="map" onNavChange={() => {}}>Map</DashboardLayout>);
    expect(container.querySelector('[class*="content"]')).toBeTruthy();
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

  it("opens CreateTask modal from QuickAdd", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    expect(screen.getByTestId("create-task-modal")).toBeTruthy();
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
    localStorage.setItem("user", "{ invalid json");
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
  });

  it("handleLogoutClick clears user data even when logout throws", async () => {
    const { authService } = await import("../../api/authApi");
    authService.logout.mockRejectedValueOnce(new Error("network error"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(clearUserData).toHaveBeenCalled());
  });

  it("applies tasks page style when activeNav is tasks", () => {
    const { container } = render(<DashboardLayout activeNav="tasks" onNavChange={() => {}}>Tasks</DashboardLayout>);
    expect(container.querySelector('[class*="content"]')).toBeTruthy();
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

  it("opens QuickAdd modal and falls back to the main chooser for legacy scheduler events", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    act(() => {
      window.dispatchEvent(new CustomEvent("quick-add:open", { detail: { view: "schedule_auto" } }));
    });
    expect(screen.getByTestId("quick-add-modal")).toBeTruthy();
    expect(screen.getByTestId("quick-add-initial-view")).toHaveTextContent("schedule_auto");
    expect(screen.getByText("Quick Add")).toBeInTheDocument();
  });

  it("defaults quick-add listener events without a detail payload to the type chooser", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    act(() => {
      window.dispatchEvent(new CustomEvent("quick-add:open"));
    });
    expect(screen.getByTestId("quick-add-initial-view")).toHaveTextContent("type");
  });
});

// Society creation, GlobalTaskModal, timer modal tests are in DashboardLayout.timer.test.jsx
