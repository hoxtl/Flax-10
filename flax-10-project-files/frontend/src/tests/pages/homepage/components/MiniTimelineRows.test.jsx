import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlanEventRow } from "@/pages/homepage/components/mini_timeline/PlanEventRow";
import { getConflictResolutionPlan } from "@/pages/homepage/components/mini_timeline/ConflictPairRow";
import { miniTimelineStyles as styles } from "./testSupport/miniTimelineStyles";

vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({
  formatTime12h: () => "10:00",
}));
vi.mock("@/pages/homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (title) => title?.replace("✨", "") || "",
  isLecture: () => false,
}));
vi.mock("@/pages/homepage/utils/timelineUtils", () => ({
  getGapStartDate: () => new Date("2026-03-28T11:00:00.000Z"),
}));
vi.mock("@/components/calendar/utils/eventUtils", () => ({
  isReadOnlyEvent: vi.fn(() => false),
}));
vi.mock("@/components/settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: vi.fn(() => true),
}));
vi.mock("@/pages/homepage/components/mini_timeline/helpers/eventAccent", () => ({
  getEventAccentColor: () => "#abc",
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts", () => ({
  ConflictPopover: ({ onAutoReschedule, onMoveTomorrow, onEdit }) => (
    <div>
      <button onClick={onAutoReschedule}>Auto</button>
      <button onClick={onMoveTomorrow}>Tomorrow</button>
      <button onClick={onEdit}>Edit</button>
    </div>
  ),
  EventDuration: () => <span>duration</span>,
  EventTagSlot: () => <span>tag</span>,
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout", () => ({
  TimelineRowLayout: ({ children }) => <div>{children}</div>,
  TimelineGutter: ({ timeLabel }) => <div>{timeLabel}</div>,
  TimelineSpineCell: () => <span />,
}));

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

function renderEventRow(overrides = {}) {
  return render(
    <PlanEventRow
      row={baseRow}
      rows={rows}
      taskLists={[]}
      conflictPopoverRowId="evt-1"
      conflictPopoverRef={React.createRef()}
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
      {...overrides}
    />,
  );
}

describe("Mini timeline row coverage", () => {
  beforeEach(() => vi.clearAllMocks());

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
        { id: "a", durationMins: 45, item: { id: 2, priority: "medium", start_time: "2026-03-28T09:00:00Z", tag_name: null, tag: { name: "study" } } },
        { id: "b", durationMins: 30, item: { id: 3, priority: "medium", start_time: "2026-03-28T09:15:00Z", tag_name: null, tag: { name: "lecture" } } },
      ],
      endMins: 600,
    };
    const plan = getConflictResolutionPlan({ row, rows, selectedDate: new Date("2026-03-28T00:00:00Z"), canRelocateEvent: () => true });
    expect(plan?.type).toBe("auto-arrange");
  });
});
