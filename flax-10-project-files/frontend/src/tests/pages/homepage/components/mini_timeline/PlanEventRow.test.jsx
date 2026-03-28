import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as eventUtils from "@/pages/homepage/utils/eventUtils";
import { PlanEventRow } from "@/pages/homepage/components/mini_timeline/PlanEventRow";

vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({
  formatTime12h: (t) => "10:00",
}));
vi.mock("@/pages/homepage/utils/eventUtils", () => ({ stripEmojiFromTitle: vi.fn((t) => t) }));
vi.mock("@/pages/homepage/utils/timelineUtils", () => ({ getGapStartDate: vi.fn(() => new Date()) }));
const isReadOnlyEventMock = vi.fn(() => false);
vi.mock("@/components/calendar/utils/eventUtils", () => ({
  isReadOnlyEvent: (...args) => isReadOnlyEventMock(...args),
}));
vi.mock("@/components/settings/hooks/useSleepWarning", () => ({ doesEventOverlapSleepWindow: vi.fn(() => false) }));
vi.mock("@/pages/homepage/components/mini_timeline/helpers/eventAccent", () => ({
  getEventAccentColor: vi.fn(() => "#abc"),
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts", () => ({
  ConflictPopover: ({ onAutoReschedule, onMoveTomorrow, onEdit }) => (
    <div data-testid="conflict-popover">
      <button onClick={onAutoReschedule}>AutoMove</button>
      {onMoveTomorrow && <button onClick={onMoveTomorrow}>Tomorrow</button>}
      <button onClick={onEdit}>Edit</button>
    </div>
  ),
  EventDuration: ({ durationMins }) => <span data-testid="duration">{durationMins}m</span>,
  EventTagSlot: () => <div data-testid="tag-slot" />,
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout", () => ({
  TimelineRowLayout: ({ children }) => <div data-testid="row">{children}</div>,
  TimelineGutter: ({ timeLabel }) => <div data-testid="gutter">{timeLabel}</div>,
  TimelineSpineCell: () => <div data-testid="spine" />,
}));

const styles = {
  planTimelineCard: "card", planTimelineCardNow: "now", planTimelineCardPast: "past",
  planTimelineCardOverlap: "overlap", planTimelineCardRoutine: "routine",
  planTimelineCardWithDuration: "dur", planTimelineCardWrap: "wrap",
  planTimelineCardAccent: "accent", planTimelineCardBody: "body",
  planTimelineCardTimeStack: "ts", planTimelineCardTimeRow: "tr",
  planTimelineCardTimeSlot: "slot", planTimelineCardTitleRow: "trow",
  planTimelineCardTitle: "title", planTimelineSleepBadge: "sleep",
  planTimelineRowPast: "rowpast",
};

const baseRow = { id: "r1", item: { id: "e1", title: "Lecture", start_time: "2026-03-28T10:00:00Z", end_time: "2026-03-28T11:00:00Z" }, durationMins: 60, isOverlap: false, isPast: false, active: false };
const baseProps = { row: baseRow, rows: [], styles, conflictPopoverRowId: null, setConflictPopoverRowId: vi.fn(), selectedDate: new Date() };

describe("PlanEventRow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders event title and gutter", () => {
    render(<PlanEventRow {...baseProps} />);
    expect(screen.getByText("Lecture")).toBeTruthy();
    expect(screen.getByTestId("gutter").textContent).toBe("10:00");
  });

  it("opens conflict popover on overlap card click and toggles off", () => {
    const setConflictPopoverRowId = vi.fn();
    const row = { ...baseRow, isOverlap: true };
    render(<PlanEventRow {...baseProps} row={row} setConflictPopoverRowId={setConflictPopoverRowId} conflictPopoverRowId="r1" />);
    fireEvent.click(screen.getAllByRole("button")[0]);

    expect(setConflictPopoverRowId).toHaveBeenCalled();
    const updater = setConflictPopoverRowId.mock.calls[0][0];
    expect(updater(row.id)).toBeNull();
  });

  it("toggles the conflict popover on when another row is active", () => {
    const setConflictPopoverRowId = vi.fn();
    const row = { ...baseRow, isOverlap: true };
    render(<PlanEventRow {...baseProps} row={row} setConflictPopoverRowId={setConflictPopoverRowId} conflictPopoverRowId="r2" />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    const updater = setConflictPopoverRowId.mock.calls[0][0];
    expect(updater("r2")).toBe(row.id);
  });

  it("shows conflict popover when conflictPopoverRowId matches", () => {
    render(<PlanEventRow {...baseProps} row={{ ...baseRow, isOverlap: true }} conflictPopoverRowId="r1" />);
    expect(screen.getByTestId("conflict-popover")).toBeTruthy();
  });

  it("calls onCardClick when provided and not overlap", () => {
    const onCardClick = vi.fn();
    render(<PlanEventRow {...baseProps} onCardClick={onCardClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onCardClick).toHaveBeenCalled();
  });

  it("falls back to onEdit when no card click handler exists", () => {
    const onEdit = vi.fn();
    render(<PlanEventRow {...baseProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onEdit).toHaveBeenCalled();
  });

  it("prevents interactions for read-only events", () => {
    isReadOnlyEventMock.mockReturnValueOnce(true);
    const onEdit = vi.fn();
    const onCardClick = vi.fn();
    const onContextMenu = vi.fn();
    render(<PlanEventRow {...baseProps} onEdit={onEdit} onCardClick={onCardClick} onEventContextMenu={onContextMenu} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.contextMenu(screen.getByRole("button"));
    expect(onCardClick).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  it("shows a pointer cursor for read-only cards", () => {
    isReadOnlyEventMock.mockReturnValueOnce(true);
    render(<PlanEventRow {...baseProps} />);
    expect(screen.getByRole("button")).toHaveStyle({ cursor: "pointer" });
  });

  it("auto-moves conflicts when a free gap exists after the event", () => {
    const onConflictAutoMove = vi.fn();
    const setConflictPopoverRowId = vi.fn();
    const rowWithEnd = { ...baseRow, durationMins: 60, endMins: 120, id: "r1", isOverlap: true };
    const freeGap = { gapStartMins: 120, id: "gap", minutes: 90, type: "free" };
    render(
      <PlanEventRow
        {...baseProps}
        conflictPopoverRowId="r1"
        onConflictAutoMove={onConflictAutoMove}
        row={rowWithEnd}
        rows={[rowWithEnd, freeGap]}
        setConflictPopoverRowId={setConflictPopoverRowId}
      />,
    );
    fireEvent.click(screen.getByText("AutoMove"));
    expect(onConflictAutoMove).toHaveBeenCalled();
  });

  it("defers to push-tomorrow and edit actions inside the conflict popover", () => {
    const onEdit = vi.fn();
    const onPushTomorrow = vi.fn();
    const rowOverlap = { ...baseRow, id: "r9", isOverlap: true };
    render(
      <PlanEventRow
        {...baseProps}
        conflictPopoverRowId="r9"
        onEdit={onEdit}
        onPushTomorrow={onPushTomorrow}
        row={rowOverlap}
      />,
    );
    fireEvent.click(screen.getByText("Tomorrow"));
    expect(onPushTomorrow).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalled();
  });

  it("triggers via keyboard Enter and Space", () => {
    const onCardClick = vi.fn();
    const { rerender } = render(<PlanEventRow {...baseProps} onCardClick={onCardClick} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onCardClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onCardClick).toHaveBeenCalledTimes(2);
  });

  it("handles missing title (falling back to original) and missing end_time", () => {
    eventUtils.stripEmojiFromTitle.mockReturnValueOnce("");
    const row = { ...baseRow, item: { id: "e10", title: "😀", start_time: "2026-03-28T10:00:00Z" }, durationMins: 60, isOverlap: false, isPast: false, active: false };
    render(<PlanEventRow {...baseProps} row={row} />);
    expect(screen.getByText("😀")).toBeTruthy();
  });

  it("fires context menu for non-readonly events and ignores if missing", () => {
    const onEventContextMenu = vi.fn();
    render(<PlanEventRow {...baseProps} onEventContextMenu={onEventContextMenu} />);
    fireEvent.contextMenu(screen.getByRole("button"));
    expect(onEventContextMenu).toHaveBeenCalled();

    // Missing handler fallback
    render(<PlanEventRow {...baseProps} row={{ ...baseRow, id: "r2" }} onEventContextMenu={undefined} />);
    fireEvent.contextMenu(screen.getAllByRole("button")[1]);
  });

  it("handles rows without explicit times", () => {
    const row = { ...baseRow, item: { id: "e9", title: "Study" }, durationMins: 0, isPast: true, active: true, isRoutine: true };
    render(<PlanEventRow {...baseProps} row={row} />);
    expect(screen.getByTestId("gutter").textContent).toBe("");
    const card = screen.getByRole("button");
    expect(card.className).toContain("now");
    expect(card.className).toContain("past");
    expect(card.className).toContain("routine");
  });

  it("marks past rows when no longer active", () => {
    const row = { ...baseRow, isPast: true, active: false };
    render(<PlanEventRow {...baseProps} row={row} />);
    expect(screen.getByTestId("row")).toBeTruthy();
  });

  it("omits duplicate end times", () => {
    const row = { ...baseRow, item: { ...baseRow.item, end_time: baseRow.item.start_time } };
    render(<PlanEventRow {...baseProps} row={row} />);
    expect(screen.getByText("Lecture")).toBeTruthy();
  });
});
