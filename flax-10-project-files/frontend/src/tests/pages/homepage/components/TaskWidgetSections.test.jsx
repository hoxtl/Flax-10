import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { 
  TaskWidgetAllDone, 
  TaskWidgetEmpty, 
  TaskWidgetCompletedSection 
} from "../../../../pages/homepage/components/TaskWidgetSections";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/common/expandable_pill_button/ExpandablePillButton", () => ({
  default: (props) => (
    <button onClick={props.onToggle} data-testid="toggle-pill">
      {props.collapsedLabel}
    </button>
  ),
}));

vi.mock("@/pages/tasks/components/AllTasksCompleteCard", () => ({
  default: ({ children, sub }) => (
    <div data-testid="all-done-card">
      {sub}
      {children}
    </div>
  ),
}));

vi.mock("@/pages/homepage/components/EmptyStateCard", () => ({
  default: ({ message, action }) => (
    <div data-testid="empty-card">
      {message}
      {action}
    </div>
  ),
}));

const mockStyles = {
  taskWidgetSlotAllDoneWrap: "all-done-wrap",
  taskWidgetAllDoneCard: "all-done-card",
  taskWidgetPlanTomorrowPill: "plan-tomorrow-pill",
  taskWidgetLink: "empty-link",
  taskWidgetCompletedSection: "completed-section",
  taskWidgetCompletedTogglePill: "completed-toggle",
  taskWidgetCompletedList: "completed-list",
  taskWidgetCompletedRow: "completed-row",
  taskWidgetCompletedCheck: "completed-check",
  taskWidgetCompletedTitle: "completed-title",
};

describe("TaskWidgetSections", () => {
  describe("TaskWidgetAllDone", () => {
    it("renders singular task completed message", () => {
      render(<MemoryRouter><TaskWidgetAllDone itemCount={1} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText(/1 task completed today/i)).toBeTruthy();
      expect(screen.getByText(/Plan tomorrow/i)).toBeTruthy();
    });

    it("renders plural tasks completed message", () => {
      render(<MemoryRouter><TaskWidgetAllDone itemCount={5} styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText(/5 tasks completed today/i)).toBeTruthy();
    });
  });

  describe("TaskWidgetEmpty", () => {
    it("renders empty state message and action link", () => {
      render(<MemoryRouter><TaskWidgetEmpty styles={mockStyles} /></MemoryRouter>);
      expect(screen.getByText(/No tasks need attention/i)).toBeTruthy();
      expect(screen.getByRole("link", { name: /Add a task/i })).toBeTruthy();
    });
  });

  describe("TaskWidgetCompletedSection", () => {
    function CompletedHarness({ tasks }) {
      const [show, setShow] = React.useState(false);
      return <TaskWidgetCompletedSection 
        visibleCompleted={tasks} completedTasks={tasks} styles={mockStyles} 
        showCompleted={show} setShowCompleted={setShow} />;
    }

    it("returns null when no completed tasks are visible", () => {
      const { container } = render(<TaskWidgetCompletedSection visibleCompleted={[]} styles={mockStyles} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders toggle when completed tasks are present", () => {
      const tasks = [{ id: 1, title: "Done 1" }];
      render(<CompletedHarness tasks={tasks} />);
      expect(screen.getByText(/\+ 1 completed/i)).toBeTruthy();
    });

    it("toggles list on click", () => {
      const tasks = [{ id: 1, title: "Done 1" }];
      render(<CompletedHarness tasks={tasks} />);
      fireEvent.click(screen.getByText(/\+ 1 completed/i));
      expect(screen.getByText("Done 1")).toBeTruthy();
    });

    it("renders checkmark in list", () => {
      const tasks = [{ id: 1, title: "Done 1" }];
      render(<CompletedHarness tasks={tasks} />);
      fireEvent.click(screen.getByText(/\+ 1 completed/i));
      expect(screen.getByText("✓")).toBeTruthy();
    });
  });
});
