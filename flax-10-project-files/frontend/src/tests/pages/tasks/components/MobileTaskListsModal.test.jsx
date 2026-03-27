import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MobileTaskListsModal from "../../../../pages/tasks/components/MobileTaskListsModal";

vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ title, subtitle, children, onClose }) => (
    <section>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <button type="button" onClick={onClose}>
        close-modal
      </button>
      {children}
    </section>
  ),
}));

describe("MobileTaskListsModal", () => {
  it("renders the empty state when there are no lists and closes before opening create flow", () => {
    const onClose = vi.fn();
    const onNewList = vi.fn();

    render(
      <MobileTaskListsModal
        lists={[]}
        tasks={[]}
        activeListId={null}
        onClose={onClose}
        onNewList={onNewList}
      />,
    );

    expect(screen.getByText("View lists")).toBeInTheDocument();
    expect(screen.getByText("Choose a list to focus your task feed")).toBeInTheDocument();
    expect(screen.getByText("No lists yet")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ Add list/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onNewList).toHaveBeenCalledTimes(1);
  });

  it("renders reading and life sections with correct task counts", () => {
    render(
      <MobileTaskListsModal
        lists={[
          { id: 1, name: "CS1010 - Algorithms" },
          { id: 2, name: "Groceries" },
        ]}
        tasks={[
          { id: "a", task_list: 1, completed: false },
          { id: "b", task_list: 2, completed: false },
          { id: "c", task_list: 2, completed: false },
        ]}
        activeListId={2}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("READING LISTS")).toBeInTheDocument();
    expect(screen.getByText("LIFE LISTS")).toBeInTheDocument();
    expect(screen.getByText("CS1010 - Algorithms")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("selects a list and closes the modal on click", () => {
    const onSelectList = vi.fn();
    const onSelectFilter = vi.fn();
    const onClose = vi.fn();

    render(
      <MobileTaskListsModal
        lists={[{ id: 1, name: "CS1010 - Algorithms" }]}
        onSelectList={onSelectList}
        onSelectFilter={onSelectFilter}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /CS1010 - Algorithms/i }));

    expect(onSelectList).toHaveBeenCalledWith(1);
    expect(onSelectFilter).toHaveBeenCalledWith("all");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("tolerates missing lists and tasks props", () => {
    render(<MobileTaskListsModal onClose={vi.fn()} />);

    expect(screen.getByText("No lists yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Add list/i })).toBeInTheDocument();
  });
});
