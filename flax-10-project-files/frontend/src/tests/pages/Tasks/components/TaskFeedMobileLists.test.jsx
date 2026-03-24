import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../pages/Tasks/components/MobileTaskListsModal", () => ({
  default: ({ activeListId, lists, tasks }) => (
    <div data-testid="mobile-task-lists-modal">
      <span>{activeListId}</span>
      <span>{lists.length}</span>
      <span>{tasks.length}</span>
    </div>
  ),
}));

import TaskFeedMobileLists from "../../../../pages/Tasks/components/TaskFeedMobileLists";

describe("TaskFeedMobileLists", () => {
  it("returns null when not mobile or when the modal is hidden", () => {
    const { rerender } = render(
      <TaskFeedMobileLists
        isMobile={false}
        showMobileLists
        modalLists={[]}
        modalTasks={[]}
        activeListId="1"
      />,
    );

    expect(screen.queryByTestId("mobile-task-lists-modal")).not.toBeInTheDocument();

    rerender(
      <TaskFeedMobileLists
        isMobile
        showMobileLists={false}
        modalLists={[]}
        modalTasks={[]}
        activeListId="1"
      />,
    );

    expect(screen.queryByTestId("mobile-task-lists-modal")).not.toBeInTheDocument();
  });

  it("renders the mobile task list modal with the expected props", () => {
    render(
      <TaskFeedMobileLists
        isMobile
        showMobileLists
        modalLists={[{ id: 1 }, { id: 2 }]}
        modalTasks={[{ id: 1 }]}
        activeListId="2"
        onSelectList={vi.fn()}
        onSelectFilter={vi.fn()}
        onNewList={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("mobile-task-lists-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("mobile-task-lists-modal")).toHaveTextContent("1");
  });
});
