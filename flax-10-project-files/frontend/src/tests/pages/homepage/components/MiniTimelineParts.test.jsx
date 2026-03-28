import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlanFreeRowContent } from "@/pages/homepage/components/mini_timeline/parts/PlanFreeRowContent";
import { ConflictCard, ConflictActions } from "@/pages/homepage/components/mini_timeline/parts/ConflictPairParts";
import { EventTagSlot, EventDuration, ConflictPopover } from "@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts";
import { EventContextMenu } from "@/pages/homepage/components/mini_timeline/EventContextMenu";
import { NowStrip } from "@/pages/homepage/components/mini_timeline/NowStrip";
import { miniTimelineStyles as styles } from "./testSupport/miniTimelineStyles";
import * as sleepHook from "@/components/settings/hooks/useSleepWarning";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, onClick }) => <a href={to} onClick={onClick}>{children}</a>,
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
}));
vi.mock("@/pages/homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (title) => title,
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
vi.mock("@/components/settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: vi.fn(() => false),
}));
vi.mock("@/components/common/badge/Badge", () => ({
  default: ({ children }) => <span data-testid="badge">{children}</span>,
}));

const baseTask = { id: "t1", title: "Write report", minutes: 50 };

describe("Mini timeline coverage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders transit and passive gaps", () => {
    render(<PlanFreeRowContent styles={styles} gapContext={{ type: "transit", prevCampus: "waterloo", nextCampus: "strand", transitMins: 12 }} durationLabel="30m" />);
    render(<PlanFreeRowContent styles={styles} gapContext={{ type: "personal" }} durationLabel="15m" />);
    expect(screen.getByText("Waterloo → Strand")).toBeInTheDocument();
    expect(screen.getByText("Short breather")).toBeInTheDocument();
  });

  it("renders transit-partial rows with skip controls", () => {
    const onSkipTask = vi.fn();
    render(<PlanFreeRowContent styles={styles} gapContext={{ type: "transit-partial", prevCampus: "waterloo", nextCampus: "strand", transitMins: 8, freeAfterTransit: 20 }} durationLabel="25m" assignedTask={baseTask} onSkipTask={onSkipTask} onStartTask={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Skip Write report"));
    expect(onSkipTask).toHaveBeenCalledWith("t1");
  });

  it("renders study gaps with candidate actions", () => {
    const onStartTask = vi.fn();
    render(<PlanFreeRowContent styles={styles} gapContext={{ type: "study" }} durationLabel="40m" candidateTask={{ ...baseTask, priority: "urgent" }} onStartTask={onStartTask} onSkipTask={vi.fn()} isBestGap />);
    fireEvent.click(screen.getByText("Slot in →"));
    expect(onStartTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Write report" }));
  });

  it("shows move controls on conflict cards", () => {
    const onMoveTomorrow = vi.fn();
    const row = { item: { title: "Lecture", start_time: "2026-03-28T09:00:00Z" }, isReadOnly: false };
    render(<ConflictCard styles={styles} itemRow={row} accent="#fff" isSleepTime onMoveTomorrow={onMoveTomorrow} canMoveTomorrow onActivate={vi.fn()} onContextMenu={vi.fn()} />);
    fireEvent.click(screen.getByText("→ Move to tomorrow"));
    expect(onMoveTomorrow).toHaveBeenCalled();
  });

  it("renders conflict actions and edit pills", () => {
    const onAutoMove = vi.fn();
    const onEdit = vi.fn();
    const items = [{ id: "a", item: { title: "Task" }, isReadOnly: false }];
    render(<ConflictActions styles={styles} items={items} freeRow={{}} movable={items[0]} onAutoMove={onAutoMove} onEdit={onEdit} />);
    fireEvent.click(screen.getByText("Auto-arrange"));
    fireEvent.click(screen.getByText("Task"));
    expect(onAutoMove).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
  });

  it("shows conflict tag slot controls", () => {
    const onToggleConflictPopover = vi.fn();
    render(<EventTagSlot styles={styles} isOverlap rowId="r1" isReadOnly={false} moduleCode={null} matchTask={{ task_list: 7 }} taskLists={[{ id: 7, name: "Focus" }]} accentColor="#abc" onToggleConflictPopover={onToggleConflictPopover} />);
    fireEvent.click(screen.getByText("Fix it"));
    expect(onToggleConflictPopover).toHaveBeenCalledWith("r1");
  });

  it("renders module pills when moduleCode is present", () => {
    const { rerender } = render(<EventTagSlot styles={styles} isOverlap={false} isReadOnly rowId="r2" moduleCode="CS101" matchTask={{ task_list: null }} taskLists={[]} accentColor="#123" onToggleConflictPopover={vi.fn()} />);
    expect(screen.getByText("CS101")).toBeInTheDocument();

    rerender(<EventTagSlot styles={styles} isOverlap={false} isReadOnly rowId="r3" moduleCode="CS102" matchTask={{ task_list: "9" }} taskLists={[{ id: 9, name: "X" }]} accentColor="#123" onToggleConflictPopover={vi.fn()} />);
    expect(screen.getByRole("link", { name: "CS102" })).toHaveAttribute("href", "/tasks?list=9&module=CS102");
  });

  it("renders duration pills only for positive minutes", () => {
    const { rerender } = render(<EventDuration styles={styles} durationMins={0} />);
    expect(screen.queryByText("0m")).toBeNull();
    rerender(<EventDuration styles={styles} durationMins={45} />);
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("shows conflict popover variants", () => {
    const onMoveTomorrow = vi.fn();
    const { rerender } = render(<ConflictPopover styles={styles} nextFreeRow={null} onAutoReschedule={vi.fn()} onMoveTomorrow={onMoveTomorrow} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByText("→ Move to tomorrow"));
    expect(onMoveTomorrow).toHaveBeenCalled();

    rerender(<ConflictPopover styles={styles} nextFreeRow={{ id: 1 }} onAutoReschedule={vi.fn()} onMoveTomorrow={null} onEdit={vi.fn()} />);
    expect(screen.queryByText("→ Move to tomorrow")).toBeNull();
  });

  it("performs menu edit and delete actions", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    render(<EventContextMenu eventItem={{ id: 1 }} pos={{ x: 5, y: 6 }} onEdit={onEdit} onDelete={onDelete} onClose={onClose} styles={styles} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Delete"));
    await vi.waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders timer sessions and break labels in NowStrip", () => {
    render(<NowStrip hasTimerSession timerMode="break" timerTask="Pomodoro" timeLeft={75} styles={styles} />);
    expect(screen.getByText("Break")).toBeInTheDocument();
    expect(screen.getByText("01:15")).toBeInTheDocument();
  });

  it("shows current block info with sleep badge", () => {
    sleepHook.doesEventOverlapSleepWindow.mockReturnValueOnce(true);
    render(<NowStrip hasTimerSession={false} timerMode="focus" timerTask={null} timeLeft={0} styles={styles} currentBlock={{ title: "Read", start_time: "2026-03-28T21:00:00Z", end_time: "2026-03-28T22:00:00Z" }} sleepWindow={{ sleepTime: "20:00", wakeTime: "06:00" }} />);
    expect(screen.getByText("Read 😴")).toBeInTheDocument();
  });

  it("uses fallbacks for transit variants", () => {
    const { rerender } = render(<PlanFreeRowContent styles={styles} gapContext={{ type: "transit", prevCampus: "unknown", nextCampus: "mystery", transitMins: 8 }} durationLabel="18m" />);
    expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();

    rerender(<PlanFreeRowContent styles={styles} gapContext={{ type: "evening" }} durationLabel="60m" />);
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });
});

import { TimelineRowLayout, TimelineGutter, TimelineSpineCell } from "@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout";

describe("TimelineRowLayout parts", () => {
  it("applies layout styles and custom classes", () => {
    const { container } = render(
      <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={44} rowClassName="extra">
        <span>child</span>
      </TimelineRowLayout>,
    );
    expect(container.firstChild).toHaveStyle({ marginTop: "12px", minHeight: "44px" });
    expect(container.firstChild.className).toContain("extra");
  });

  it("toggles time labels and gutter content", () => {
    const { container, rerender } = render(<TimelineGutter row={{ hideTimeLabel: true }} styles={styles} timeLabel="10:00" />);
    expect(container.querySelector(`.${styles.planTimelineTime}`)).toBeNull();

    rerender(<TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="11:00" />);
    expect(screen.getByText("11:00")).toBeInTheDocument();

    render(<TimelineSpineCell styles={styles} />);
    expect(document.querySelector(`.${styles.planTimelineSpineCell}`)).toBeTruthy();
  });
});
