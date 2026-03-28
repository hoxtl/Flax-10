import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, onClick }) => <a href={to} onClick={onClick}>{children}</a>,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  RotateCw: () => <svg data-testid="rotate-icon" />,
}));

vi.mock("../../../../pages/homepage/utils/dateFormatUtils", () => ({
  fmtDurationShort: (value) => `${value}m`,
  formatTime: (value) => (value ? value.slice(11, 16) : ""),
}));

vi.mock("../../../../pages/homepage/utils/eventUtils", () => ({
  stripEmojiFromTitle: (title) => String(title || "").replace("🔥 ", ""),
}));

const styles = new Proxy({}, { get: (_, key) => key });

import {
  ConflictPopover,
  EventDuration,
  EventTagSlot,
} from "../../../../pages/homepage/components/mini_timeline/parts/PlanEventRowParts";
import { ConflictActions, ConflictCard } from "../../../../pages/homepage/components/mini_timeline/parts/ConflictPairParts";
import { PlanFreeRowContent } from "../../../../pages/homepage/components/mini_timeline/parts/PlanFreeRowContent";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "../../../../pages/homepage/components/mini_timeline/parts/TimelineRowLayout";

const conflictActionItems = [
  { id: "a", item: { title: "🔥 Lecture", tag: "x" }, isReadOnly: false },
  { id: "b", item: { title: "Read only", tag: null }, isReadOnly: true },
];

function renderTagSlot(overrides = {}) {
  const props = {
    styles,
    isOverlap: true,
    isReadOnly: false,
    rowId: "row-1",
    moduleCode: "",
    matchTask: { task_list: 2 },
    taskLists: [{ id: 2, name: "Urgent" }],
    accentColor: "#00aa00",
    onToggleConflictPopover: vi.fn(),
    ...overrides,
  };
  return render(<EventTagSlot {...props} />);
}

function renderConflictPopover(overrides = {}) {
  const props = {
    styles,
    nextFreeRow: { id: "gap" },
    onAutoReschedule: vi.fn(),
    onMoveTomorrow: vi.fn(),
    onEdit: vi.fn(),
    ...overrides,
  };
  return render(<ConflictPopover {...props} />);
}

function renderConflictActions(overrides = {}) {
  const props = {
    styles,
    items: conflictActionItems,
    freeRow: null,
    movable: conflictActionItems[0],
    onAutoMove: vi.fn(),
    onEdit: vi.fn(),
    ...overrides,
  };
  return render(<ConflictActions {...props} />);
}

function renderConflictCard(overrides = {}) {
  const props = {
    itemRow: {
      item: {
        title: "🔥 Clash",
        start_time: "2024-03-08T10:00:00",
        end_time: "2024-03-08T11:30:00",
      },
    },
    styles,
    accent: "#ff0000",
    isSleepTime: true,
    onContextMenu: vi.fn(),
    onActivate: vi.fn(),
    onMoveTomorrow: vi.fn(),
    canMoveTomorrow: true,
    ...overrides,
  };
  return render(<ConflictCard {...props} />);
}

function renderFreeRow(overrides = {}, outerClick = vi.fn()) {
  const props = {
    styles,
    gapContext: { type: "study" },
    durationLabel: "45m",
    assignedTask: null,
    candidateTask: null,
    isBestGap: false,
    onSkipTask: vi.fn(),
    onStartTask: vi.fn(),
    ...overrides,
  };
  const result = render(
    <div onClick={outerClick}>
      <PlanFreeRowContent {...props} />
    </div>,
  );
  return { ...result, outerClick };
}

describe("mini timeline parts extras", () => {
  describe("tag slot and duration helpers", () => {
    it("links matching task list and toggles overlap controls", () => {
      const onToggleConflictPopover = vi.fn();
      renderTagSlot({ onToggleConflictPopover });
      fireEvent.click(screen.getByRole("button", { name: /Reschedule/ }));
      expect(onToggleConflictPopover).toHaveBeenCalledWith("row-1");
      expect(screen.getByText("Urgent").closest("a")).toHaveAttribute("href", "/tasks?list=2");
    });

    it("shows module code when readonly without matching list", () => {
      renderTagSlot({ rowId: "row-2", moduleCode: "CS101", isReadOnly: true, matchTask: null, taskLists: [] });
      expect(screen.queryByRole("button", { name: /Reschedule/ })).toBeNull();
      expect(screen.getByText("CS101")).toBeInTheDocument();
    });

    it("links module pills through the related task list and stops parent clicks", () => {
      const outerClick = vi.fn();
      render(
        <div onClick={outerClick}>
          <EventTagSlot
            styles={styles}
            isOverlap={false}
            isReadOnly={false}
            rowId="row-3"
            moduleCode="CS101"
            matchTask={{ task_list: 7 }}
            taskLists={[]}
            accentColor="#0099ff"
            onToggleConflictPopover={vi.fn()}
          />
        </div>,
      );

      const link = screen.getByText("CS101").closest("a");
      fireEvent.click(link);

      expect(link).toHaveAttribute("href", "/tasks?list=7&module=CS101");
      expect(outerClick).not.toHaveBeenCalled();
    });

    it("falls back to the generic list label when task list metadata is missing", () => {
      const outerClick = vi.fn();
      render(
        <div onClick={outerClick}>
          <EventTagSlot
            styles={styles}
            isOverlap={false}
            isReadOnly={false}
            rowId="row-4"
            moduleCode=""
            matchTask={{ task_list: 99 }}
            taskLists={undefined}
            accentColor="#00aa00"
            onToggleConflictPopover={vi.fn()}
          />
        </div>,
      );

      const link = screen.getByText("List").closest("a");
      fireEvent.click(link);

      expect(link).toHaveAttribute("href", "/tasks?list=99");
      expect(outerClick).not.toHaveBeenCalled();
    });

    it("renders duration text only when minutes are positive", () => {
      const { container, rerender } = render(<EventDuration styles={styles} durationMins={0} />);
      expect(container.firstChild).toBeNull();
      rerender(<EventDuration styles={styles} durationMins={45} />);
      expect(screen.getByText("45m")).toBeInTheDocument();
    });
  });

  describe("conflict popover and actions", () => {
    it("disables next gap button when no free row is available", () => {
      const onMoveTomorrow = vi.fn();
      renderConflictPopover({ nextFreeRow: null, onMoveTomorrow });
      expect(screen.getByRole("button", { name: /No free window/i })).toBeDisabled();
      fireEvent.click(screen.getByText("→ Move to tomorrow"));
      expect(onMoveTomorrow).toHaveBeenCalled();
    });

    it("fires auto-move and edit handlers when a gap exists", () => {
      const onAutoReschedule = vi.fn();
      const onEdit = vi.fn();
      renderConflictPopover({ onAutoReschedule, onEdit });
      fireEvent.click(screen.getByText("Auto-move to next gap"));
      fireEvent.click(screen.getByText("Manually adjust"));
      expect(onAutoReschedule).toHaveBeenCalled();
      expect(onEdit).toHaveBeenCalled();
    });

    it("summarizes overlap count and allows editing movable items", () => {
      const onEdit = vi.fn();
      renderConflictActions({ onEdit });
      expect(screen.getByText("2 events overlap")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "No free window" })).toBeDisabled();
      fireEvent.click(screen.getByTitle("Edit Lecture"));
      expect(onEdit).toHaveBeenCalledWith(conflictActionItems[0].item, "x");
    });
  });

  describe("conflict cards", () => {
    it("handles context menu, activation, move-tomorrow, and time formatting", () => {
      const onContextMenu = vi.fn();
      const onActivate = vi.fn();
      const onMoveTomorrow = vi.fn();
      renderConflictCard({ onContextMenu, onActivate, onMoveTomorrow });
      const card = screen.getByText("Clash").closest('[role="button"]');
      fireEvent.contextMenu(card);
      fireEvent.click(card);
      fireEvent.keyDown(card, { key: "Enter" });
      fireEvent.keyDown(card, { key: " " });
      fireEvent.click(screen.getByText("→ Move to tomorrow"));
      expect(onContextMenu).toHaveBeenCalled();
      expect(onActivate).toHaveBeenCalledTimes(3);
      expect(onMoveTomorrow).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("Scheduled during sleep hours")).toBeInTheDocument();
      expect(screen.getByText("10:00–11:30")).toBeInTheDocument();
    });

    it("falls back cleanly when conflict times are missing", () => {
      renderConflictCard({
        itemRow: { item: { title: "🔥 Clash" } },
        isSleepTime: false,
        canMoveTomorrow: false,
      });

      const card = screen.getByText("Clash").closest('[role="button"]');
      fireEvent.keyDown(card, { key: "Escape" });

      expect(card).toHaveTextContent("Clash");
      expect(screen.queryByLabelText("Scheduled during sleep hours")).toBeNull();
      expect(screen.queryByText("→ Move to tomorrow")).toBeNull();
    });

    it("does not repeat the time range when start and end times match", () => {
      renderConflictCard({
        itemRow: {
          item: {
            title: "🔥 Standup",
            start_time: "2024-03-08T10:00:00",
            end_time: "2024-03-08T10:00:00",
          },
        },
        isSleepTime: false,
      });

      expect(screen.getByText("10:00")).toBeInTheDocument();
      expect(screen.queryByText("10:00–10:00")).toBeNull();
    });
  });

  describe("PlanFreeRowContent variants", () => {
    it("renders short breather copy for study gaps", () => {
      renderFreeRow();
      expect(screen.getByText("Short breather")).toBeInTheDocument();
    });

    it("skips or starts urgent tasks in partial transit gaps", () => {
      const onSkipTask = vi.fn();
      const onStartTask = vi.fn();
      renderFreeRow(
        {
          gapContext: { type: "transit-partial", prevCampus: "unknown", nextCampus: "other", transitMins: 15, freeAfterTransit: 20 },
          durationLabel: "20m",
          assignedTask: { id: 9, title: "Urgent task", priority: "urgent", estimated_minutes: 25 },
          onSkipTask,
          onStartTask,
        },
      );
      fireEvent.click(screen.getByLabelText("Skip Urgent task"));
      fireEvent.click(screen.getByLabelText("Start Urgent task"));
      expect(onSkipTask).toHaveBeenCalledWith(9);
      expect(onStartTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Urgent task" }));
      expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();
      expect(screen.getByText(/20m free after/i)).toBeInTheDocument();
    });

    it("hides start actions when no free time remains after transit", () => {
      renderFreeRow({ gapContext: { type: "transit-partial", prevCampus: "strand", nextCampus: "guys", transitMins: 10, freeAfterTransit: 0 }, durationLabel: "10m" });
      expect(screen.queryByRole("button", { name: /Start /i })).toBeNull();
      expect(screen.getByText(/0m free after/i)).toBeInTheDocument();
    });

    it("propagates outer clicks for transit campus cards", () => {
      const outerClick = vi.fn();
      renderFreeRow({ gapContext: { type: "transit", prevCampus: "strand", nextCampus: "waterloo", transitMins: 12 }, durationLabel: "30m" }, outerClick);
      fireEvent.click(screen.getByText(/strand/i).closest("div"));
      expect(outerClick).toHaveBeenCalled();
      expect(screen.getByText(/12m travel · 30m gap/i)).toBeInTheDocument();
    });

    it("falls back to generic campus copy when campuses are unknown", () => {
      renderFreeRow({ gapContext: { type: "transit", prevCampus: "unknown", nextCampus: "mystery", transitMins: 8 }, durationLabel: "18m" });
      expect(screen.getByText(/campus → next campus/i)).toBeInTheDocument();
      expect(screen.getByText(/8m travel · 18m gap/i)).toBeInTheDocument();
    });

    it("renders evening and personal copy variants", () => {
      const { rerender } = renderFreeRow({ gapContext: { type: "evening" }, durationLabel: "60m" });
      expect(screen.getByText("Reset")).toBeInTheDocument();
      rerender(
        <div>
          <PlanFreeRowContent
            styles={styles}
            gapContext={{ type: "personal" }}
            durationLabel="15m"
            assignedTask={null}
            candidateTask={null}
            isBestGap={false}
            onSkipTask={vi.fn()}
            onStartTask={vi.fn()}
          />
        </div>,
      );
      expect(screen.getByText("Short breather")).toBeInTheDocument();
    });

    it("highlights best gap candidate tasks with warning title", () => {
      renderFreeRow({
        gapContext: { type: "study" },
        durationLabel: "35m",
        candidateTask: { title: "Late essay", due_date: "2000-01-01T00:00:00Z", estimated_minutes: 35 },
        isBestGap: true,
      });
      expect(screen.getByText(/Late essay/)).toHaveAttribute("title", "❗ Late essay");
      expect(screen.getByText("(25m)")).toBeInTheDocument();
      expect(screen.queryByLabelText("Skip Late essay")).toBeNull();
    });

    it("allows skipping low-priority candidate tasks", () => {
      const onSkipTask = vi.fn();
      renderFreeRow({
        durationLabel: "22m",
        candidateTask: { id: 17, title: "Reading", priority: "low", estimated_minutes: 20 },
        onSkipTask,
      });
      fireEvent.click(screen.getByLabelText("Skip Reading"));
      expect(onSkipTask).toHaveBeenCalledWith(17);
      expect(screen.getByText("Reading")).toHaveAttribute("title", "Reading");
    });

    it("shows default short breather copy when no candidate task exists", () => {
      renderFreeRow({ durationLabel: "12m" });
      expect(screen.getByText("12m")).toBeInTheDocument();
      expect(screen.getByText("Short breather")).toHaveAttribute("title", "Short breather");
    });
  });

  describe("timeline row layout helpers", () => {
    it("applies spacing, min height, and custom classes", () => {
      const { container } = render(
        <TimelineRowLayout row={{ spacingBeforePx: 12 }} styles={styles} minHeight={44} rowClassName="extra-row">
          <span>child</span>
        </TimelineRowLayout>,
      );
      const row = container.firstChild;
      expect(row).toHaveStyle({ marginTop: "12px", minHeight: "44px" });
      expect(row.className).toContain("extra-row");
    });

    it("toggles time labels and renders the spine cell", () => {
      const { container, rerender } = render(<TimelineGutter row={{ hideTimeLabel: true }} styles={styles} timeLabel="10:00" />);
      expect(container.querySelector(`.${styles.planTimelineTime}`)).toBeNull();
      rerender(<TimelineGutter row={{ hideTimeLabel: false }} styles={styles} timeLabel="10:00" />);
      expect(screen.getByText("10:00")).toBeInTheDocument();
      rerender(<TimelineSpineCell styles={styles} />);
      expect(container.querySelector(`.${styles.planTimelineSpineCell}`)).toBeTruthy();
    });
  });
});
