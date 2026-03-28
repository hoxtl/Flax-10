/**
 * Covers RightNowWidget branch and alert rendering states.
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { createFnMap } from "../../../utils/testBuilderUtils";

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
  MapPin: () => <svg aria-hidden="true" />,
}));

vi.mock("@/pages/homepage/hooks/useRightNowData", () => ({
  useRightNowData: (...args) => useRightNowData(...args),
}));

vi.mock("@/pages/homepage/components/RightNowSubComponents", () => ({
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

import { RightNowWidget } from "@/pages/homepage/components/RightNowWidget";

const baseModel = {
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
  showTfl: false,
  showTflAlert: true,
  tasksPending: 0,
  timeLeftStr: null,
  timeRangeStr: null,
  commuteInfo: null,
};

const widgetProps = {
  now: new Date("2026-03-24T12:00:00.000Z"),
  isToday: true,
  navigatorContext: {},
  sortedEvents: [],
  tflDelays: [],
  tomorrowFirstEvent: null,
  taskWidgetItemsOnly: [],
};

function buildModel(overrides = {}) {
  return {
    ...baseModel,
    ...createFnMap(["setShowConflictAlert", "setShowTflAlert"]),
    ...overrides,
  };
}

function renderWidget(props = {}, model = {}) {
  useRightNowData.mockReturnValue(buildModel(model));
  return render(
    <MemoryRouter>
      <RightNowWidget {...widgetProps} {...props} />
    </MemoryRouter>,
  );
}

function rerenderWidget(rerender, props = {}, model = {}) {
  useRightNowData.mockReturnValue(buildModel(model));
  rerender(
    <MemoryRouter>
      <RightNowWidget {...widgetProps} {...props} />
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

  describe("non-today and tomorrow previews", () => {
    it("renders a preview when a future event exists", () => {
      const { rerender } = renderWidget({ isToday: false, sortedEvents: [{ title: "Seminar", start_time: "2026-03-25T09:00:00.000Z" }] });
      rerenderWidget(rerender, { isToday: false });
      expect(screen.getByText("No events for this day.")).toBeInTheDocument();
    });

    it("shows end-of-day summary with tomorrow event details", () => {
      const tomorrowFirstEvent = { title: "Morning Lab", start_time: "2026-03-25T09:00:00.000Z" };
      const { rerender } = renderWidget(
        { tomorrowFirstEvent, taskWidgetItemsOnly: [{ completed: true }], sortedEvents: [{ start_time: "2026-03-24T09:00:00.000Z" }] },
        { isEndOfDay: true },
      );
      expect(screen.getByText(/Day complete/)).toBeInTheDocument();
      expect(screen.getByText("Morning Lab")).toBeInTheDocument();
      rerenderWidget(rerender, { tomorrowFirstEvent });
    });

    it("renders empty-day copy with tomorrow preview", () => {
      const tomorrowFirstEvent = { title: "Morning Lab", start_time: "2026-03-25T09:00:00.000Z" };
      const { rerender } = renderWidget({ tomorrowFirstEvent });
      rerenderWidget(rerender, { tomorrowFirstEvent }, { isEmptyDay: true, eventCount: 0 });
      expect(screen.getByText(/Free day/)).toBeInTheDocument();
      expect(screen.getByText(/Tomorrow: Morning Lab at/)).toBeInTheDocument();
    });
  });

  describe("today alerts and commute info", () => {
    it("renders stats for events, tasks, and active block", () => {
      renderWidget(
        { sortedEvents: [{ title: "Stats Review", start_time: "2026-03-24T13:00:00.000Z", location: "Waterloo" }], taskWidgetItemsOnly: [{ completed: false }] },
        {
          currentBlock: { title: "Deep Work" },
          eventCount: 1,
          tasksPending: 1,
          timeLeftStr: "20m left",
          timeRangeStr: "12:00 - 12:30",
        },
      );
      expect(screen.getByText(/1 event · 1 task left/)).toBeInTheDocument();
      expect(screen.getByText(/Active Deep Work 20m left/)).toBeInTheDocument();
    });

    it("renders conflict and TFL alerts with dismiss actions", () => {
      const setShowConflictAlert = vi.fn();
      const setShowTflAlert = vi.fn();
      renderWidget(
        { sortedEvents: [{ title: "Stats Review", start_time: "2026-03-24T13:00:00.000Z", location: "Waterloo" }] },
        {
          conflicts: [{ a: {}, b: {} }],
          leaveByInfo: { message: "Leave in 10 minutes" },
          nextCampus: { shortName: "WAT" },
          nextEvent: { title: "Stats Review", start_time: "2026-03-24T13:00:00.000Z", location: "Waterloo" },
          showTfl: true,
          setShowConflictAlert,
          setShowTflAlert,
        },
      );
      expect(screen.getByText("conflicts:1")).toBeInTheDocument();
      expect(screen.getByText("Leave in 10 minutes")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Dismiss warning"));
      fireEvent.click(screen.getByLabelText("Dismiss delay alert"));
      expect(setShowConflictAlert).toHaveBeenCalledWith(false);
      expect(setShowTflAlert).toHaveBeenCalledWith(false);
    });
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
