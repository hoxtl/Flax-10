import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const taskFeedDataMock = vi.hoisted(() => vi.fn());
const responsiveMock = vi.hoisted(() => vi.fn());
const subtitleMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/hooks/useTaskFeedData", () => ({
  default: taskFeedDataMock,
}));

vi.mock("../../../../pages/Tasks/components/useTaskFeedResponsive", () => ({
  default: responsiveMock,
}));

vi.mock("../../../../pages/Tasks/components/TaskFeedSubtitle", () => ({
  getTaskFeedSubtitle: subtitleMock,
}));

vi.mock("../../../../pages/Tasks/components/TaskFeedContent", () => ({
  default: ({ vm }) => (
    <div>
      <span data-testid="subtitle">{vm.taskFeedSubtitle}</span>
      <span data-testid="active-list">{vm.activeList?.name ?? "none"}</span>
      <span data-testid="reading-list">{String(vm.readingList)}</span>
      <span data-testid="modal-lists">{vm.modalLists.map((list) => list.name).join(",")}</span>
      <span data-testid="modal-tasks">{vm.modalTasks.map((task) => task.title).join(",")}</span>
    </div>
  ),
}));

import TaskFeed from "../../../../pages/Tasks/components/TaskFeed";

function buildFeedData() {
  return {
    headerTitle: "Inbox",
    sectionProps: {},
  };
}

function buildProps(overrides = {}) {
  return {
    tasks: [{ id: 1, title: "Prop task" }],
    lists: [{ id: 7, name: "Reading List - History" }],
    activeFilter: "all",
    activeListId: "7",
    onToggleComplete: vi.fn(),
    onDeleteTask: vi.fn(),
    onEditTask: vi.fn(),
    ...overrides,
  };
}

describe("TaskFeed coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    taskFeedDataMock.mockReturnValue(buildFeedData());
    subtitleMock.mockReturnValue("Desktop subtitle");
  });

  it("uses sidebar modal data and suppresses subtitles on mobile", () => {
    responsiveMock.mockReturnValue({ isMobile: true, showMobileLists: false, setShowMobileLists: vi.fn() });
    render(
      <TaskFeed
        {...buildProps({ lists: undefined, activeListId: "99", sidebarProps: { lists: [{ id: 2, name: "Sidebar list" }], tasks: [{ id: 3, title: "Sidebar task" }] } })}
      />
    );

    expect(screen.getByTestId("subtitle")).toHaveTextContent("");
    expect(screen.getByTestId("active-list")).toHaveTextContent("none");
    expect(screen.getByTestId("reading-list")).toHaveTextContent("false");
    expect(screen.getByTestId("modal-lists")).toHaveTextContent("Sidebar list");
    expect(screen.getByTestId("modal-tasks")).toHaveTextContent("Sidebar task");
  });

  it("uses prop fallbacks and computes desktop reading-list subtitles", () => {
    responsiveMock.mockReturnValue({
      isMobile: false,
      showMobileLists: false,
      setShowMobileLists: vi.fn(),
    });

    render(<TaskFeed {...buildProps()} />);

    expect(screen.getByTestId("subtitle")).toHaveTextContent("Desktop subtitle");
    expect(screen.getByTestId("active-list")).toHaveTextContent("Reading List - History");
    expect(screen.getByTestId("reading-list")).toHaveTextContent("true");
    expect(screen.getByTestId("modal-lists")).toHaveTextContent("Reading List - History");
    expect(screen.getByTestId("modal-tasks")).toHaveTextContent("Prop task");
    expect(subtitleMock).toHaveBeenCalledWith(
      { id: 7, name: "Reading List - History" },
      true,
    );
  });

  it("falls back to empty mobile modal data when no list sources are provided", () => {
    responsiveMock.mockReturnValue({
      isMobile: false,
      showMobileLists: false,
      setShowMobileLists: vi.fn(),
    });

    render(
      <TaskFeed
        {...buildProps({
          lists: undefined,
          tasks: undefined,
          sidebarProps: undefined,
        })}
      />,
    );

    expect(screen.getByTestId("modal-lists")).toHaveTextContent("");
    expect(screen.getByTestId("modal-tasks")).toHaveTextContent("");
  });
});
