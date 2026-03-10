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
import { useEventModal } from "../../context/CalendarContext";

vi.mock("../../components/Dashboard/Sidebar", () => ({
  default: ({ user, onChange }) => (
    <div data-testid="sidebar">
      <span>User: {user?.name}</span>
      <button onClick={() => onChange("settings")}>Nav to Settings</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/Topbar", () => ({
  default: ({ onLogoutClick, onAddClick }) => (
    <div data-testid="topbar">
      <button onClick={onLogoutClick}>Logout</button>
      <button onClick={onAddClick}>Quick Add</button>
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
  default: ({ onClose }) => (
    <div data-testid="society-modal">
      <button onClick={onClose}>Close Society Modal</button>
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
  default: ({ onClose }) => (
    <div data-testid="create-task-modal">
      <button onClick={onClose}>Close Task Modal</button>
    </div>
  ),
}));

vi.mock("../../api/authService", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Authentication/utils/authHelpers", () => ({ clearUserData: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/" }),
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

  it("renders BackToTop for home page", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("back-to-top")).toBeTruthy();
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

  it("shows sidebar on mobile", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByText("User: John Doe")).toBeTruthy();
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

  it("does not show Topbar on mobile", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.queryByTestId("topbar")).toBeNull();
  });
});
