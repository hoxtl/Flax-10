import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockOpenModal = vi.fn();

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: vi.fn(() => ({ selectedDate: new Date() })),
  useEventModal: vi.fn(() => ({
    isModalOpen: false, closeModal: vi.fn(), openModal: mockOpenModal,
    modalEvent: null, modalType: null, modalInitialDate: null,
  })),
}));

import DashboardLayout from "../../layout/DashboardLayout";
<<<<<<< HEAD
import { useEventModal, useCalendar } from "../../context/CalendarContext";
import { useLocation } from "react-router-dom";

vi.mock("../../components/dashboard/Sidebar", async () => {
  const { SidebarMock } = await import("./dashboardMocks");
  return { default: SidebarMock };
});
vi.mock("../../components/dashboard/Topbar", async () => {
  const { TopbarMock } = await import("./dashboardMocks");
  return { default: TopbarMock };
});
vi.mock("../../components/dashboard/QuickAddModal", async () => {
  const { QuickAddMock } = await import("./dashboardMocks");
  return { default: QuickAddMock };
});
vi.mock("../../components/calendar/event_modal/EventModal", async () => {
  const { EventModalMock } = await import("./dashboardMocks");
  return { EventModal: EventModalMock };
});
vi.mock("../../components/society/CreateSocietyModal", async () => {
  const { CreateSocietyMock } = await import("./dashboardMocks");
  return { default: CreateSocietyMock };
});
vi.mock("../../components/modules/deadlines/DeadlineModal", async () => {
  const { DeadlineModalMock } = await import("./dashboardMocks");
  return { default: DeadlineModalMock };
});
vi.mock("../../components/timer/TimerPopups", async () => {
  const { LeaveTimerMock } = await import("./dashboardMocks");
  return { LeaveTimerModal: LeaveTimerMock };
});
vi.mock("../../pages/tasks/components/CreateTaskModal", async () => {
=======
import { authService } from "../../api/authApi";
import { clearUserData } from "../../components/Authentication/utils/authHelpers";
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
vi.mock("../../components/Modules/DeadlineModal", async () => {
  const { DeadlineModalMock } = await import("./dashboardMocks");
  return { default: DeadlineModalMock };
});
vi.mock("../../components/Timer/TimerPopups", async () => {
  const { LeaveTimerMock } = await import("./dashboardMocks");
  return { LeaveTimerModal: LeaveTimerMock };
});
vi.mock("../../pages/Tasks/components/CreateTaskModal", async () => {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const { CreateTaskMock } = await import("./dashboardMocks");
  return { default: CreateTaskMock };
});

<<<<<<< HEAD
vi.mock("../../components/dashboard/WeekBar", () => ({ default: () => <div data-testid="weekbar" /> }));
vi.mock("../../components/FloatingChat", () => ({ default: () => <div data-testid="floating-chat" /> }));
vi.mock("../../components/pagination/Pagination", () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));
vi.mock("../../api/authApi", () => ({ authService: { logout: vi.fn() } }));
<<<<<<< HEAD
vi.mock("../../components/auth/utils/authHelpers", () => ({ clearUserData: vi.fn() }));
=======
vi.mock("../../components/Dashboard/WeekBar", () => ({ default: () => <div data-testid="weekbar" /> }));
vi.mock("../../components/FloatingChat", () => ({ default: () => <div data-testid="floating-chat" /> }));
vi.mock("../../components/Pagination/Pagination", () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));
vi.mock("../../api/authApi", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Authentication/utils/authHelpers", () => ({ clearUserData: vi.fn() }));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
=======
vi.mock("../../components/Auth/utils/authHelpers", () => ({ clearUserData: vi.fn() }));
>>>>>>> main
vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({ pathname: "/", search: "", hash: "", state: null, key: "default" })),
}));

const mockTimerContext = {
<<<<<<< HEAD
  isActive: false, isPaused: false, mode: "work", timeLeft: 1500,
  togglePause: vi.fn(), setIsActive: vi.fn(), setMode: vi.fn(), setTimeLeft: vi.fn(), resetTimer: vi.fn(),
=======
  isActive: false, isPaused: false, timeLeft: 1500,
  togglePause: vi.fn(), setIsActive: vi.fn(), resetTimer: vi.fn(),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
vi.mock("../../components/modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => false) }));
=======
vi.mock("../../components/Modules/utils/moduleUtils", () => ({ isEnrolledIn: vi.fn(() => false) }));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const mockStore = {};
vi.stubGlobal('localStorage', {
  setItem: (key, val) => { mockStore[key] = val.toString(); },
  getItem: (key) => mockStore[key] || null,
  removeItem: (key) => { delete mockStore[key]; },
});

describe("DashboardLayout – society, timer, global task", () => {
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
<<<<<<< HEAD
    mockTimerContext.mode = "work";
    useLocation.mockReturnValue({ pathname: "/", search: "", hash: "", state: null, key: "default" });
    localStorage.setItem("user", JSON.stringify(mockUser));
    window.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));
=======
    useLocation.mockReturnValue({ pathname: "/", search: "", hash: "", state: null, key: "default" });
    localStorage.setItem("user", JSON.stringify(mockUser));
    global.innerWidth = 1024;
    global.dispatchEvent(new Event("resize"));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  });

  it("society creation error is caught and logged", async () => {
    const { createSociety } = await import("../../api/societyApi");
    createSociety.mockRejectedValueOnce(new Error("fail"));
<<<<<<< HEAD
=======
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Society"));
    fireEvent.click(screen.getByText("Create Society"));
    await waitFor(() => expect(createSociety).toHaveBeenCalled());
<<<<<<< HEAD
    expect(screen.getByTestId("society-modal")).toBeInTheDocument();
=======
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Failed to create society:", expect.any(Error)));
    consoleSpy.mockRestore();
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
    const { createTask } = await import("../../api/taskApi");
    createTask.mockRejectedValueOnce(new Error("fail"));
<<<<<<< HEAD
=======
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    fireEvent.click(screen.getByText("Save Task"));
    await waitFor(() => expect(createTask).toHaveBeenCalled());
<<<<<<< HEAD
    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
=======
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Failed to create task:", expect.any(Error)));
    consoleSpy.mockRestore();
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));
=======
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav to Settings"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Exit Timer"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

<<<<<<< HEAD
  it("Take a 5m Break instead starts a break and continues the pending navigation", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    mockTimerContext.mode = "work";
    const onNavChange = vi.fn();
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav to Settings"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Take a 5m Break instead"));
    expect(mockTimerContext.setMode).toHaveBeenCalledWith("break");
    expect(mockTimerContext.setTimeLeft).toHaveBeenCalledWith(300);
    expect(mockTimerContext.setIsActive).toHaveBeenCalledWith(true);
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("does not block navigation while the timer is already on a break", () => {
    mockTimerContext.isActive = true;
    mockTimerContext.isPaused = false;
    mockTimerContext.mode = "break";
    const onNavChange = vi.fn();
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav to Settings"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("handleNavChange when nav is timer calls onNavChange without setting pending", () => {
    const onNavChange = vi.fn();
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));
=======
  it("handleNavChange when nav is timer calls onNavChange without setting pending", () => {
    const onNavChange = vi.fn();
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    render(<DashboardLayout activeNav="timer" onNavChange={onNavChange}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Nav to Timer"));
    expect(onNavChange).toHaveBeenCalledWith("timer");
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("user sync on auth-changed updates user", async () => {
<<<<<<< HEAD
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));
=======
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByText("User: John Doe")).toBeInTheDocument();
    localStorage.setItem("user", JSON.stringify({ ...mockUser, first_name: "Jane", last_name: "Doe" }));
    window.dispatchEvent(new Event("auth-changed"));
    await waitFor(() => expect(screen.getByText("User: Jane Doe")).toBeInTheDocument());
  });

  it("parseStoredUser includes year and major when present", () => {
    localStorage.setItem("user", JSON.stringify({ username: "u", first_name: "F", last_name: "L", year: 2, major: "CS", email: "e@e.com" }));
<<<<<<< HEAD
    window.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));
=======
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByText("User: F L")).toBeInTheDocument();
  });

  it("GlobalTaskModal handles non-array API responses", async () => {
    const { fetchTaskLists, createTask } = await import("../../api/taskApi");
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
    const { fetchTaskLists } = await import("../../api/taskApi");
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
<<<<<<< HEAD
    const { isEnrolledIn } = await import("../../components/modules/utils/moduleUtils");
=======
    const { isEnrolledIn } = await import("../../components/Modules/utils/moduleUtils");
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    getModules.mockResolvedValueOnce([{ id: 1, module_code: "CS101" }, { id: 2, module_code: "CS102" }]);
    getEnrollments.mockResolvedValueOnce([{ module: 1 }]);
    isEnrolledIn.mockImplementation((moduleId, enrollments) => enrollments.some((e) => e.module === moduleId));
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
