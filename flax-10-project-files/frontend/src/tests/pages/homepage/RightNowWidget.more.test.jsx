/**
 * Covers additional RightNowWidget states and dismiss flows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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

vi.mock("../../../pages/homepage/hooks/useRightNowData", () => ({
  useRightNowData: (...args) => mockUseRightNowData(...args),
}));

vi.mock("../../../pages/homepage/components/RightNowSubComponents", () => ({
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

import { RightNowWidget } from "../../../pages/homepage/components/RightNowWidget";

function renderWidget(props = {}) {
  return render(
    <MemoryRouter>
      <RightNowWidget
        now={new Date("2024-03-08T14:00:00Z")}
        isToday
        navigatorContext={{}}
        sortedEvents={[]}
        tflDelays={[]}
        taskWidgetItemsOnly={[]}
        {...props}
      />
    </MemoryRouter>,
  );
}

const baseModel = {
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
};

const baseAlertState = {
  eventCount: 2,
  tasksPending: 1,
  conflicts: [{ id: "c1" }],
  leaveByInfo: { label: "Leave by 2:20pm" },
  showConflictAlert: true,
  showTflAlert: true,
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
};

function mockModel(overrides = {}) {
  mockUseRightNowData.mockReturnValue({
    ...baseModel,
    setShowConflictAlert: overrides.setShowConflictAlert ?? vi.fn(),
    setShowTflAlert: overrides.setShowTflAlert ?? vi.fn(),
    countdown: overrides.countdown ?? { text: "" },
    ...overrides,
  });
}

function queueModel(overrides = {}) {
  mockUseRightNowData.mockReturnValueOnce({
    ...baseModel,
    setShowConflictAlert: overrides.setShowConflictAlert ?? vi.fn(),
    setShowTflAlert: overrides.setShowTflAlert ?? vi.fn(),
    countdown: overrides.countdown ?? { text: "" },
    ...overrides,
  });
}

describe("RightNowWidget extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModel();
  });

  it("renders timer session details and opens the timer", () => {
    const onOpenTimer = vi.fn();
    renderTimerSession({ onOpenTimer });
    expectTimerSessionUI(onOpenTimer);
  });

  it("renders non-today states with and without an event preview", () => {
    const firstEvent = { title: "Seminar", start_time: "2024-03-09T10:00:00Z" };
    queueModel({ isToday: false });
    const { rerender } = renderNonToday(firstEvent);
    expectNonTodayPreview("Seminar");

    queueModel({ isToday: false });
    rerenderNonTodayEmpty(rerender);
    expectNonTodayEmpty();
  });

  it("renders end-of-day and empty-day summaries with tomorrow context", () => {
    const tomorrowFirstEvent = { title: "Morning Lab", start_time: "2024-03-09T09:30:00Z" };
    queueModel({ isEndOfDay: true });
    const { rerender } = renderEndOfDay(tomorrowFirstEvent);
    expectEndOfDaySummary(tomorrowFirstEvent.title);

    queueModel({ isEmptyDay: true });
    rerenderEmptyDay(rerender, tomorrowFirstEvent);
    expectEmptyDayTomorrow();
  });

  it("renders today-view alerts, active event state, next event details, and commute info", () => {
    const setShowConflictAlert = vi.fn();
    const setShowTflAlert = vi.fn();
    mockModel(alertState({ setShowConflictAlert, setShowTflAlert }));
    renderWidget();
    expectTodayViewAlerts();
    dismissAlerts();
    expect(setShowConflictAlert).toHaveBeenCalledWith(false);
    expect(setShowTflAlert).toHaveBeenCalledWith(false);
  });

  it("renders the idle today state when there is no current block", () => {
    mockModel({
      eventCount: 1,
      nextEvent: { title: "Library", start_time: "2024-03-08T16:00:00Z" },
      countdown: { text: "in 2h" },
    });
    renderWidget();
    expectIdleState();
  });
});

function renderTimerSession({ onOpenTimer }) {
  return renderWidget({
    hasTimerSession: true,
    timerMode: "break",
    timerTask: "Recharge",
    timeLeft: 90,
    breakTime: 5,
    onOpenTimer,
  });
}

function expectTimerSessionUI(onOpenTimer) {
  expect(screen.getByText("01:30")).toBeTruthy();
  expect(screen.getByText(/Break/)).toBeTruthy();
  fireEvent.click(screen.getByText("Open timer →"));
  expect(onOpenTimer).toHaveBeenCalledTimes(1);
}

function renderNonToday(firstEvent) {
  return renderWidget({ isToday: false, sortedEvents: [firstEvent] });
}

function rerenderNonTodayEmpty(rerender) {
  rerender(
    <RightNowWidget
      now={new Date("2024-03-08T14:00:00Z")}
      isToday={false}
      navigatorContext={{}}
      sortedEvents={[]}
      taskWidgetItemsOnly={[]}
    />,
  );
}

function expectNonTodayPreview(title) {
  expect(screen.getByText("Not today's view")).toBeTruthy();
  expect(screen.getByText(title)).toBeTruthy();
}

function expectNonTodayEmpty() {
  expect(screen.getByText("No events for this day.")).toBeTruthy();
}

function renderEndOfDay(tomorrowFirstEvent) {
  return render(
    <MemoryRouter>
      <RightNowWidget
        now={new Date("2024-03-08T14:00:00Z")}
        isToday
        navigatorContext={{}}
        sortedEvents={[{ title: "Past", start_time: "2024-03-08T09:00:00Z" }]}
        taskWidgetItemsOnly={[{ id: 1, completed: true }]}
        tomorrowFirstEvent={tomorrowFirstEvent}
      />
    </MemoryRouter>,
  );
}

function rerenderEmptyDay(rerender, tomorrowFirstEvent) {
  rerender(
    <MemoryRouter>
      <RightNowWidget
        now={new Date("2024-03-08T14:00:00Z")}
        isToday
        navigatorContext={{}}
        sortedEvents={[]}
        taskWidgetItemsOnly={[]}
        tomorrowFirstEvent={tomorrowFirstEvent}
      />
    </MemoryRouter>,
  );
}

function expectEndOfDaySummary(title) {
  expect(screen.getByText(/Day complete/)).toBeTruthy();
  expect(screen.getByText(title)).toBeTruthy();
}

function expectEmptyDayTomorrow() {
  expect(screen.getByText(/Free day/)).toBeTruthy();
  expect(screen.getByText(/Tomorrow:/)).toBeTruthy();
}

function alertState({ setShowConflictAlert, setShowTflAlert }) {
  return {
    ...baseAlertState,
    setShowConflictAlert,
    setShowTflAlert,
  };
}

function expectTodayViewAlerts() {
  expect(screen.getByText(/2 events/)).toBeTruthy();
  expect(screen.getByTestId("conflict-summary")).toBeTruthy();
  expect(screen.getByTestId("tfl-delay")).toHaveTextContent("Leave by 2:20pm");
  expect(screen.getByTestId("active-event")).toHaveTextContent("Workshop|2pm-3pm|20m left|40");
  expect(screen.getByText("Lecture")).toBeTruthy();
  expect(screen.getByText(/at\s+15:00\s+·\s+in 1h/i)).toBeTruthy();
  expect(screen.getByLabelText("Open UniMap for Strand")).toBeTruthy();
  expect(screen.getByTestId("commute-card")).toHaveTextContent("Strand|18|false|Leave by 2:20pm");
}

function dismissAlerts() {
  fireEvent.click(screen.getByText("dismiss conflicts"));
  fireEvent.click(screen.getByText("dismiss tfl"));
}

function expectIdleState() {
  expect(screen.getByText("Nothing on right now")).toBeTruthy();
  expect(screen.getByText("Library")).toBeTruthy();
}
