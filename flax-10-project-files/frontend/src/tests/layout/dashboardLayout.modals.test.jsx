import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../components/calendar/event_modal/EventModal", () => ({
  EventModal: () => null,
}));
vi.mock("../../components/society/CreateSocietyModal", () => ({
  default: () => null,
}));
vi.mock("../../components/modules/Deadlines/DeadlineModal", () => ({
  default: () => null,
}));
vi.mock("../../components/modules/Readings/ReadingModal", () => ({
  default: () => null,
}));
vi.mock("../../components/Dashboard/QuickAddModal", () => ({
  default: () => null,
}));
vi.mock("../../pages/Tasks/components/CreateTaskModal", () => ({
  default: () => null,
}));
vi.mock("../../api/societyApi", () => ({
  createSociety: vi.fn(),
}));
vi.mock("../../api/taskApi", () => ({
  createTask: vi.fn(),
}));
vi.mock("../../layout/dashboard_layout/useDashboardTaskModalOptions", () => ({
  useDashboardTaskModalOptions: () => ({ lists: [], enrolledModules: [] }),
}));

vi.mock("../../components/timer/TimerPopups", () => ({
  LeaveTimerModal: ({ onCancel, onPause, onExit, onTakeBreak, timeLeftSeconds, sessionTotalSeconds }) => (
    <div data-testid="leave-timer-modal">
      <span data-testid="leave-timer-time-left">{timeLeftSeconds}</span>
      <span data-testid="leave-timer-session-total">{sessionTotalSeconds}</span>
      <button onClick={onCancel}>Stay</button>
      <button onClick={onPause}>Pause</button>
      <button onClick={onTakeBreak}>Break</button>
      <button onClick={onExit}>Exit</button>
    </div>
  ),
}));

import { LeaveTimerActions } from "../../layout/dashboard_layout/dashboardLayoutModals";

describe("dashboard layout modal helpers", () => {
  it("passes clamped time-left and break-session totals into LeaveTimerModal", () => {
    render(
      <LeaveTimerActions
        pendingNav="settings"
        setPendingNav={vi.fn()}
        setShowQuickAdd={vi.fn()}
        onNavChange={vi.fn()}
        t={{
          mode: "break",
          timeLeft: -10,
          breakTime: 10,
          togglePause: vi.fn(),
          setMode: vi.fn(),
          setTimeLeft: vi.fn(),
          setIsActive: vi.fn(),
          resetTimer: vi.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("leave-timer-time-left")).toHaveTextContent("0");
    expect(screen.getByTestId("leave-timer-session-total")).toHaveTextContent("600");
  });

  it("falls back to zero remaining seconds when timeLeft is missing", () => {
    render(
      <LeaveTimerActions
        pendingNav={null}
        setPendingNav={vi.fn()}
        setShowQuickAdd={vi.fn()}
        onNavChange={vi.fn()}
        t={{
          mode: "work",
          workTime: 25,
          togglePause: vi.fn(),
          setMode: vi.fn(),
          setTimeLeft: vi.fn(),
          setIsActive: vi.fn(),
          resetTimer: vi.fn(),
        }}
      />,
    );

    expect(screen.getByTestId("leave-timer-time-left")).toHaveTextContent("0");
  });

  it("falls back to a 25-minute work session total for work mode", () => {
    render(
      <LeaveTimerActions
        pendingNav={null}
        setPendingNav={vi.fn()}
        setShowQuickAdd={vi.fn()}
        onNavChange={vi.fn()}
        t={{
          mode: "work", workTime: 0, timeLeft: 120,
          togglePause: vi.fn(), setMode: vi.fn(), setTimeLeft: vi.fn(),
          setIsActive: vi.fn(), resetTimer: vi.fn(),
        }}
      />,
    );
    expect(screen.getByTestId("leave-timer-session-total")).toHaveTextContent("1500");
  });

  it("handles the pause action and clears pending navigation", () => {
    const setPendingNav = vi.fn();
    const setShowQuickAdd = vi.fn();
    const timer = {
      mode: "work", timeLeft: 120, workTime: 25, isPaused: false,
      togglePause: vi.fn(), setMode: vi.fn(), setTimeLeft: vi.fn(),
      setIsActive: vi.fn(), resetTimer: vi.fn(),
    };

    render(
      <LeaveTimerActions
        pendingNav="QUICK_ADD"
        setPendingNav={setPendingNav}
        setShowQuickAdd={setShowQuickAdd}
        onNavChange={vi.fn()}
        t={timer}
      />,
    );

    fireEvent.click(screen.getByText("Pause"));
    expect(timer.togglePause).toHaveBeenCalled();
    expect(setShowQuickAdd).toHaveBeenCalledWith(true);
    expect(setPendingNav).toHaveBeenCalledWith(null);
  });
});
