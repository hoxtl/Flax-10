import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const createPortal = vi.fn((node) => node);
const useMiniTimelineData = vi.fn();
const useMiniTimelineState = vi.fn();
const isReadOnlyEvent = vi.fn((item) => Boolean(item.readOnly));
const isToday = vi.fn(() => true);

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (...args) => createPortal(...args) };
});

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

vi.mock("lucide-react", () => ({
  Pencil: () => <span>pencil</span>,
  Trash2: () => <span>trash</span>,
}));

vi.mock("../../../components/Calendar/utils/eventUtils", () => ({
  isReadOnlyEvent: (...args) => isReadOnlyEvent(...args),
}));

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isToday: (...args) => isToday(...args),
}));

vi.mock("../../../pages/Homepage/hooks/useMiniTimelineData", () => ({
  useMiniTimelineData: (...args) => useMiniTimelineData(...args),
}));

vi.mock("../../../pages/Homepage/hooks/useMiniTimelineState", () => ({
  useMiniTimelineState: (...args) => useMiniTimelineState(...args),
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/NowStrip", () => ({
  NowStrip: ({ timerTask }) => <div>now-strip-{timerTask}</div>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/MiniTimelineRowRenderer", () => ({
  MiniTimelineRowRenderer: ({ row, props }) => (
    <div>
      <button type="button" onClick={() => props.onEventContextMenu?.({ id: row.id, title: row.title || "Event" }, 12, 34)}>
        row-{row.id}
      </button>
      <button type="button" onClick={() => props.onQuickStart?.(new Date("2026-03-24T12:00:00.000Z"), 30, { id: 99, title: "Essay" }, { id: 100, title: "Next" })}>
        quick-{row.id}
      </button>
      <button type="button" onClick={() => props.onSkipGapTask?.(row.id, 44)}>
        skip-{row.id}
      </button>
    </div>
  ),
}));

import { EventContextMenu } from "../../../pages/Homepage/components/MiniTimeline/EventContextMenu";
import { MiniTimeline } from "../../../pages/Homepage/components/MiniTimeline/MiniTimeline";
import {
  getConflictPriorityRank,
  getConflictResolutionPlan,
  getMoveTomorrowWindow,
} from "../../../pages/Homepage/components/MiniTimeline/ConflictPairRow";

const styles = new Proxy({}, { get: (_, key) => key });

describe("MiniTimeline extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMiniTimelineState.mockReturnValue({
      eventCtxMenu: null,
      setEventCtxMenu: vi.fn(),
      attachNowRow: vi.fn(),
    });
    useMiniTimelineData.mockReturnValue({
      currentBlock: { title: "Lecture" },
      rows: [],
      gapDeadlineFallbacks: {},
      assignedGapTasks: { map: {}, nextMap: {} },
    });
  });

  it("covers event context menu actions and outside dismissal", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <EventContextMenu
        eventItem={{ id: 1, title: "Event" }}
        pos={{ x: 10, y: 20 }}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
        styles={styles}
      />,
    );

    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith({ id: 1, title: "Event" });
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith({ id: 1, title: "Event" });
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders mini timeline now strip, empty state, and event context-menu branch", () => {
    const setEventCtxMenu = vi.fn();
    useMiniTimelineState.mockReturnValueOnce({
      eventCtxMenu: null,
      setEventCtxMenu,
      attachNowRow: vi.fn(),
    });

    const { rerender } = render(
      <MiniTimeline
        styles={styles}
        sortedEvents={[]}
        selectedDate="2026-03-24"
        now={new Date("2026-03-24T10:00:00.000Z")}
        dayTasks={[]}
        tasksDueToday={[]}
        suggestableTasks={[]}
        deadlineSuggestions={[]}
        hasTimerSession
        timerTask="Essay"
        timerMode="focus"
        timeLeft={120}
      />,
    );

    expect(screen.getByText("now-strip-Essay")).toBeInTheDocument();
    expect(screen.getByText("No events scheduled for this day.")).toBeInTheDocument();

    useMiniTimelineState.mockReturnValueOnce({
      eventCtxMenu: { eventItem: { id: 3, title: "Event" }, x: 22, y: 44 },
      setEventCtxMenu,
      attachNowRow: vi.fn(),
    });
    useMiniTimelineData.mockReturnValueOnce({
      currentBlock: null,
      rows: [{ id: "evt-1", type: "event", title: "Seminar" }],
      gapDeadlineFallbacks: {},
      assignedGapTasks: { map: {}, nextMap: {} },
    });

    rerender(
      <MiniTimeline
        styles={styles}
        sortedEvents={[]}
        selectedDate="2026-03-24"
        now={new Date("2026-03-24T10:00:00.000Z")}
        dayTasks={[]}
        tasksDueToday={[]}
        suggestableTasks={[]}
        deadlineSuggestions={[]}
        hasTimerSession={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("row-evt-1"));
    expect(setEventCtxMenu).toHaveBeenCalledWith({ eventItem: { id: "evt-1", title: "Seminar" }, x: 12, y: 34 });
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("covers quick-start, gap skipping, and read-only context-menu suppression", () => {
    const onQuickStart = vi.fn();
    useMiniTimelineState.mockReturnValue({
      eventCtxMenu: { eventItem: { id: 5, title: "Read only", readOnly: true }, x: 10, y: 20 },
      setEventCtxMenu: vi.fn(),
      attachNowRow: vi.fn(),
    });
    useMiniTimelineData.mockReturnValue({
      currentBlock: null,
      rows: [{ id: "gap-1", type: "free", title: "Gap" }],
      gapDeadlineFallbacks: {},
      assignedGapTasks: { map: {}, nextMap: {} },
    });

    render(
      <MiniTimeline
        styles={styles}
        sortedEvents={[]}
        selectedDate="2026-03-24"
        now={new Date("2026-03-24T10:00:00.000Z")}
        dayTasks={[]}
        tasksDueToday={[]}
        suggestableTasks={[]}
        deadlineSuggestions={[]}
        onQuickStart={onQuickStart}
      />,
    );

    fireEvent.click(screen.getByText("quick-gap-1"));
    fireEvent.click(screen.getByText("skip-gap-1"));
    expect(onQuickStart).toHaveBeenCalledWith(
      new Date("2026-03-24T12:00:00.000Z"),
      30,
      { id: 99, title: "Essay" },
      { id: 100, title: "Next" },
    );
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("covers conflict resolution helper branches", () => {
    const row = {
      endMins: 700,
      items: [
        { id: 1, durationMins: 30, item: { title: "Read", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T09:30:00.000Z", priority: "urgent", readOnly: false } },
        { id: 2, durationMins: 45, item: { title: "Lecture", start_time: "2026-03-24T09:05:00.000Z", end_time: "2026-03-24T09:50:00.000Z", tag_name: "lecture", priority: "medium", readOnly: false } },
      ],
    };
    const rows = [{ type: "free", gapStartMins: 720, minutes: 60 }];

    expect(getConflictPriorityRank({ priority: "high" })).toBe(2);
    const tomorrow = getMoveTomorrowWindow({ start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T09:40:00.000Z" });
    expect(tomorrow.start.getDate()).toBe(25);

    const plan = getConflictResolutionPlan({
      row,
      rows,
      selectedDate: "2026-03-24",
      canRelocateEvent: () => true,
    });
    expect(plan.type).toBe("auto-arrange");

    const tomorrowPlan = getConflictResolutionPlan({
      row,
      rows: [],
      selectedDate: "2026-03-24",
      canRelocateEvent: () => true,
    });
    expect(tomorrowPlan.start).toBeInstanceOf(Date);

    const none = getConflictResolutionPlan({
      row: { items: [{ item: { title: "Lecture", tag_name: "lecture", readOnly: true } }] },
      rows: [],
      selectedDate: "2026-03-24",
      canRelocateEvent: () => false,
    });
    expect(none).toBeNull();
  });
});
