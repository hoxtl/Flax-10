import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EventTagSlot, EventDuration, ConflictPopover } from "@/pages/homepage/components/mini_timeline/parts/PlanEventRowParts";

vi.mock("lucide-react", () => ({
  AlertTriangle: () => <span>⚠</span>,
  Pencil: () => <span>Pencil</span>,
  RotateCw: () => <span>↻</span>,
}));
vi.mock("@/pages/homepage/utils/dateFormatUtils", () => ({ fmtDurationShort: (m) => `${m}m` }));
vi.mock("@/components/common/badge/Badge", () => ({
  default: ({ children }) => <span data-testid="badge">{children}</span>,
}));

const styles = {
  planTimelineCardTagsSlot: "tags", planTimelineTimeConflictBadge: "cb",
  planTimelineRescheduleBtn: "rbtn", planTimelineModulePill: "mp",
  planTimelineConflictPopover: "cp", planTimelineConflictPopoverTitle: "cpt",
  planTimelineConflictPopoverBtn: "cpb", planTimelineCardDurationPill: "dur",
};

describe("EventTagSlot", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders overlap conflict badge and fix button for non-readonly", () => {
    render(
      <MemoryRouter>
        <EventTagSlot styles={styles} isOverlap isReadOnly={false} rowId="r1" onToggleConflictPopover={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText("Conflict")).toBeTruthy();
    const fixBtn = screen.getByText("Fix it");
    expect(fixBtn).toBeTruthy();
    fireEvent.click(fixBtn);
  });

  it("hides Fix it button for readonly overlap", () => {
    render(
      <MemoryRouter>
        <EventTagSlot styles={styles} isOverlap isReadOnly rowId="r1" onToggleConflictPopover={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByText("Fix it")).toBeNull();
  });

  it("renders module pill without task_list", () => {
    render(
      <MemoryRouter>
        <EventTagSlot styles={styles} moduleCode="5CCS2OSC" accentColor="#f00" />
      </MemoryRouter>
    );
    expect(screen.getByText("5CCS2OSC")).toBeTruthy();
  });

  it("renders module pill link when task_list exists", () => {
    render(
      <MemoryRouter>
        <EventTagSlot styles={styles} moduleCode="6CCS1XYZ" matchTask={{ task_list: 4 }} accentColor="#0f0" />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: "6CCS1XYZ" });
    expect(link).toHaveAttribute("href", "/tasks?list=4&module=6CCS1XYZ");
    fireEvent.click(link);
  });

  it("renders list pill when matchTask has task_list but no moduleCode, handling missing taskLists array", () => {
    const taskLists = [{ id: 7, name: "CS Work" }];
    const { rerender } = render(
      <MemoryRouter>
        <EventTagSlot styles={styles} matchTask={{ task_list: 7 }} taskLists={taskLists} />
      </MemoryRouter>
    );
    const link = screen.getByText("CS Work");
    expect(link).toBeTruthy();
    fireEvent.click(link);
    rerender(
      <MemoryRouter>
        <EventTagSlot styles={styles} matchTask={{ task_list: 7 }} taskLists={null} />
      </MemoryRouter>
    );
    expect(screen.getByText("List")).toBeTruthy();
  });
});

describe("EventDuration", () => {
  it("renders null when durationMins <= 0", () => {
    const { container } = render(<EventDuration styles={styles} durationMins={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders duration pill for positive duration", () => {
    render(<EventDuration styles={styles} durationMins={60} />);
    expect(screen.getByText("60m")).toBeTruthy();
  });
});

describe("ConflictPopover", () => {
  it("shows auto-move when nextFreeRow available", () => {
    render(<ConflictPopover styles={styles} nextFreeRow={{ id: "gap" }} onAutoReschedule={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("Auto-move to next gap")).toBeTruthy();
    expect(screen.queryByText("→ Move to tomorrow")).toBeNull();
  });

  it("shows move to tomorrow when no nextFreeRow", () => {
    const onMoveTomorrow = vi.fn();
    render(<ConflictPopover styles={styles} nextFreeRow={null} onMoveTomorrow={onMoveTomorrow} onEdit={vi.fn()} />);
    expect(screen.getByText("No free window")).toBeTruthy();
    fireEvent.click(screen.getByText("→ Move to tomorrow"));
    expect(onMoveTomorrow).toHaveBeenCalled();
  });
});
