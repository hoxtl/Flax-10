import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useRightNowData = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const { animate, initial, layout, transition, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

vi.mock("lucide-react", () => ({
  Clock: () => <svg aria-hidden="true" />,
  Sparkles: () => <svg aria-hidden="true" />,
  Sun: () => <svg aria-hidden="true" />,
}));

vi.mock("../../../pages/Homepage/hooks/useRightNowData", () => ({
  useRightNowData: (...args) => useRightNowData(...args),
}));

vi.mock("../../../pages/Homepage/components/RightNowSubComponents", () => ({
  fadeIn: () => ({}),
  ActiveEventCard: ({ currentBlock, timeLeftStr }) => <div>{`Active ${currentBlock.title} ${timeLeftStr || ""}`}</div>,
  CommuteContextCard: ({ campus, loading, leaveByInfo }) => (
    <div>{loading ? "Checking route..." : `${campus?.shortName || "Campus"} ${leaveByInfo?.message || ""}`}</div>
  ),
  ConflictSummary: ({ conflicts, onDismiss }) => (
    <div>
      <span>{`conflicts:${conflicts.length}`}</span>
      <button type="button" aria-label="Dismiss warning" onClick={onDismiss}>dismiss-conflicts</button>
    </div>
  ),
  TflDelayCard: ({ leaveByInfo, onDismiss }) => (
    <div>
      <span>{leaveByInfo.message}</span>
      <button type="button" aria-label="Dismiss delay alert" onClick={onDismiss}>dismiss-delay</button>
    </div>
  ),
}));

import { RightNowWidget } from "../../../pages/Homepage/components/RightNowWidget";

function renderWidget(props = {}, model = {}) {
  useRightNowData.mockReturnValue({
    conflicts: [],
    countdown: { text: "" },
    currentBlock: null,
    currentProgressPct: null,
    eventCount: 0,
    isEmptyDay: false,
    isEndOfDay: false,
    isToday: true,
    leaveByInfo: null,
    loadingCommute: false,
    nextCampus: null,
    nextEvent: null,
    showConflictAlert: true,
    setShowConflictAlert: vi.fn(),
    showTfl: false,
    showTflAlert: true,
    setShowTflAlert: vi.fn(),
    tasksPending: 0,
    timeLeftStr: null,
    timeRangeStr: null,
    commuteInfo: null,
    ...model,
  });

  return render(
    <MemoryRouter>
      <RightNowWidget
        now={new Date("2026-03-24T12:00:00.000Z")}
        isToday
        navigatorContext={{}}
        sortedEvents={[]}
        tflDelays={[]}
        tomorrowFirstEvent={null}
        taskWidgetItemsOnly={[]}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("RightNowWidget branch coverage", () => {
  it("renders timer session cards and opens the timer", () => {
    const onOpenTimer = vi.fn();
    renderWidget(
      {
        hasTimerSession: true,
        timerMode: "break",
        timeLeft: 90,
        workTime: 25,
        breakTime: 5,
        timerTask: "Stretch",
        onOpenTimer,
      },
      {},
    );

    expect(screen.getByText("01:30")).toBeInTheDocument();
    expect(screen.getByText(/Break · Stretch/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open timer →"));
    expect(onOpenTimer).toHaveBeenCalledOnce();
  });

  it("renders non-today preview and fallback copy", () => {
    const { rerender } = render(
      <MemoryRouter>
        <RightNowWidget
          now={new Date("2026-03-24T12:00:00.000Z")}
          isToday={false}
          navigatorContext={{}}
          sortedEvents={[{ title: "Seminar", start_time: "2026-03-25T09:00:00.000Z" }]}
          tflDelays={[]}
        />
      </MemoryRouter>,
    );
    useRightNowData.mockReturnValue({
      conflicts: [],
      countdown: { text: "" },
      currentBlock: null,
      currentProgressPct: null,
      eventCount: 1,
      isEmptyDay: false,
      isEndOfDay: false,
      isToday: false,
      leaveByInfo: null,
      loadingCommute: false,
      nextCampus: null,
      nextEvent: null,
      showConflictAlert: true,
      setShowConflictAlert: vi.fn(),
      showTfl: false,
      showTflAlert: true,
      setShowTflAlert: vi.fn(),
      tasksPending: 0,
      timeLeftStr: null,
      timeRangeStr: null,
      commuteInfo: null,
    });
    rerender(
      <MemoryRouter>
        <RightNowWidget
          now={new Date("2026-03-24T12:00:00.000Z")}
          isToday={false}
          navigatorContext={{}}
          sortedEvents={[]}
          tflDelays={[]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("No events for this day.")).toBeInTheDocument();
  });

  it("renders end-of-day and empty-day summaries with tomorrow previews", () => {
    const tomorrowFirstEvent = { title: "Morning Lab", start_time: "2026-03-25T09:00:00.000Z" };
    const { rerender } = renderWidget(
      { tomorrowFirstEvent, taskWidgetItemsOnly: [{ completed: true }], sortedEvents: [{ start_time: "2026-03-24T09:00:00.000Z" }] },
      { isEndOfDay: true },
    );

    expect(screen.getByText(/Day complete/)).toBeInTheDocument();
    expect(screen.getByText("Morning Lab")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <RightNowWidget
          now={new Date("2026-03-24T12:00:00.000Z")}
          isToday
          navigatorContext={{}}
          sortedEvents={[]}
          tflDelays={[]}
          tomorrowFirstEvent={tomorrowFirstEvent}
        />
      </MemoryRouter>,
    );
    useRightNowData.mockReturnValue({
      conflicts: [],
      countdown: { text: "" },
      currentBlock: null,
      currentProgressPct: null,
      eventCount: 0,
      isEmptyDay: true,
      isEndOfDay: false,
      isToday: true,
      leaveByInfo: null,
      loadingCommute: false,
      nextCampus: null,
      nextEvent: null,
      showConflictAlert: true,
      setShowConflictAlert: vi.fn(),
      showTfl: false,
      showTflAlert: true,
      setShowTflAlert: vi.fn(),
      tasksPending: 0,
      timeLeftStr: null,
      timeRangeStr: null,
      commuteInfo: null,
    });
    rerender(
      <MemoryRouter>
        <RightNowWidget
          now={new Date("2026-03-24T12:00:00.000Z")}
          isToday
          navigatorContext={{}}
          sortedEvents={[]}
          tflDelays={[]}
          tomorrowFirstEvent={tomorrowFirstEvent}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Free day/)).toBeInTheDocument();
    expect(screen.getByText(/Tomorrow: Morning Lab at/)).toBeInTheDocument();
  });

  it("renders today-state alerts, active sessions, next event, and commute info", () => {
    const setShowConflictAlert = vi.fn();
    const setShowTflAlert = vi.fn();
    renderWidget(
      { sortedEvents: [{ title: "Stats Review", start_time: "2026-03-24T13:00:00.000Z", location: "Waterloo" }], taskWidgetItemsOnly: [{ completed: false }] },
      {
        conflicts: [{ a: {}, b: {} }],
        currentBlock: { title: "Deep Work" },
        currentProgressPct: 50,
        eventCount: 1,
        leaveByInfo: { message: "Leave in 10 minutes" },
        loadingCommute: false,
        nextCampus: { shortName: "WAT" },
        nextEvent: { title: "Stats Review", start_time: "2026-03-24T13:00:00.000Z", location: "Waterloo" },
        showTfl: true,
        setShowConflictAlert,
        setShowTflAlert,
        tasksPending: 1,
        timeLeftStr: "20m left",
        timeRangeStr: "12:00 - 12:30",
      },
    );

    expect(screen.getByText(/1 event · 1 task left/)).toBeInTheDocument();
    expect(screen.getByText(/Active Deep Work 20m left/)).toBeInTheDocument();
    expect(screen.getByText("conflicts:1")).toBeInTheDocument();
    expect(screen.getByText("Leave in 10 minutes")).toBeInTheDocument();
    expect(screen.getByText("Stats Review")).toBeInTheDocument();
    expect(screen.getByText(/WAT Leave in 10 minutes/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss warning"));
    fireEvent.click(screen.getByLabelText("Dismiss delay alert"));
    expect(setShowConflictAlert).toHaveBeenCalledWith(false);
    expect(setShowTflAlert).toHaveBeenCalledWith(false);
  });

  it("renders free-now state and no-more-events copy when there is no current block", () => {
    renderWidget(
      {},
      {
        eventCount: 2,
        nextEvent: null,
        tasksPending: 0,
      },
    );

    expect(screen.getByText("Nothing on right now")).toBeInTheDocument();
    expect(screen.getByText("No more events today")).toBeInTheDocument();
  });
});
