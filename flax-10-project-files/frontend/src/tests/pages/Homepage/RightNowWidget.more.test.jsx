import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseRightNowData = vi.fn();

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      const Tag = typeof tag === "string" ? tag : "div";
      return ({ children, ...props }) => {
        const { initial, animate, exit, transition, variants, layout, ...rest } = props;
        return <Tag {...rest}>{children}</Tag>;
      };
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../pages/Homepage/hooks/useRightNowData", () => ({
  useRightNowData: (...args) => mockUseRightNowData(...args),
}));

vi.mock("../../../pages/Homepage/components/RightNowSubComponents", () => ({
  fadeIn: () => ({}),
  ActiveEventCard: ({ currentBlock, timeRangeStr, timeLeftStr, currentProgressPct }) => (
    <div data-testid="active-event">
      {currentBlock.title}|{timeRangeStr}|{timeLeftStr}|{currentProgressPct}
    </div>
  ),
  CommuteContextCard: ({ campus, journey, loading, leaveByInfo }) => (
    <div data-testid="commute-card">
      {campus}|{journey?.duration ?? "none"}|{String(loading)}|{leaveByInfo?.label ?? "none"}
    </div>
  ),
  ConflictSummary: ({ conflicts, onDismiss }) => (
    <div data-testid="conflict-summary">
      conflicts:{conflicts.length}
      <button onClick={onDismiss}>dismiss conflicts</button>
    </div>
  ),
  TflDelayCard: ({ leaveByInfo, onDismiss }) => (
    <div data-testid="tfl-delay">
      {leaveByInfo.label}
      <button onClick={onDismiss}>dismiss tfl</button>
    </div>
  ),
}));

import { RightNowWidget } from "../../../pages/Homepage/components/RightNowWidget";

function renderWidget(props = {}) {
  return render(
    <RightNowWidget
      now={new Date("2024-03-08T14:00:00Z")}
      isToday
      navigatorContext={{}}
      sortedEvents={[]}
      tflDelays={[]}
      taskWidgetItemsOnly={[]}
      {...props}
    />,
  );
}

describe("RightNowWidget extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRightNowData.mockReturnValue({
      isToday: true,
      eventCount: 0,
      tasksPending: 0,
      conflicts: [],
      leaveByInfo: null,
      showConflictAlert: false,
      showTflAlert: false,
      setShowConflictAlert: vi.fn(),
      setShowTflAlert: vi.fn(),
      showTfl: false,
      currentBlock: null,
      currentProgressPct: 0,
      timeRangeStr: "",
      timeLeftStr: "",
      nextEvent: null,
      countdown: { text: "" },
      commuteInfo: null,
      loadingCommute: false,
      nextCampus: null,
      isEndOfDay: false,
      isEmptyDay: false,
    });
  });

  it("renders timer session details and opens the timer", () => {
    const onOpenTimer = vi.fn();
    renderWidget({
      hasTimerSession: true,
      timerMode: "break",
      timerTask: "Recharge",
      timeLeft: 90,
      breakTime: 5,
      onOpenTimer,
    });

    expect(screen.getByText("01:30")).toBeTruthy();
    expect(screen.getByText(/Break/)).toBeTruthy();
    fireEvent.click(screen.getByText("Open timer →"));
    expect(onOpenTimer).toHaveBeenCalledTimes(1);
  });

  it("renders non-today states with and without an event preview", () => {
    const firstEvent = { title: "Seminar", start_time: "2024-03-09T10:00:00Z" };
    mockUseRightNowData.mockReturnValueOnce({
      isToday: false,
      eventCount: 0,
      tasksPending: 0,
      conflicts: [],
      leaveByInfo: null,
      showConflictAlert: false,
      showTflAlert: false,
      setShowConflictAlert: vi.fn(),
      setShowTflAlert: vi.fn(),
      showTfl: false,
      currentBlock: null,
      currentProgressPct: 0,
      timeRangeStr: "",
      timeLeftStr: "",
      nextEvent: null,
      countdown: { text: "" },
      commuteInfo: null,
      loadingCommute: false,
      nextCampus: null,
      isEndOfDay: false,
      isEmptyDay: false,
    });
    const { rerender } = renderWidget({ isToday: false, sortedEvents: [firstEvent] });
    expect(screen.getByText("Not today's view")).toBeTruthy();
    expect(screen.getByText("Seminar")).toBeTruthy();

    mockUseRightNowData.mockReturnValueOnce({
      isToday: false,
      eventCount: 0,
      tasksPending: 0,
      conflicts: [],
      leaveByInfo: null,
      showConflictAlert: false,
      showTflAlert: false,
      setShowConflictAlert: vi.fn(),
      setShowTflAlert: vi.fn(),
      showTfl: false,
      currentBlock: null,
      currentProgressPct: 0,
      timeRangeStr: "",
      timeLeftStr: "",
      nextEvent: null,
      countdown: { text: "" },
      commuteInfo: null,
      loadingCommute: false,
      nextCampus: null,
      isEndOfDay: false,
      isEmptyDay: false,
    });
    rerender(
      <RightNowWidget
        now={new Date("2024-03-08T14:00:00Z")}
        isToday={false}
        navigatorContext={{}}
        sortedEvents={[]}
        taskWidgetItemsOnly={[]}
      />,
    );
    expect(screen.getByText("No events for this day.")).toBeTruthy();
  });

  it("renders end-of-day and empty-day summaries with tomorrow context", () => {
    const tomorrowFirstEvent = { title: "Morning Lab", start_time: "2024-03-09T09:30:00Z" };
    mockUseRightNowData.mockReturnValueOnce({
      isToday: true,
      eventCount: 0,
      tasksPending: 0,
      conflicts: [],
      leaveByInfo: null,
      showConflictAlert: false,
      showTflAlert: false,
      setShowConflictAlert: vi.fn(),
      setShowTflAlert: vi.fn(),
      showTfl: false,
      currentBlock: null,
      currentProgressPct: 0,
      timeRangeStr: "",
      timeLeftStr: "",
      nextEvent: null,
      countdown: { text: "" },
      commuteInfo: null,
      loadingCommute: false,
      nextCampus: null,
      isEndOfDay: true,
      isEmptyDay: false,
    });
    const { rerender } = render(
      <RightNowWidget
        now={new Date("2024-03-08T14:00:00Z")}
        isToday
        navigatorContext={{}}
        sortedEvents={[{ title: "Past", start_time: "2024-03-08T09:00:00Z" }]}
        taskWidgetItemsOnly={[{ id: 1, completed: true }]}
        tomorrowFirstEvent={tomorrowFirstEvent}
      />,
    );
    expect(screen.getByText(/Day complete/)).toBeTruthy();
    expect(screen.getByText("Morning Lab")).toBeTruthy();

    mockUseRightNowData.mockReturnValueOnce({
      isToday: true,
      eventCount: 0,
      tasksPending: 0,
      conflicts: [],
      leaveByInfo: null,
      showConflictAlert: false,
      showTflAlert: false,
      setShowConflictAlert: vi.fn(),
      setShowTflAlert: vi.fn(),
      showTfl: false,
      currentBlock: null,
      currentProgressPct: 0,
      timeRangeStr: "",
      timeLeftStr: "",
      nextEvent: null,
      countdown: { text: "" },
      commuteInfo: null,
      loadingCommute: false,
      nextCampus: null,
      isEndOfDay: false,
      isEmptyDay: true,
    });
    rerender(
      <RightNowWidget
        now={new Date("2024-03-08T14:00:00Z")}
        isToday
        navigatorContext={{}}
        sortedEvents={[]}
        taskWidgetItemsOnly={[]}
        tomorrowFirstEvent={tomorrowFirstEvent}
      />,
    );
    expect(screen.getByText(/Free day/)).toBeTruthy();
    expect(screen.getByText(/Tomorrow:/)).toBeTruthy();
  });

  it("renders today-view alerts, active event state, next event details, and commute info", () => {
    const setShowConflictAlert = vi.fn();
    const setShowTflAlert = vi.fn();
    mockUseRightNowData.mockReturnValue({
      isToday: true,
      eventCount: 2,
      tasksPending: 1,
      conflicts: [{ id: "c1" }],
      leaveByInfo: { label: "Leave by 2:20pm" },
      showConflictAlert: true,
      showTflAlert: true,
      setShowConflictAlert,
      setShowTflAlert,
      showTfl: true,
      currentBlock: { title: "Workshop" },
      currentProgressPct: 40,
      timeRangeStr: "2pm-3pm",
      timeLeftStr: "20m left",
      nextEvent: { title: "Lecture", start_time: "2024-03-08T15:00:00Z", location: "Strand" },
      countdown: { text: "in 1h" },
      commuteInfo: { duration: 18 },
      loadingCommute: false,
      nextCampus: "Strand",
      isEndOfDay: false,
      isEmptyDay: false,
    });

    renderWidget();
    expect(screen.getByText(/2 events/)).toBeTruthy();
    expect(screen.getByTestId("conflict-summary")).toBeTruthy();
    expect(screen.getByTestId("tfl-delay")).toHaveTextContent("Leave by 2:20pm");
    expect(screen.getByTestId("active-event")).toHaveTextContent("Workshop|2pm-3pm|20m left|40");
    expect(screen.getByText("Lecture")).toBeTruthy();
    expect(screen.getByText(/at 15:00 · in 1h · Strand/)).toBeTruthy();
    expect(screen.getByTestId("commute-card")).toHaveTextContent("Strand|18|false|Leave by 2:20pm");

    fireEvent.click(screen.getByText("dismiss conflicts"));
    fireEvent.click(screen.getByText("dismiss tfl"));
    expect(setShowConflictAlert).toHaveBeenCalledWith(false);
    expect(setShowTflAlert).toHaveBeenCalledWith(false);
  });

  it("renders the idle today state when there is no current block", () => {
    mockUseRightNowData.mockReturnValue({
      isToday: true,
      eventCount: 1,
      tasksPending: 0,
      conflicts: [],
      leaveByInfo: null,
      showConflictAlert: false,
      showTflAlert: false,
      setShowConflictAlert: vi.fn(),
      setShowTflAlert: vi.fn(),
      showTfl: false,
      currentBlock: null,
      currentProgressPct: 0,
      timeRangeStr: "",
      timeLeftStr: "",
      nextEvent: { title: "Library", start_time: "2024-03-08T16:00:00Z" },
      countdown: { text: "in 2h" },
      commuteInfo: null,
      loadingCommute: false,
      nextCampus: null,
      isEndOfDay: false,
      isEmptyDay: false,
    });

    renderWidget();
    expect(screen.getByText("Nothing on right now")).toBeTruthy();
    expect(screen.getByText("Library")).toBeTruthy();
  });
});
