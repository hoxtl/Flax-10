import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TasksPageContent from "../../../../pages/Tasks/TasksPageContent";
import TasksPageToasts from "../../../../pages/Tasks/TasksPageToasts";

vi.mock("../../../../pages/Tasks/components/ListSidebar", () => ({
  default: () => <div data-testid="list-sidebar" />,
}));

vi.mock("../../../../pages/Tasks/components/TaskFeed", () => ({
  default: () => <div data-testid="task-feed" />,
}));

vi.mock("../../../../pages/Tasks/components/CreateTaskModal", () => ({
  default: () => <div data-testid="create-task-modal" />,
}));

vi.mock("../../../../pages/Tasks/components/CreateListModal", () => ({
  default: () => <div data-testid="create-list-modal" />,
}));

vi.mock("../../../../components/Pagination/Pagination", () => ({
  BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock("../../../../components/common/AppToast/AppToast", () => ({
  default: ({ message, actionLabel, onAction, onClose, variant }) => (
    <div data-testid={`toast-${variant}`}>
      <span>{message}</span>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <button type="button" onClick={onClose}>
        Close toast
      </button>
    </div>
  ),
}));

describe("Tasks shell coverage", () => {
  it("renders the create-list-from-task modal branch", () => {
    render(
      <TasksPageContent
        page={{ sidebarProps: {}, feedProps: {}, showTaskModal: false, taskModalProps: {}, toastUndo: null, toastDelete: false, toastInfo: null, handleUndoAddTask: vi.fn(), setToastUndo: vi.fn(), setToastDelete: vi.fn(), setToastInfo: vi.fn(), showListModal: false, listModalProps: {}, showCreateListFromTask: true, createListFromTaskProps: {} }}
      />
    );

    expect(screen.getByTestId("create-list-modal")).toBeInTheDocument();
    expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
  });

  it("renders toast variants and wires undo and close handlers", () => {
    const props = { toastUndo: { taskId: 1, title: "Essay" }, toastDelete: true, toastInfo: "List deleted successfully.", handleUndoAddTask: vi.fn(), setToastUndo: vi.fn(), setToastDelete: vi.fn(), setToastInfo: vi.fn() };
    render(<TasksPageToasts {...props} />);

    expect(screen.getAllByTestId("toast-success")).toHaveLength(3);
    expect(screen.getByText("Task deleted.")).toBeInTheDocument();
    expect(screen.getByText("List deleted successfully.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(props.handleUndoAddTask).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Close toast" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Close toast" })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Close toast" })[2]);

    expect(props.setToastUndo).toHaveBeenCalledWith(null);
    expect(props.setToastDelete).toHaveBeenCalledWith(false);
    expect(props.setToastInfo).toHaveBeenCalledWith(null);
  });

  it("uses the info variant for non-delete information toasts", () => {
    render(
      <TasksPageToasts
        toastUndo={null}
        toastDelete={false}
        toastInfo="Task moved to Inbox."
        handleUndoAddTask={vi.fn()}
        setToastUndo={vi.fn()}
        setToastDelete={vi.fn()}
        setToastInfo={vi.fn()}
      />,
    );

    expect(screen.getByTestId("toast-info")).toBeInTheDocument();
  });
});
