import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlanFreeRowContent } from "@/pages/homepage/components/mini_timeline/parts/PlanFreeRowContent";
import { ConflictCard, ConflictActions } from "@/pages/homepage/components/mini_timeline/parts/ConflictPairParts";
import { EventTagSlot, EventDuration, ConflictPopover } from "@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts";
import { EventContextMenu } from "@/pages/homepage/components/mini_timeline/EventContextMenu";
import { NowStrip } from "@/pages/homepage/components/mini_timeline/NowStrip";
import { PlanEventRow } from "@/pages/homepage/components/mini_timeline/PlanEventRow";
import { getConflictResolutionPlan } from "@/pages/homepage/components/mini_timeline/ConflictPairRow";
import * as sleepHook from "@/components/settings/hooks/useSleepWarning";
import { miniTimelineStyles as styles } from "./testSupport/miniTimelineStyles";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, onClick }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock("react-dom", () => ({
  createPortal: (node) => node,
}));
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <span>Warn</span>,
  Pencil: () => <span>EditIcon</span>,
  RotateCw: () => <span>Spin</span>,
  Trash2: () => <span>Trash</span>,
}));
vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({
  fmtDurationShort: (mins) => `${mins}m`,
  formatTime: () => "10:00",
  formatTime12h: () => "10:00",
}));
vi.mock("@/pages/homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (title) => title?.replace("✨", "") || title,
  isLecture: () => false,
}));
vi.mock("@/pages/homepage/components/mini_timeline/helpers/gapRowUtils", () => ({
  formatGapDuration: (mins) => `${mins}m`,
  getGapRecommendationTitle: (task) => task?.title || "Short breather",
}));
vi.mock("@/pages/homepage/utils/taskUtils", () => ({
  taskDurationMins: (task) => task?.minutes || 25,
}));
vi.mock("@/pages/homepage/utils/planTimelineRows", () => ({
  CAMPUS_DISPLAY: { waterloo: "Waterloo", strand: "Strand" },
}));
vi.mock("@/components/calendar/utils/eventUtils", () => ({
  isReadOnlyEvent: vi.fn(() => false),
}));
vi.mock("@/components/settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: vi.fn(() => false),
}));
vi.mock("@/pages/homepage/utils/timelineUtils", () => ({
  getGapStartDate: () => new Date("2026-03-28T11:00:00.000Z"),
}));
vi.mock("@/pages/homepage/components/mini_timeline/helpers/eventAccent", () => ({
  getEventAccentColor: () => "#abc",
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts", async () => {
  const actual = await vi.importActual("@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts");
  return {
    ...actual,
    ConflictPopover: ({ onAutoReschedule, onMoveTomorrow, onEdit }) => (
      <div>
        <button onClick={onAutoReschedule}>Auto</button>
        <button onClick={onMoveTomorrow}>Tomorrow</button>
        <button onClick={onEdit}>Edit</button>
      </div>
    ),
  };
});
vi.mock("@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout", () => ({
  TimelineRowLayout: ({ children }) => <div>{children}</div>,
  TimelineGutter: ({ timeLabel }) => <div>{timeLabel}</div>,
  TimelineSpineCell: () => <span />,
}));
vi.mock("@/components/common/badge/Badge", () => ({
  default: ({ children }) => <span data-testid="badge">{children}</span>,
}));

const baseTask = { id: "t1", title: "Write report", minutes: 50 };
const baseRow = {
  id: "evt-1",
  item: {
    id: 1,
    title: "✨Seminar",
    start_time: "2026-03-28T10:00:00Z",
    end_time: "2026-03-28T11:15:00Z",
    tag: 9,
  },
  durationMins: 75,
  endMins: 675,
  isOverlap: true,
  isPast: false,
  active: false,
};
const rows = [baseRow, { type: "free", gapStartMins: 700, minutes: 90 }];

const renderFreeRow = (props = {}) =>
  render(
    <PlanFreeRowContent
      styles={styles}
      gapContext={{ type: "personal" }}
      durationLabel="30m"
      {...props}
    />,
  );

const renderEventRow = (props = {}) => {
  const conflictPopoverRef = React.createRef();
  return render(
    <PlanEventRow
      row={baseRow}
      rows={rows}
      taskLists={[]}
      conflictPopoverRowId="evt-1"
      conflictPopoverRef={conflictPopoverRef}
      setConflictPopoverRowId={vi.fn()}
      onConflictAutoMove={vi.fn()}
      onPushTomorrow={vi.fn()}
      onEdit={vi.fn()}
      onCardClick={vi.fn()}
      onEventContextMenu={vi.fn()}
      getTag={() => ({ name: "Study" })}
      styles={styles}
      sleepWindow={{ sleepTime: "23:00", wakeTime: "07:00" }}
      selectedDate={new Date("2026-03-28T00:00:00Z")}
      {...props}
    />,
  );
};

describe("Mini timeline integration coverage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders transit gap details", () => {
    renderFreeRow({
      gapContext: {
        type: "transit",
        prevCampus: "waterloo",
        nextCampus: "strand",
        transitMins: 12,
      },
    });
    expect(screen.getByText("Waterloo → Strand")).toBeInTheDocument();
  });

  it("renders study candidate actions", () => {
    const onStartTask = vi.fn();
    renderFreeRow({
      gapContext: { type: "study" },
      candidateTask: { ...baseTask, priority: "urgent" },
      onStartTask,
      onSkipTask: vi.fn(),
      isBestGap: true,
    });
    fireEvent.click(screen.getByText("Slot in →"));
    expect(onStartTask).toHaveBeenCalledWith(expect.objectContaining(baseTask));
  });

  it("skips transit-partial assigned tasks", () => {
    const onSkipTask = vi.fn();
    renderFreeRow({
      gapContext: {
        type: "transit-partial",
        prevCampus: "waterloo",
        nextCampus: "strand",
        transitMins: 8,
        freeAfterTransit: 20,
      },
      assignedTask: baseTask,
      onSkipTask,
      onStartTask: vi.fn(),
    });
    fireEvent.click(screen.getByLabelText("Skip Write report"));
    expect(onSkipTask).toHaveBeenCalledWith("t1");
  });

  it("shows move controls on conflict cards", () => {
    const onMoveTomorrow = vi.fn();
    const row = { item: { title: "Lecture" }, isReadOnly: false };
    render(
      <ConflictCard
        styles={styles}
        itemRow={row}
        accent="#fff"
        isSleepTime
        canMoveTomorrow
        onMoveTomorrow={onMoveTomorrow}
        onActivate={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    );
  fireEvent.click(screen.getByText("→ Move to tomorrow"));
    expect(onMoveTomorrow).toHaveBeenCalled();
  });

  it("renders conflict actions and edit pills", () => {
    const items = [{ id: "a", item: { title: "Task" }, isReadOnly: false }];
    const onAutoMove = vi.fn();
    const onEdit = vi.fn();
    render(
      <ConflictActions
        styles={styles}
        items={items}
        freeRow={{}}
        movable={items[0]}
        onAutoMove={onAutoMove}
        onEdit={onEdit}
      />,
    );
    fireEvent.click(screen.getByText("Auto-arrange"));
    fireEvent.click(screen.getByText("Task"));
    expect(onAutoMove).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
  });

  it("toggles conflict popover from tag slot", () => {
    const onToggleConflictPopover = vi.fn();
    render(
      <EventTagSlot
        styles={styles}
        isOverlap
        rowId="r1"
        isReadOnly={false}
        moduleCode={null}
        matchTask={{ task_list: 7 }}
        taskLists={[{ id: 7, name: "Focus" }]}
        accentColor="#abc"
        onToggleConflictPopover={onToggleConflictPopover}
      />,
    );
    fireEvent.click(screen.getByText("Fix it"));
    expect(onToggleConflictPopover).toHaveBeenCalledWith("r1");
  });

  it("renders module pills when moduleCode is present", () => {
    render(
      <EventTagSlot
        styles={styles}
        isOverlap={false}
        isReadOnly
        rowId="r2"
        moduleCode="CS101"
        matchTask={{ task_list: null }}
        taskLists={[]}
        accentColor="#123"
        onToggleConflictPopover={vi.fn()}
      />,
    );
    expect(screen.getByText("CS101")).toBeInTheDocument();
  });

  it("renders duration pills only for positive minutes", () => {
    const { rerender } = render(<EventDuration styles={styles} durationMins={0} />);
    expect(screen.queryByText("0m")).toBeNull();
    rerender(<EventDuration styles={styles} durationMins={45} />);
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("shows conflict popover fallbacks", () => {
    const onMoveTomorrow = vi.fn();
    render(
      <ConflictPopover
        styles={styles}
        nextFreeRow={null}
        onAutoReschedule={vi.fn()}
        onMoveTomorrow={onMoveTomorrow}
        onEdit={vi.fn()}
      />,
    );
  fireEvent.click(screen.getByText("Tomorrow"));
    expect(onMoveTomorrow).toHaveBeenCalled();
  });

  it("handles event context menu actions", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    render(
      <EventContextMenu
        eventItem={{ id: 1 }}
        pos={{ x: 5, y: 6 }}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
        styles={styles}
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    await Promise.resolve();
    fireEvent.click(screen.getByText("Delete"));
    await Promise.resolve();
    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders timer sessions and break labels in NowStrip", () => {
    render(
      <NowStrip
        hasTimerSession
        timerMode="break"
        timerTask="Pomodoro"
        timeLeft={75}
        styles={styles}
      />,
    );
    expect(screen.getByText("Break")).toBeInTheDocument();
    expect(screen.getByText("01:15")).toBeInTheDocument();
  });

  it("shows current block info with sleep badge", () => {
    sleepHook.doesEventOverlapSleepWindow.mockReturnValueOnce(true);
    render(
      <NowStrip
        hasTimerSession={false}
        timerMode="focus"
        timerTask={null}
        timeLeft={0}
        styles={styles}
        currentBlock={{
          title: "Read",
          start_time: "2026-03-28T21:00:00Z",
          end_time: "2026-03-28T22:00:00Z",
        }}
        sleepWindow={{ sleepTime: "20:00", wakeTime: "06:00" }}
      />,
    );
    expect(screen.getByText("Read 😴")).toBeInTheDocument();
  });

  it("renders PlanEventRow with conflict popover actions", () => {
    const setConflictPopoverRowId = vi.fn();
  renderEventRow({ setConflictPopoverRowId });
  fireEvent.click(screen.getByText("Auto"));
  const card = screen.getByText("Seminar").closest("[role='button']");
  fireEvent.keyDown(card, { key: " " });
  fireEvent.contextMenu(card);
    expect(setConflictPopoverRowId).toHaveBeenCalled();
  });

  it("creates relocation plans that hit ordering fallbacks", () => {
    const row = {
      items: [
        {
          id: "a",
          durationMins: 45,
          item: {
            id: 2,
            priority: "medium",
            start_time: "2026-03-28T09:00:00Z",
            tag_name: null,
            tag: { name: "study" },
          },
        },
        {
          id: "b",
          durationMins: 30,
          item: {
            id: 3,
            priority: "medium",
            start_time: "2026-03-28T09:15:00Z",
            tag_name: null,
            tag: { name: "lecture" },
          },
        },
      ],
      endMins: 600,
    };
    const plan = getConflictResolutionPlan({
      row,
      rows,
      selectedDate: new Date("2026-03-28T00:00:00Z"),
      canRelocateEvent: () => true,
    });
    expect(plan?.type).toBe("auto-arrange");
  });
});
