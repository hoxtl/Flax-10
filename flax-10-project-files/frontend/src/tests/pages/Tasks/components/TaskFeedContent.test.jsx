/**
 * Verifies TaskFeedContent wiring across its child sections.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFnMap } from "../../../utils/testBuilderUtils";

vi.mock("../../../../pages/tasks/components/TaskFeedHeader", () => ({
  default: ({ title, subtitle, isReadingList }) => (
    <div data-testid="task-feed-header">
      <span>{title}</span>
      <span>{subtitle}</span>
      <span>{String(isReadingList)}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/TaskFeedSubHeader", () => ({
  default: ({ onOpenLists, onSelectFilter, onSelectList }) => (
    <div data-testid="task-feed-subheader">
      <button type="button" onClick={onOpenLists}>open-lists</button>
      <button type="button" onClick={() => onSelectFilter("today")}>choose-filter</button>
      <button type="button" onClick={() => onSelectList("2")}>choose-list</button>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/TaskFeedSections", () => ({
  default: ({ taskCount, activeFilter, activeListId, readingList, activeList }) => (
    <div data-testid="task-feed-sections">
      <span>{taskCount}</span>
      <span>{activeFilter}</span>
      <span>{activeListId}</span>
      <span>{String(readingList)}</span>
      <span>{activeList?.name}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/TaskFeedMobileLists", () => ({
  default: ({ showMobileLists, onClose, onSelectFilter, onSelectList }) => (
    <div data-testid="task-feed-mobile-lists">
      <span>{String(showMobileLists)}</span>
      <button type="button" onClick={onClose}>close-lists</button>
      <button type="button" onClick={() => onSelectFilter("upcoming")}>modal-filter</button>
      <button type="button" onClick={() => onSelectList("99")}>modal-list</button>
    </div>
  ),
}));

import TaskFeedContent from "../../../../pages/tasks/components/TaskFeedContent";

const taskActionNames = ["onAddTask", "onCreateTask", "onToggleComplete", "onDeleteTask", "onEditTask", "onReloadTasks"];

function buildTaskFeedProps(overrides = {}) {
  return {
    lists: [{ id: 1, name: "Inbox" }],
    activeListId: "1",
    activeFilter: "all",
    defaultDueDateForNewTask: "2026-03-25",
    tasks: [{ id: 1 }, { id: 2 }],
    ...createFnMap(taskActionNames),
    ...overrides,
  };
}

function buildVm(overrides = {}) {
  const { data, sidebarProps, sectionPropsWithHandlers, ...rest } = overrides;
  return {
    data: { headerTitle: "Tasks", ...(data || {}) },
    taskFeedSubtitle: "Everything due soon",
    readingList: true,
    activeList: { id: 1, name: "Inbox" },
    isMobile: true,
    showMobileLists: true,
    setShowMobileLists: vi.fn(),
    modalLists: [{ id: 1 }],
    modalTasks: [{ id: 1 }],
    sidebarProps: { ...createFnMap(["onSelectFilter", "onSelectList", "onNewList"]), ...sidebarProps },
    sectionPropsWithHandlers: { sections: [], ...sectionPropsWithHandlers },
    ...rest,
  };
}

function buildProps(overrides = {}) {
  return { props: buildTaskFeedProps(overrides.props), vm: buildVm(overrides.vm) };
}

describe("TaskFeedContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires the header, subheader, sections, and mobile list wrapper together", () => {
    const { props, vm } = buildProps();
    render(<TaskFeedContent props={props} vm={vm} />);

    expect(screen.getByTestId("task-feed-header")).toHaveTextContent("Tasks");
    expect(screen.getByTestId("task-feed-header")).toHaveTextContent("Everything due soon");
    expect(screen.getByTestId("task-feed-header")).toHaveTextContent("true");
    expect(screen.getByTestId("task-feed-sections")).toHaveTextContent("2");
    expect(screen.getByTestId("task-feed-sections")).toHaveTextContent("Inbox");
    expect(screen.getByTestId("task-feed-mobile-lists")).toHaveTextContent("true");
  });

  it("falls back to sidebar handlers and toggles the mobile list modal", () => {
    const { props, vm } = buildProps({
      props: {
        onSelectFilter: undefined,
        onSelectList: undefined,
      },
    });

    render(<TaskFeedContent props={props} vm={vm} />);

    fireEvent.click(screen.getByText("open-lists"));
    fireEvent.click(screen.getByText("choose-filter"));
    fireEvent.click(screen.getByText("choose-list"));
    fireEvent.click(screen.getByText("close-lists"));
    fireEvent.click(screen.getByText("modal-filter"));
    fireEvent.click(screen.getByText("modal-list"));

    expect(vm.setShowMobileLists).toHaveBeenCalledWith(true);
    expect(vm.setShowMobileLists).toHaveBeenCalledWith(false);
    expect(vm.sidebarProps.onSelectFilter).toHaveBeenCalledWith("today");
    expect(vm.sidebarProps.onSelectFilter).toHaveBeenCalledWith("upcoming");
    expect(vm.sidebarProps.onSelectList).toHaveBeenCalledWith("2");
    expect(vm.sidebarProps.onSelectList).toHaveBeenCalledWith("99");
  });

  it("prefers explicitly provided list and filter handlers", () => {
    const onSelectFilter = vi.fn();
    const onSelectList = vi.fn();
    const { props, vm } = buildProps({
      props: {
        onSelectFilter,
        onSelectList,
      },
    });

    render(<TaskFeedContent props={props} vm={vm} />);

    fireEvent.click(screen.getByText("choose-filter"));
    fireEvent.click(screen.getByText("choose-list"));
    fireEvent.click(screen.getByText("modal-filter"));
    fireEvent.click(screen.getByText("modal-list"));

    expect(onSelectFilter).toHaveBeenCalledTimes(2);
    expect(onSelectList).toHaveBeenCalledTimes(2);
    expect(vm.sidebarProps.onSelectFilter).not.toHaveBeenCalled();
    expect(vm.sidebarProps.onSelectList).not.toHaveBeenCalled();
  });
});
