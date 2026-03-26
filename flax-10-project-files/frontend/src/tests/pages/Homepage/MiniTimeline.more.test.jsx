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

vi.mock("../../../pages/Homepage/components/mini_timeline/NowStrip", () => ({
  NowStrip: ({ timerTask }) => <div>now-strip-{timerTask}</div>,
}));

vi.mock("../../../pages/Homepage/components/mini_timeline/MiniTimelineRowRenderer", () => ({
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

import { EventContextMenu } from "../../../pages/Homepage/components/mini_timeline/EventContextMenu";
import { MiniTimeline } from "../../../pages/Homepage/components/mini_timeline/MiniTimeline";
import {
  getConflictPriorityRank,
  getConflictResolutionPlan,
  getMoveTomorrowWindow,
} from "../../../pages/Homepage/components/mini_timeline/ConflictPairRow";

const styles = new Proxy({}, { get: (_, key) => key });

const baseTimelineProps = {
  styles,
  sortedEvents: [],
  selectedDate: "2026-03-24",
  now: new Date("2026-03-24T10:00:00.000Z"),
  dayTasks: [],
  tasksDueToday: [],
  suggestableTasks: [],
  deadlineSuggestions: [],
};

const renderTimeline = (props = {}) => render(<MiniTimeline {...baseTimelineProps} {...props} />);

const mockTimelineState = (overrides = {}) => {
  const value = { eventCtxMenu: null, setEventCtxMenu: vi.fn(), attachNowRow: vi.fn(), ...overrides };
  useMiniTimelineState.mockReturnValue(value);
  return value;
};

const mockTimelineData = (overrides = {}) => {
  const value = {
    currentBlock: { title: "Lecture" },
    rows: [],
    gapDeadlineFallbacks: {},
    assignedGapTasks: { map: {}, nextMap: {} },
    ...overrides,
  };
  useMiniTimelineData.mockReturnValue(value);
  return value;
};

describe("EventContextMenu", () => {
  it("fires edit, delete, and outside click callbacks", async () => {
    const props = {
      eventItem: { id: 1, title: "Event" },
      pos: { x: 10, y: 20 },
      onEdit: vi.fn(),
      onDelete: vi.fn().mockResolvedValue(undefined),
      onClose: vi.fn(),
      styles,
    };
    render(<EventContextMenu {...props} />);

    fireEvent.click(screen.getByText("Edit"));
    expect(props.onEdit).toHaveBeenCalledWith(props.eventItem);
    fireEvent.click(screen.getByText("Delete"));
    expect(props.onDelete).toHaveBeenCalledWith(props.eventItem);
    fireEvent.mouseDown(document.body);
    expect(props.onClose).toHaveBeenCalled();
  });
});

describe("MiniTimeline interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimelineState();
    mockTimelineData();
  });

  it("renders the now strip and empty state copy", () => {
    renderTimeline({ hasTimerSession: true, timerTask: "Essay", timerMode: "focus", timeLeft: 120 });
    expect(screen.getByText("now-strip-Essay")).toBeInTheDocument();
    expect(screen.getByText("No events scheduled for this day.")).toBeInTheDocument();
  });

  it("opens the event context menu when a row is clicked", () => {
    const { setEventCtxMenu } = mockTimelineState();
    mockTimelineData({ rows: [{ id: "evt-1", type: "event", title: "Seminar" }] });
    renderTimeline();

    fireEvent.click(screen.getByText("row-evt-1"));
    expect(setEventCtxMenu).toHaveBeenCalledWith({ eventItem: { id: "evt-1", title: "Seminar" }, x: 12, y: 34 });
  });

  it("renders the portal menu when state carries an event", () => {
    mockTimelineState({
      eventCtxMenu: { eventItem: { id: 3, title: "Event" }, x: 22, y: 44 },
      setEventCtxMenu: vi.fn(),
    });
    mockTimelineData({ rows: [{ id: "evt-2", type: "event", title: "Workshop" }] });
    renderTimeline({ onEdit: vi.fn(), onDelete: vi.fn() });
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("fires quick-start and gap skip handlers", () => {
    mockTimelineData({ rows: [{ id: "gap-1", type: "free", title: "Gap" }] });
    const onQuickStart = vi.fn();
    renderTimeline({ onQuickStart });

    fireEvent.click(screen.getByText("quick-gap-1"));
    fireEvent.click(screen.getByText("skip-gap-1"));
    expect(onQuickStart).toHaveBeenCalledWith(
      new Date("2026-03-24T12:00:00.000Z"),
      30,
      { id: 99, title: "Essay" },
      { id: 100, title: "Next" },
    );
  });

  it("suppresses edit controls for read-only events", () => {
    mockTimelineState({
      eventCtxMenu: { eventItem: { id: 5, title: "Read only", readOnly: true }, x: 10, y: 20 },
      setEventCtxMenu: vi.fn(),
    });
    mockTimelineData({ rows: [{ id: "gap-2", type: "free", title: "Gap" }] });
    renderTimeline();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });
});

const buildConflictRow = () => ({
  endMins: 700,
  items: [
    { id: 1, durationMins: 30, item: { title: "Read", start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T09:30:00.000Z", priority: "urgent", readOnly: false } },
    { id: 2, durationMins: 45, item: { title: "Lecture", start_time: "2026-03-24T09:05:00.000Z", end_time: "2026-03-24T09:50:00.000Z", tag_name: "lecture", priority: "medium", readOnly: false } },
  ],
});

describe("Conflict resolution helpers", () => {
  it("ranks conflict priorities", () => {
    expect(getConflictPriorityRank({ priority: "high" })).toBe(2);
    expect(getConflictPriorityRank({ priority: "urgent" })).toBe(3);
  });

  it("builds the move-tomorrow window", () => {
    const window = getMoveTomorrowWindow({ start_time: "2026-03-24T09:00:00.000Z", end_time: "2026-03-24T09:40:00.000Z" });
    expect(window.start.getDate()).toBe(25);
    expect(window.end.getHours()).toBe(9);
  });

  it("returns an auto plan when a free row exists", () => {
    const plan = getConflictResolutionPlan({
      row: buildConflictRow(),
      rows: [{ type: "free", gapStartMins: 720, minutes: 60 }],
      selectedDate: "2026-03-24",
      canRelocateEvent: () => true,
    });
    expect(plan?.type).toBe("auto-arrange");
  });

  it("falls back to tomorrow or null when relocation fails", () => {
    const tomorrowPlan = getConflictResolutionPlan({
      row: buildConflictRow(),
      rows: [],
      selectedDate: "2026-03-24",
      canRelocateEvent: () => true,
    });
    expect(tomorrowPlan?.start).toBeInstanceOf(Date);

    const none = getConflictResolutionPlan({
      row: { items: [{ item: { title: "Lecture", tag_name: "lecture", readOnly: true } }] },
      rows: [],
      selectedDate: "2026-03-24",
      canRelocateEvent: () => false,
    });
    expect(none).toBeNull();
  });
});
