import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, onClick }) => <a href={to} onClick={onClick}>{children}</a>,
}));

vi.mock("../../../../components/common/badge/Badge", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../../../../pages/homepage/components/mini_timeline/PlanFreeRow", () => ({
  PlanFreeRow: ({ row, deadlineSuggestions, assignedTask, nextAssignedTask, isBestGap, onSkipTask }) => (
    <div>
      helper-free-row:{row.id}:{deadlineSuggestions.length}:{assignedTask ? "assigned" : "none"}:{nextAssignedTask ? "next" : "no-next"}:{String(isBestGap)}
      <button type="button" onClick={() => onSkipTask("task-1")}>skip-helper-task</button>
    </div>
  ),
}));

import { renderFreeRow } from "../../../../pages/homepage/components/mini_timeline/MiniTimelineRowRenderer";
import { ListPill, ModulePill } from "../../../../pages/homepage/components/mini_timeline/parts/PlanEventRowParts";

const styles = new Proxy({}, { get: (_, key) => key });

describe("mini timeline renderer helper coverage", () => {
  it("renders the exported free-row helper directly", () => {
    const onSkipGapTask = vi.fn();
    render(
      renderFreeRow(
        { id: "free-helper", type: "free" },
        {
          styles,
          gapDeadlineFallbacks: { "free-helper": { id: "deadline-1" } },
          onQuickStart: vi.fn(),
          selectedDate: "2026-03-28",
          slotPopoverRef: { current: null },
          slotPopoverRowId: null,
          setSlotPopoverRowId: vi.fn(),
          bestFreeRowId: "other-row",
          assignedGapTasks: { map: {}, nextMap: {} },
          onSkipGapTask,
        },
      ),
    );

    expect(screen.getByText("helper-free-row:free-helper:1:none:no-next:false")).toBeInTheDocument();
    fireEvent.click(screen.getByText("skip-helper-task"));
    expect(onSkipGapTask).toHaveBeenCalledWith("free-helper", "task-1");
  });

  it("renders direct list and module link helpers", () => {
    const outerClick = vi.fn();
    const { rerender } = render(<div onClick={outerClick}><ListPill taskListId={42} /></div>);
    const listLink = screen.getByText("List").closest("a");
    expect(listLink).toHaveAttribute("href", "/tasks?list=42");
    fireEvent.click(screen.getByText("List"));
    expect(outerClick).not.toHaveBeenCalled();

    rerender(<div onClick={outerClick}><ModulePill styles={styles} moduleCode="CS103" matchTask={{ task_list: 11 }} accentColor="#4477aa" /></div>);
    const moduleLink = screen.getByText("CS103").closest("a");
    expect(moduleLink).toHaveAttribute("href", "/tasks?list=11&module=CS103");
    fireEvent.click(screen.getByText("CS103"));
    expect(outerClick).not.toHaveBeenCalled();
  });
});
