import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag) =>
        ({ children, ...props }) => {
          const Tag = typeof tag === "string" ? tag : "div";
          const {
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            layout: _layout,
            ...rest
          } = props;
          return <Tag {...rest}>{children}</Tag>;
        },
    },
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../context/AuthenticationContext", () => ({
  useAuth: useAuthMock,
}));

vi.mock("../../../../pages/Tasks/components/TaskCard", () => ({
  default: ({ task, onEdit }) => (
    <div data-testid={`task-card-${task.id}`}>
      <span>{task.title}</span>
      {onEdit && (
        <button type="button" onClick={() => onEdit({ title: "Updated" }, { source: "test" })}>
          edit task
        </button>
      )}
    </div>
  ),
}));

vi.mock("../../../../pages/Tasks/components/AllTasksCompleteCard", () => ({
  default: ({ message, sub }) => (
    <div data-testid="all-complete-card">
      <span>{message}</span>
      {sub && <span>{sub}</span>}
    </div>
  ),
}));

import TaskFilterPanel from "../../../../pages/Tasks/components/TaskFilterPanel";
import TaskSection from "../../../../pages/Tasks/components/TaskSection";
import { getVisibleSections } from "../../../../pages/Tasks/components/taskFeedSectionConfigs";

describe("Filters and sections coverage", () => {
  it("hides module filters for teachers and still searches lists", () => {
    useAuthMock.mockReturnValue({ profile: { role: "teacher" } });

    render(
      <TaskFilterPanel
        activeFilterTab="modules"
        onTabChange={vi.fn()}
        filterQuery=""
        onQueryChange={vi.fn()}
        visibleListItems={[{ value: "1", label: "Inbox" }]}
        filterListIds={["1"]}
        onToggleList={vi.fn()}
        moduleGroupKeys={["CS"]}
        groupedModuleItems={{ CS: [{ value: "cs101", label: "CS101" }] }}
        filterModuleCodes={[]}
        onToggleModule={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /Modules/i })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search lists...")).toBeInTheDocument();
  });

  it("renders grouped module checkboxes and toggles them", () => {
    useAuthMock.mockReturnValue({ profile: { role: "student" } });
    const onToggleModule = vi.fn();

    render(
      <TaskFilterPanel
        activeFilterTab="modules"
        onTabChange={vi.fn()}
        filterQuery=""
        onQueryChange={vi.fn()}
        visibleListItems={[]}
        filterListIds={[]}
        onToggleList={vi.fn()}
        moduleGroupKeys={["CS"]}
        groupedModuleItems={{ CS: [{ value: "cs101", label: "CS101" }] }}
        filterModuleCodes={["cs101"]}
        onToggleModule={onToggleModule}
        onClearAll={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("CS101"));
    expect(onToggleModule).toHaveBeenCalledWith("cs101");
  });

  it("shows reading-list empty subtitles and disables editing for reading tasks", () => {
    const onEdit = vi.fn(); const onToggle = vi.fn(); const onDelete = vi.fn();
    render(
      <>
        <TaskSection title="Later" emoji="⏳" tasks={[]} completedCount={1} sortBy="priority" listMap={{}} lists={[]} sectionType="later" emptyMessage="No tasks" emptySub="Nothing waiting" onToggleComplete={onToggle} onDeleteTask={onDelete} onEditTask={onEdit} />
        <TaskSection title="Readings" emoji="📚" tasks={[{ id: 2, title: "Chapter 1", task_list: 10, completed: false }]} completedCount={0} sortBy="priority" listMap={{ "10": { name: "CS101 - Systems", idx: 0 } }} lists={[{ id: 10, name: "CS101 - Systems" }]} sectionType="all" onToggleComplete={onToggle} onDeleteTask={onDelete} onEditTask={onEdit} />
      </>
    );

    expect(screen.getByText("Nothing waiting")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "edit task" })).not.toBeInTheDocument();
  });

  it("falls back to the all-tasks section for unknown filters", () => {
    const sections = getVisibleSections("mystery", {
      overdue: [],
      today: [],
      thisWeek: [],
      later: [],
      filtered: [],
      completed: [{ id: 1 }],
      completedTodayCount: 0,
      completedWeekCount: 0,
      completedLaterCount: 0,
      allTasksCombined: [{ id: 2, title: "Essay" }],
      allTasksEmptyCardProps: null,
      todayEmptyCardProps: null,
    });

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("All tasks");
  });
});
