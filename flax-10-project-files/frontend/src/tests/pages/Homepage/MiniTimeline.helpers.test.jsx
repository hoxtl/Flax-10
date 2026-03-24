import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { getEventAccentColor } from "../../../pages/Homepage/components/MiniTimeline/helpers/eventAccent";
import { buildDeadlineTask } from "../../../pages/Homepage/components/MiniTimeline/helpers/deadlineTask";
import { getConflictTimeLabel } from "../../../pages/Homepage/components/MiniTimeline/helpers/conflictRowUtils";
import {
  formatGapDuration,
  getGapMinHeight,
  getTinyGapMinHeight,
  getGapTimeLabel,
  getTinyGapTimeLabel,
  getGapRecommendationTitle,
} from "../../../pages/Homepage/components/MiniTimeline/helpers/gapRowUtils";
import { NowStrip } from "../../../pages/Homepage/components/MiniTimeline/NowStrip";
import { MiniTimelineRowRenderer } from "../../../pages/Homepage/components/MiniTimeline/MiniTimelineRowRenderer";
import {
  TimelineRowLayout,
  TimelineGutter,
  TimelineSpineCell,
} from "../../../pages/Homepage/components/MiniTimeline/parts/TimelineRowLayout";
import { PlanFreeRowContent } from "../../../pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent";
import {
  ConflictCard,
  ConflictActions,
} from "../../../pages/Homepage/components/MiniTimeline/parts/ConflictPairParts";
import {
  EventTagSlot,
  EventDuration,
  ConflictPopover,
} from "../../../pages/Homepage/components/MiniTimeline/parts/PlanEventRowParts";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { AlertTriangle: Icon, RotateCw: Icon, Pencil: Icon };
});

vi.mock("../../../components/common/Badge/Badge", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/ConflictPairRow", () => ({
  ConflictPairRow: ({ row }) => <div>Conflict pair {row.id}</div>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/HourMarkRow", () => ({
  HourMarkRow: ({ row }) => <div>Hour mark {row.id}</div>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/NowRow", () => ({
  NowRow: ({ row }) => <div>Now row {row.id}</div>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/PlanEventRow", () => ({
  PlanEventRow: ({ row }) => <div>Plan event {row.id}</div>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/PlanFreeRow", () => ({
  PlanFreeRow: ({ row }) => <div>Plan free {row.id}</div>,
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline/TinyGapRow", () => ({
  TinyGapRow: ({ row }) => <div>Tiny gap {row.id}</div>,
}));

describe("MiniTimeline helpers and parts", () => {
  const styles = {
    planTimelineNowStrip: "strip",
    planTimelineNowStripDot: "dot",
    planTimelineNowStripLabel: "label",
    planTimelineNowStripTask: "task",
    planTimelineNowStripTimer: "timer",
    planTimelineRow: "row",
    planTimelineGutter: "gutter",
    planTimelineTime: "time",
    planTimelineSpineCell: "spine",
    planTimelineGapSkipBtn: "skip",
    planTimelineGapStartBtnSm: "start",
    planTimelineGapTransit: "transit",
    planTimelineGapTransitIcon: "icon",
    planTimelineGapTransitBody: "body",
    planTimelineGapTransitLabel: "label",
    planTimelineGapTransitMeta: "meta",
    planTimelineGapShortTaskRow: "short-row",
    planTimelineGapTaskTitle: "task-title",
    planTimelineGapTaskMeta: "task-meta",
    planTimelineGapTransitPartial: "partial",
    planTimelineGapTransitPartialTop: "partial-top",
    planTimelineGapTransitPartialFree: "partial-free",
    planTimelineGapShortWindow: "short-window",
    planTimelineGapShortWindowNoActions: "short-window-no-actions",
    planTimelineGapMain: "gap-main",
    planTimelineGapLeadDot: "lead",
    planTimelineGapShortDur: "dur",
    planTimelineGapFreeWord: "free-word",
    planTimelineGapSeparator: "sep",
    planTimelineGapNoTasks: "no-tasks",
    planTimelineGapRail: "rail",
    planTimelineGapActions: "actions",
    planTimelineGapSuggestionText: "suggestion",
    planTimelineGapShortWindowFeatured: "featured",
    planTimelineGapShortWindowBest: "best",
    planTimelineConflictPairCard: "card",
    planTimelineConflictPairCardAccent: "accent",
    planTimelineConflictPairCardTime: "time",
    planTimelineConflictPairCardTitleRow: "title-row",
    planTimelineConflictPairCardTitle: "title",
    planTimelineConflictSleepBadge: "sleep",
    planTimelineConflictCardMoveBtn: "move-btn",
    planTimelineConflictPairActions: "actions-wrap",
    planTimelineConflictPairIcon: "icon",
    planTimelineConflictPairLabelText: "label-text",
    planTimelineConflictPillGroup: "pill-group",
    planTimelineConflictAutoBtn: "auto-btn",
    planTimelineConflictItemBtn: "item-btn",
    planTimelineConflictItemText: "item-text",
    planTimelineCardTagsSlot: "tag-slot",
    planTimelineTimeConflictBadge: "conflict-badge",
    planTimelineRescheduleBtn: "resched",
    planTimelineModulePillLink: "module-link",
    planTimelineModulePill: "module-pill",
    planTimelineCardDurationPill: "duration-pill",
    planTimelineConflictPopover: "popover",
    planTimelineConflictPopoverTitle: "popover-title",
    planTimelineConflictPopoverBtn: "popover-btn",
  };

  it("covers mini timeline helper utilities", () => {
    expect(getEventAccentColor("Lecture: Math", "")).toBeTruthy();
    expect(getEventAccentColor("Gym session", "")).toBeTruthy();
    expect(getEventAccentColor("Society meetup", "society")).toBeTruthy();
    expect(getEventAccentColor("Coffee with friends", "")).toBeTruthy();
    expect(getEventAccentColor("Essay draft", "study")).toBeTruthy();
    expect(getEventAccentColor("Tutor meeting", "")).toBeTruthy();
    expect(getEventAccentColor("Tesco run", "admin")).toBeTruthy();
    expect(getEventAccentColor("Plain event", "")).toBeTruthy();

    expect(buildDeadlineTask({ minutes: 50 }, { assessment_title: "Exam", start_due_date: "2026-03-30" })).toEqual({
      title: "Revision: Exam",
      estimated_blocks: 2,
      due_date: "2026-03-30",
      priority: "urgent",
    });
    expect(buildDeadlineTask({ minutes: 20 }, null)).toBeNull();
    expect(getConflictTimeLabel({ startMins: 30 })).toBeTruthy();
    expect(formatGapDuration(130)).toBe("2h 10m");
    expect(formatGapDuration(45)).toBe("45m");
    expect(getGapMinHeight(90, 30)).toBeGreaterThanOrEqual(56);
    expect(getTinyGapMinHeight(10)).toBeGreaterThanOrEqual(24);
    expect(getGapTimeLabel(60)).toBeTruthy();
    expect(getTinyGapTimeLabel(5)).toMatch(/^\d{2}:\d{2}$/);
    expect(getGapRecommendationTitle({ title: "Read chapter" })).toBe("Read chapter");
  });

  it("renders the now strip states and row layout pieces", () => {
    const { rerender, container } = render(
      <NowStrip hasTimerSession={true} timerMode="focus" timerTask="Essay" timeLeft={125} styles={styles} />
    );
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("02:05")).toBeInTheDocument();

    rerender(<NowStrip hasTimerSession={false} currentBlock={{ title: "📚 Lecture", end_time: "2026-03-24T14:00:00Z" }} styles={styles} />);
    expect(screen.getByText("Now")).toBeInTheDocument();
    expect(screen.getByText("Lecture")).toBeInTheDocument();

    rerender(<NowStrip hasTimerSession={false} currentBlock={null} styles={styles} />);
    expect(container.textContent).not.toContain("Focus");

    render(
      <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={40}>
        <TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="09:00" />
        <TimelineSpineCell styles={styles} />
      </TimelineRowLayout>
    );
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  it("covers free-row content branches", () => {
    const onSkipTask = vi.fn();
    const onStartTask = vi.fn();
    const candidateTask = { id: 1, title: "Essay", due_date: "2026-03-01", priority: "urgent", estimated_minutes: 25 };

    const { rerender } = render(
      <PlanFreeRowContent
        styles={styles}
        gapContext={{ type: "transit", prevCampus: "strand", nextCampus: "waterloo", transitMins: 15 }}
        durationLabel="45m"
        onSkipTask={onSkipTask}
        onStartTask={onStartTask}
      />
    );
    expect(screen.getByText(/45m gap/)).toBeInTheDocument();

    rerender(
      <PlanFreeRowContent
        styles={styles}
        gapContext={{ type: "transit-partial", prevCampus: "strand", nextCampus: "waterloo", transitMins: 10, freeAfterTransit: 30 }}
        durationLabel="40m"
        assignedTask={candidateTask}
        onSkipTask={onSkipTask}
        onStartTask={onStartTask}
      />
    );
    fireEvent.click(screen.getByLabelText("Skip Essay"));
    fireEvent.click(screen.getByLabelText("Start Essay"));
    expect(onSkipTask).toHaveBeenCalledWith(1);
    expect(onStartTask).toHaveBeenCalledWith(candidateTask);

    rerender(<PlanFreeRowContent styles={styles} gapContext={{ type: "personal" }} durationLabel="20m" />);
    expect(screen.getByText("Short breather")).toBeInTheDocument();

    rerender(<PlanFreeRowContent styles={styles} gapContext={{ type: "evening" }} durationLabel="20m" />);
    expect(screen.getByText("Reset")).toBeInTheDocument();

    rerender(
      <PlanFreeRowContent
        styles={styles}
        gapContext={{ type: "study" }}
        durationLabel="25m"
        candidateTask={candidateTask}
        isBestGap={true}
        onSkipTask={onSkipTask}
        onStartTask={onStartTask}
      />
    );
    expect(screen.getAllByText(/Essay/).length).toBeGreaterThan(0);
  });

  it("covers conflict and event-row parts plus the row renderer", () => {
    const onActivate = vi.fn();
    const onMoveTomorrow = vi.fn();
    const onAutoMove = vi.fn();
    const onEdit = vi.fn();
    const onToggleConflictPopover = vi.fn();

    render(
      <>
        <ConflictCard
          itemRow={{ item: { title: "📚 Lecture", start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T10:00:00Z" } }}
          styles={styles}
          accent="#f00"
          isSleepTime={true}
          onContextMenu={vi.fn()}
          onActivate={onActivate}
          onMoveTomorrow={onMoveTomorrow}
          canMoveTomorrow={true}
        />
        <ConflictActions
          styles={styles}
          items={[
            { id: 1, item: { title: "Task A" }, isReadOnly: false },
            { id: 2, item: { title: "Task B" }, isReadOnly: true },
          ]}
          freeRow={{ id: "free-1" }}
          movable={{ item: { title: "Task A" } }}
          onAutoMove={onAutoMove}
          onEdit={onEdit}
        />
        <EventTagSlot
          styles={styles}
          isOverlap={true}
          isReadOnly={false}
          rowId="row-1"
          moduleCode="CS101"
          matchTask={{ task_list: 2 }}
          taskLists={[{ id: 2, name: "Uni" }]}
          accentColor="#0f0"
          onToggleConflictPopover={onToggleConflictPopover}
        />
        <EventDuration styles={styles} durationMins={30} />
        <ConflictPopover
          styles={styles}
          nextFreeRow={null}
          onAutoReschedule={vi.fn()}
          onMoveTomorrow={onMoveTomorrow}
          onEdit={onEdit}
        />
      </>
    );

    fireEvent.click(screen.getByTitle('Move "Lecture" to tomorrow'));
    fireEvent.click(screen.getByText("Auto-arrange"));
    fireEvent.click(screen.getByText("Task A"));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule to next free window" }));
    fireEvent.click(screen.getAllByText(/Move to tomorrow/)[1]);
    fireEvent.click(screen.getByText(/Manually adjust/));
    expect(onActivate).not.toHaveBeenCalled(); // only move button clicked
    expect(onMoveTomorrow).toHaveBeenCalled();
    expect(onAutoMove).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
    expect(onToggleConflictPopover).toHaveBeenCalledWith("row-1");

    const { rerender } = render(
      <MiniTimelineRowRenderer row={{ id: "h1", type: "hourMark" }} rows={[]} props={{ styles }} />
    );
    expect(screen.getByText("Hour mark h1")).toBeInTheDocument();
    rerender(<MiniTimelineRowRenderer row={{ id: "g1", type: "tinyGap" }} rows={[]} props={{ styles }} />);
    expect(screen.getByText("Tiny gap g1")).toBeInTheDocument();
    rerender(<MiniTimelineRowRenderer row={{ id: "n1", type: "now" }} rows={[]} props={{ styles }} />);
    expect(screen.getByText("Now row n1")).toBeInTheDocument();
    rerender(<MiniTimelineRowRenderer row={{ id: "f1", type: "free" }} rows={[]} props={{ styles, gapDeadlineFallbacks: {}, onQuickStart: vi.fn(), selectedDate: "2026-03-24", slotPopoverRef: null, slotPopoverRowId: null, setSlotPopoverRowId: vi.fn(), bestFreeRowId: null, assignedGapTasks: { map: {}, nextMap: {} }, onSkipGapTask: vi.fn() }} />);
    expect(screen.getByText("Plan free f1")).toBeInTheDocument();
    rerender(<MiniTimelineRowRenderer row={{ id: "c1", type: "eventGroup" }} rows={[]} props={{ styles, onConflictAutoMove: vi.fn(), onPushTomorrow: vi.fn(), onCardClick: vi.fn(), onEventContextMenu: vi.fn(), onEdit: vi.fn(), getTag: vi.fn(), selectedDate: "2026-03-24", sleepWindow: null }} />);
    expect(screen.getByText("Conflict pair c1")).toBeInTheDocument();
    rerender(<MiniTimelineRowRenderer row={{ id: "e1", type: "event" }} rows={[]} props={{ styles, taskLists: [], conflictPopoverRowId: null, conflictPopoverRef: null, setConflictPopoverRowId: vi.fn(), onConflictAutoMove: vi.fn(), onPushTomorrow: vi.fn(), onEdit: vi.fn(), onCardClick: vi.fn(), onEventContextMenu: vi.fn(), getTag: vi.fn(), sleepWindow: null, selectedDate: "2026-03-24" }} />);
    expect(screen.getByText("Plan event e1")).toBeInTheDocument();
  });
});
