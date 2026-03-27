import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockTimerContext,
  prepareDashboardLayoutTest,
  renderDashboardLayout,
  setDashboardLayoutViewport,
} from "./dashboardLayoutTestUtils";

beforeEach(async () => {
  await prepareDashboardLayoutTest();
});

function openHomeQuickAdd() {
  renderDashboardLayout();
  fireEvent.click(screen.getByText("Quick Add"));
}

function openSocietyModal() {
  openHomeQuickAdd();
  fireEvent.click(screen.getByText("Add Society"));
}

function openTaskModal() {
  openHomeQuickAdd();
  fireEvent.click(screen.getByText("Add Task"));
}

async function openTaskModalAndWait() {
  openTaskModal();
  await waitFor(() => expect(screen.getByTestId("create-task-modal")).toBeInTheDocument());
}

function prepareTimerSession({ onNavChange = vi.fn(), isPaused = false, mode = "work" } = {}) {
  mockTimerContext.isActive = true;
  mockTimerContext.isPaused = isPaused;
  mockTimerContext.mode = mode;
  renderDashboardLayout({ activeNav: "timer", onNavChange, children: "Timer" });
  return onNavChange;
}

function openTimerQuickAdd(options = {}) {
  prepareTimerSession(options);
  fireEvent.click(screen.getByText("Quick Add"));
}

function openTimerSettings(options = {}) {
  const onNavChange = prepareTimerSession(options);
  fireEvent.click(screen.getByText("Nav to Settings"));
  return onNavChange;
}

describe("DashboardLayout - society, timer, global task", () => {
  it("society creation error still runs the create flow", async () => {
    const { createSociety } = await import("../../api/societyApi");
    createSociety.mockRejectedValueOnce(new Error("fail"));
    openSocietyModal();
    fireEvent.click(screen.getByText("Create Society"));
    await waitFor(() => expect(createSociety).toHaveBeenCalled());
    expect(screen.getByTestId("society-modal")).toBeInTheDocument();
  });

  it("society creation success closes modal", async () => {
    const { createSociety } = await import("../../api/societyApi");
    createSociety.mockResolvedValueOnce({});
    openSocietyModal();
    fireEvent.click(screen.getByText("Create Society"));
    await waitFor(() => expect(createSociety).toHaveBeenCalledWith({ name: "Soc", description: "" }));
    await waitFor(() => expect(screen.queryByTestId("society-modal")).toBeNull());
  });

  it("GlobalTaskModal handleSave error still reaches createTask", async () => {
    const { createTask } = await import("../../api/taskApi");
    createTask.mockRejectedValueOnce(new Error("fail"));
    await openTaskModalAndWait();
    fireEvent.click(screen.getByText("Save Task"));
    await waitFor(() => expect(createTask).toHaveBeenCalled());
    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
  });

  it("when timer active and not paused, Quick Add sets pendingNav to QUICK_ADD", () => {
    openTimerQuickAdd();
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
  });

  it("LeaveTimerModal Pause and Leave runs handlePendingAction and clears pending", () => {
    prepareTimerSession();
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pause and Leave"));
    expect(mockTimerContext.togglePause).toHaveBeenCalled();
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
    expect(screen.getByTestId("quick-add-modal")).toBeInTheDocument();
  });

  it("LeaveTimerModal Exit Timer runs handlePendingAction and clears pending", () => {
    prepareTimerSession();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Exit Timer"));
    expect(mockTimerContext.setIsActive).toHaveBeenCalledWith(false);
    expect(mockTimerContext.resetTimer).toHaveBeenCalled();
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("LeaveTimerModal Stay cancels pending nav", () => {
    prepareTimerSession();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Stay"));
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("LeaveTimerModal Pause when already paused does not call togglePause", async () => {
    prepareTimerSession();
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    mockTimerContext.isPaused = true;
    const { default: DashboardLayout } = await import("../../layout/DashboardLayout");
    const { rerender } = renderDashboardLayout({ activeNav: "timer", children: "Timer" });
    rerender(<DashboardLayout activeNav="timer" onNavChange={() => {}}>Timer</DashboardLayout>);
    fireEvent.click(screen.getByText("Pause and Leave"));
    expect(mockTimerContext.togglePause).not.toHaveBeenCalled();
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("LeaveTimerModal Exit when pendingNav is nav target calls onNavChange", () => {
    setDashboardLayoutViewport(500);
    const onNavChange = openTimerSettings();
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Exit Timer"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("Take a 5m Break instead starts a break and continues the pending navigation", () => {
    setDashboardLayoutViewport(500);
    const onNavChange = openTimerSettings({ mode: "work" });
    expect(screen.getByTestId("leave-timer-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Take a 5m Break instead"));
    expect(mockTimerContext.setMode).toHaveBeenCalledWith("break");
    expect(mockTimerContext.setTimeLeft).toHaveBeenCalledWith(300);
    expect(mockTimerContext.setIsActive).toHaveBeenCalledWith(true);
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("does not block navigation while the timer is already on a break", () => {
    setDashboardLayoutViewport(500);
    const onNavChange = openTimerSettings({ mode: "break" });
    expect(onNavChange).toHaveBeenCalledWith("settings");
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("handleNavChange when nav is timer calls onNavChange without setting pending", () => {
    setDashboardLayoutViewport(500);
    const onNavChange = prepareTimerSession();
    fireEvent.click(screen.getByText("Nav to Timer"));
    expect(onNavChange).toHaveBeenCalledWith("timer");
    expect(screen.queryByTestId("leave-timer-modal")).toBeNull();
  });

  it("user sync on auth-changed updates user", async () => {
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.getByText("User: John Doe")).toBeInTheDocument();
    localStorage.setItem("user", JSON.stringify({ name: "John Doe", first_name: "Jane", last_name: "Doe", username: "jdoe", email: "j@d.com" }));
    window.dispatchEvent(new Event("auth-changed"));
    await waitFor(() => expect(screen.getByText("User: Jane Doe")).toBeInTheDocument());
  });

  it("parseStoredUser includes year and major when present", () => {
    localStorage.setItem("user", JSON.stringify({ username: "u", first_name: "F", last_name: "L", year: 2, major: "CS", email: "e@e.com" }));
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.getByText("User: F L")).toBeInTheDocument();
  });

  it("GlobalTaskModal handles non-array API responses", async () => {
    const { fetchTaskLists, createTask } = await import("../../api/taskApi");
    const { getModules, getEnrollments } = await import("../../api/moduleApi");
    fetchTaskLists.mockResolvedValueOnce(null);
    getModules.mockResolvedValueOnce("invalid");
    getEnrollments.mockResolvedValueOnce({});
    createTask.mockResolvedValue({});
    await openTaskModalAndWait();
    fireEvent.click(screen.getByText("Save Task"));
    await waitFor(() => expect(screen.queryByTestId("create-task-modal")).not.toBeInTheDocument());
  });

  it("GlobalTaskModal handles fetchTaskLists rejection", async () => {
    const { fetchTaskLists } = await import("../../api/taskApi");
    fetchTaskLists.mockRejectedValueOnce(new Error("network error"));
    await openTaskModalAndWait();
  });

  it("GlobalTaskModal handles getModules getEnrollments rejection", async () => {
    const { getModules, getEnrollments } = await import("../../api/moduleApi");
    getModules.mockRejectedValueOnce(new Error("err"));
    getEnrollments.mockRejectedValueOnce(new Error("err"));
    await openTaskModalAndWait();
  });

  it("GlobalTaskModal filters modules by isEnrolledIn so enrolledModules is passed to CreateTaskModal", async () => {
    const { getModules, getEnrollments } = await import("../../api/moduleApi");
    const { isEnrolledIn } = await import("../../components/modules/utils/moduleUtils");
    getModules.mockResolvedValueOnce([{ id: 1, module_code: "CS101" }, { id: 2, module_code: "CS102" }]);
    getEnrollments.mockResolvedValueOnce([{ module: 1 }]);
    isEnrolledIn.mockImplementation((moduleId, enrollments) => enrollments.some((e) => e.module === moduleId));
    await openTaskModalAndWait();
    expect(isEnrolledIn).toHaveBeenCalledWith(1, [{ module: 1 }]);
    expect(isEnrolledIn).toHaveBeenCalledWith(2, [{ module: 1 }]);
  });

  it("uses fallback selectedDate when useCalendar returns no selectedDate", async () => {
    const { useCalendar } = await import("../../context/CalendarContext");
    useCalendar.mockReturnValueOnce({});
    setDashboardLayoutViewport(500);
    renderDashboardLayout({ activeNav: "calendar", children: "Calendar" });
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("unmounts cleanly and removes event listeners", () => {
    const { unmount } = renderDashboardLayout();
    unmount();
    expect(document.body.textContent).not.toContain("Content");
  });
});
