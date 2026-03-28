/*
 * Tests for mini timeline part components: EventTagSlot, EventDuration,
 * ListPill, ModulePill, ConflictPopover, ConflictActions, and ConflictCard.
 */

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

const doesEventOverlapSleepWindow = vi.fn(() => false);

vi.mock("../../../../components/settings/hooks/useSleepWarning", () => ({
  doesEventOverlapSleepWindow: (...args) => doesEventOverlapSleepWindow(...args),
}));

import {
  ConflictPopover,
  EventDuration,
  EventTagSlot,
  ListPill,
  ModulePill,
} from "../../../../pages/homepage/components/mini_timeline/parts/PlanEventRowParts";
import { ConflictActions, ConflictCard } from "../../../../pages/homepage/components/mini_timeline/parts/ConflictPairParts";

const styles = new Proxy({}, { get: (_, key) => key });

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

  it("falls back to the generic list label when task list metadata is missing", () => {
    renderTagSlot({ rowId: "row-3", moduleCode: "", matchTask: { task_list: 99 }, taskLists: [], isOverlap: false });
    expect(screen.getByText("List").closest("a")).toHaveAttribute("href", "/tasks?list=99");
  });

  it("links module pills through the related task list", () => {
    renderTagSlot({ rowId: "row-4", moduleCode: "CS102", matchTask: { task_list: 8 }, taskLists: [], isOverlap: false });
    expect(screen.getByText("CS102").closest("a")).toHaveAttribute("href", "/tasks?list=8&module=CS102");
  });

  it("renders ListPill and ModulePill directly for uncovered helper branches", () => {
    const { rerender } = render(<ListPill taskListId={42} />);
    expect(document.querySelector('a[href="/tasks?list=42"]')).toBeTruthy();
    rerender(<ModulePill styles={styles} moduleCode="CS103" matchTask={{ task_list: 11 }} accentColor="#4477aa" />);
    expect(screen.getByText("CS103").closest("a")).toHaveAttribute("href", "/tasks?list=11&module=CS103");
  });

  it("links module pills through the related task list and stops parent clicks", () => {
    const outerClick = vi.fn();
    render(
      <div onClick={outerClick}>
        <EventTagSlot styles={styles} isOverlap={false} isReadOnly={false} rowId="row-3" moduleCode="CS101"
          matchTask={{ task_list: 7 }} taskLists={[]} accentColor="#0099ff" onToggleConflictPopover={vi.fn()} />
      </div>,
    );
    const link = screen.getByText("CS101").closest("a");
    fireEvent.click(link);
    expect(link).toHaveAttribute("href", "/tasks?list=7&module=CS101");
    expect(outerClick).not.toHaveBeenCalled();
  });

  it("falls back to the generic list label without bubbling when task list metadata is absent", () => {
    const outerClick = vi.fn();
    render(
      <div onClick={outerClick}>
        <EventTagSlot styles={styles} isOverlap={false} isReadOnly={false} rowId="row-4" moduleCode=""
          matchTask={{ task_list: 99 }} taskLists={undefined} accentColor="#00aa00" onToggleConflictPopover={vi.fn()} />
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

  it("summarises overlap count and allows editing movable items", () => {
    const onEdit = vi.fn();
    renderConflictActions({ onEdit });
    expect(screen.getByText("2 events overlap")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Edit Lecture"));
    expect(onEdit).toHaveBeenCalledWith(conflictActionItems[0].item, "x");
  });

  it("shows the auto-arrange title when a free row exists and skips missing onEdit", () => {
    renderConflictActions({
      freeRow: { id: "gap-1" },
      movable: { item: { title: "Movable lecture" } },
      onEdit: undefined,
    });
    expect(screen.getByRole("button", { name: "Auto-arrange" })).toHaveAttribute("title", 'Move "Movable lecture" to next free window');
    fireEvent.click(screen.getByTitle("Edit Lecture"));
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

  it("renders empty times and hides move-tomorrow controls when unavailable", () => {
    renderConflictCard({
      itemRow: { item: { title: "🔥 Clash", start_time: "", end_time: "" } },
      isSleepTime: false,
      canMoveTomorrow: false,
    });
    expect(screen.queryByLabelText("Scheduled during sleep hours")).toBeNull();
    expect(screen.queryByText("→ Move to tomorrow")).toBeNull();
  });

  it("falls back cleanly when conflict times are missing", () => {
    renderConflictCard({ itemRow: { item: { title: "🔥 Clash" } }, isSleepTime: false, canMoveTomorrow: false });
    const card = screen.getByText("Clash").closest('[role="button"]');
    fireEvent.keyDown(card, { key: "Escape" });
    expect(card).toHaveTextContent("Clash");
  });

  it("does not repeat the time range when start and end times match", () => {
    renderConflictCard({
      itemRow: { item: { title: "🔥 Standup", start_time: "2024-03-08T10:00:00", end_time: "2024-03-08T10:00:00" } },
      isSleepTime: false,
    });
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.queryByText("10:00–10:00")).toBeNull();
  });
});
