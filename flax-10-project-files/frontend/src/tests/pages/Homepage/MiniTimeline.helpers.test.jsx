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
import { TimelineRowLayout, TimelineGutter, TimelineSpineCell } from "../../../pages/Homepage/components/MiniTimeline/parts/TimelineRowLayout";
import { PlanFreeRowContent } from "../../../pages/Homepage/components/MiniTimeline/parts/PlanFreeRowContent";
import { ConflictCard, ConflictActions } from "../../../pages/Homepage/components/MiniTimeline/parts/ConflictPairParts";
import { EventTagSlot, EventDuration, ConflictPopover } from "../../../pages/Homepage/components/MiniTimeline/parts/PlanEventRowParts";

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
const styles = new Proxy({}, { get: (_, key) => key });

const defaultFreeRow = {
  styles,
  gapContext: { type: "study" },
  durationLabel: "30m",
  assignedTask: null,
  candidateTask: null,
  isBestGap: false,
  onSkipTask: vi.fn(),
  onStartTask: vi.fn(),
};

function renderFreeRow(overrides = {}) {
  return render(<PlanFreeRowContent {...defaultFreeRow} {...overrides} />);
}

function renderConflictCard(overrides = {}) {
  return render(
    <ConflictCard
      itemRow={{ item: { title: "📚 Lecture", start_time: "2026-03-24T09:00", end_time: "2026-03-24T10:00" } }}
      styles={styles}
      accent="#f00"
      isSleepTime
      onContextMenu={vi.fn()}
      onActivate={vi.fn()}
      onMoveTomorrow={vi.fn()}
      canMoveTomorrow
      {...overrides}
    />,
  );
}

function renderConflictActions(overrides = {}) {
  const items = [
    { id: 1, item: { title: "Task A" }, isReadOnly: false },
    { id: 2, item: { title: "Task B" }, isReadOnly: true },
  ];
  return render(
    <ConflictActions
      styles={styles}
      items={items}
      freeRow={{ id: "free-1" }}
      movable={items[0]}
      onAutoMove={vi.fn()}
      onEdit={vi.fn()}
      {...overrides}
    />,
  );
}

function renderConflictPopover(overrides = {}) {
  return render(
    <ConflictPopover
      styles={styles}
      nextFreeRow={{ id: "gap-1" }}
      onAutoReschedule={vi.fn()}
      onMoveTomorrow={vi.fn()}
      onEdit={vi.fn()}
      {...overrides}
    />,
  );
}

function renderTagSlot(overrides = {}) {
  return render(
    <EventTagSlot
      styles={styles}
      isOverlap
      isReadOnly={false}
      rowId="row-1"
      moduleCode="CS101"
      matchTask={{ task_list: 2 }}
      taskLists={[{ id: 2, name: "Uni" }]}
      accentColor="#0f0"
      onToggleConflictPopover={vi.fn()}
      {...overrides}
    />,
  );
}

function renderTimelineRow(row, extraProps = {}) {
  return render(<MiniTimelineRowRenderer row={row} rows={[]} props={{ styles, ...extraProps }} />);
}

function rerenderTimelineRow(view, row, extraProps = {}) {
  return view.rerender(<MiniTimelineRowRenderer row={row} rows={[]} props={{ styles, ...extraProps }} />);
}

const buildRow = (id, type) => ({ id, type });

const buildFreeRowProps = () => ({
  gapDeadlineFallbacks: {},
  onQuickStart: vi.fn(),
  selectedDate: "2026-03-24",
  slotPopoverRef: null,
  slotPopoverRowId: null,
  setSlotPopoverRowId: vi.fn(),
  bestFreeRowId: null,
  assignedGapTasks: { map: {}, nextMap: {} },
  onSkipGapTask: vi.fn(),
});

const buildConflictRowProps = () => ({
  onConflictAutoMove: vi.fn(),
  onPushTomorrow: vi.fn(),
  onCardClick: vi.fn(),
  onEventContextMenu: vi.fn(),
  onEdit: vi.fn(),
  getTag: vi.fn(),
  selectedDate: "2026-03-24",
  sleepWindow: null,
});

const buildEventRowProps = () => ({
  taskLists: [],
  conflictPopoverRowId: null,
  conflictPopoverRef: null,
  setConflictPopoverRowId: vi.fn(),
  onConflictAutoMove: vi.fn(),
  onPushTomorrow: vi.fn(),
  onEdit: vi.fn(),
  onCardClick: vi.fn(),
  onEventContextMenu: vi.fn(),
  getTag: vi.fn(),
  sleepWindow: null,
  selectedDate: "2026-03-24",
});

describe("MiniTimeline helpers and parts", () => {
  describe("helper utilities", () => {
    it("derives accent colors across categories", () => {
      [
        "Lecture: Math",
        "Gym session",
        "Society meetup",
        "Coffee with friends",
        "Essay draft",
        "Tutor meeting",
        "Tesco run",
        "Plain event",
      ].forEach((title) => expect(getEventAccentColor(title, "")).toBeTruthy());
    });

    it("builds deadline tasks or returns null when metadata is missing", () => {
      expect(
        buildDeadlineTask({ minutes: 50 }, { assessment_title: "Exam", start_due_date: "2026-03-30" }),
      ).toEqual({ title: "Revision: Exam", estimated_blocks: 2, due_date: "2026-03-30", priority: "urgent" });
      expect(buildDeadlineTask({ minutes: 20 }, null)).toBeNull();
    });

    it("formats gap durations, heights, and labels", () => {
      expect(formatGapDuration(130)).toBe("2h 10m");
      expect(formatGapDuration(45)).toBe("45m");
      expect(getGapMinHeight(90, 30)).toBeGreaterThanOrEqual(56);
      expect(getTinyGapMinHeight(10)).toBeGreaterThanOrEqual(24);
      expect(getGapTimeLabel(60)).toBeTruthy();
      expect(getTinyGapTimeLabel(5)).toMatch(/^\d{2}:\d{2}$/);
      expect(getGapRecommendationTitle({ title: "Read chapter" })).toBe("Read chapter");
      expect(getConflictTimeLabel({ startMins: 30 })).toBeTruthy();
    });
  });

  describe("Now strip and layout", () => {
    it("shows timer session details when focus mode is active", () => {
      render(<NowStrip hasTimerSession timerMode="focus" timerTask="Essay" timeLeft={125} styles={styles} />);
      expect(screen.getByText("Focus")).toBeInTheDocument();
      expect(screen.getByText("02:05")).toBeInTheDocument();
    });

    it("falls back to current block info when no timer session exists", () => {
      const { rerender } = render(<NowStrip hasTimerSession={false} currentBlock={null} styles={styles} />);
      rerender(<NowStrip hasTimerSession={false} currentBlock={{ title: "📚 Lecture" }} styles={styles} />);
      expect(screen.getByText("Now")).toBeInTheDocument();
      expect(screen.getByText("Lecture")).toBeInTheDocument();
    });

    it("renders gutter and spine cells within the row layout", () => {
      render(
        <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={40}>
          <TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="09:00" />
          <TimelineSpineCell styles={styles} />
        </TimelineRowLayout>,
      );
      expect(screen.getByText("09:00")).toBeInTheDocument();
    });
  });

  describe("PlanFreeRowContent", () => {
    it("describes transit gaps with travel meta", () => {
      renderFreeRow({ gapContext: { type: "transit", prevCampus: "strand", nextCampus: "waterloo", transitMins: 15 } });
      expect(screen.getByText(/15m travel/i)).toBeInTheDocument();
    });

    it("allows skipping or starting assigned tasks in partial transit gaps", () => {
      const onSkipTask = vi.fn();
      const onStartTask = vi.fn();
      renderFreeRow({
        gapContext: { type: "transit-partial", prevCampus: "strand", nextCampus: "waterloo", transitMins: 10, freeAfterTransit: 30 },
        durationLabel: "40m",
        assignedTask: { id: 1, title: "Essay", estimated_minutes: 25 },
        onSkipTask,
        onStartTask,
      });
      fireEvent.click(screen.getByLabelText("Skip Essay"));
      fireEvent.click(screen.getByLabelText("Start Essay"));
      expect(onSkipTask).toHaveBeenCalledWith(1);
      expect(onStartTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Essay" }));
    });

    it("shows evening and personal copy variants", () => {
      const { rerender } = renderFreeRow({ gapContext: { type: "evening" }, durationLabel: "20m" });
      expect(screen.getByText("Reset")).toBeInTheDocument();
      rerender(<PlanFreeRowContent {...defaultFreeRow} gapContext={{ type: "personal" }} durationLabel="15m" />);
      expect(screen.getByText("Short breather")).toBeInTheDocument();
    });

    it("highlights best-gap candidate tasks", () => {
      renderFreeRow({
        candidateTask: { title: "Late essay", due_date: "2000-01-01T00:00:00Z", estimated_minutes: 25 },
        isBestGap: true,
        durationLabel: "25m",
      });
      expect(screen.getByText(/Late essay/)).toHaveAttribute("title", "❗ Late essay");
    });
  });

  describe("conflict and tag parts", () => {
    it("triggers move-tomorrow handler from the conflict card", () => {
      const onMoveTomorrow = vi.fn();
      renderConflictCard({ onMoveTomorrow });
      fireEvent.click(screen.getByText("→ Move to tomorrow"));
      expect(onMoveTomorrow).toHaveBeenCalled();
    });

    it("summarizes overlap counts and allows editing movable items", () => {
      const onEdit = vi.fn();
      renderConflictActions({ onEdit });
      expect(screen.getByText("2 events overlap")).toBeInTheDocument();
      fireEvent.click(screen.getByTitle("Edit Task A"));
      expect(onEdit).toHaveBeenCalled();
    });

    it("disables auto move when no next free row exists", () => {
      renderConflictPopover({ nextFreeRow: null });
      expect(screen.getByRole("button", { name: /No free window/i })).toBeDisabled();
    });

    it("enables auto move and manual adjust actions when a free row exists", () => {
      const onAutoReschedule = vi.fn();
      const onEdit = vi.fn();
      renderConflictPopover({ onAutoReschedule, onEdit });
      fireEvent.click(screen.getByText("Auto-move to next gap"));
      fireEvent.click(screen.getByText("Manually adjust"));
      expect(onAutoReschedule).toHaveBeenCalled();
      expect(onEdit).toHaveBeenCalled();
    });

    it("links task lists within the event tag slot", () => {
      const onToggle = vi.fn();
      renderTagSlot({ moduleCode: "", onToggleConflictPopover: onToggle });
      fireEvent.click(screen.getByRole("button", { name: /Reschedule/ }));
      expect(onToggle).toHaveBeenCalledWith("row-1");
      expect(screen.getByText("Uni").closest("a")).toHaveAttribute("href", "/tasks?list=2");
    });

    it("hides duration text when minutes are zero", () => {
      const { rerender, container } = render(<EventDuration styles={styles} durationMins={0} />);
      expect(container.firstChild).toBeNull();
      rerender(<EventDuration styles={styles} durationMins={30} />);
      expect(screen.getByText("30m")).toBeInTheDocument();
    });
  });

  describe("MiniTimelineRowRenderer", () => {
    it("renders non-interactive rows like hour marks and tiny gaps", () => {
      const view = renderTimelineRow(buildRow("h1", "hourMark"));
      expect(screen.getByText("Hour mark h1")).toBeInTheDocument();
      rerenderTimelineRow(view, buildRow("g1", "tinyGap"));
      expect(screen.getByText("Tiny gap g1")).toBeInTheDocument();
    });

    it("renders now rows with the provided props", () => {
      renderTimelineRow(buildRow("n1", "now"));
      expect(screen.getByText("Now row n1")).toBeInTheDocument();
    });

    it("renders free rows with full gap props", () => {
      renderTimelineRow(buildRow("f1", "free"), buildFreeRowProps());
      expect(screen.getByText("Plan free f1")).toBeInTheDocument();
    });

    it("renders conflict pair rows", () => {
      renderTimelineRow(buildRow("c1", "eventGroup"), buildConflictRowProps());
      expect(screen.getByText("Conflict pair c1")).toBeInTheDocument();
    });

    it("renders plan event rows with popover props", () => {
      renderTimelineRow(buildRow("e1", "event"), buildEventRowProps());
      expect(screen.getByText("Plan event e1")).toBeInTheDocument();
    });
  });
});
