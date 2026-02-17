import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TaskList from "../../../components/Tasks/TaskList";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => children,
  Reorder: {
    Group: ({ children }) => <div data-testid="reorder-group">{children}</div>,
  },
}));

vi.mock("../../../components/Tasks/TaskPanel.module.css", () => ({
  default: { list: "list", emptyState: "emptyState" },
}));

vi.mock("../../../components/Tasks/TaskSection.module.css", () => ({
  default: { reorderGroup: "reorderGroup" },
}));

vi.mock("../../../components/Tasks/TaskSection", () => ({
  UrgentSection: ({ items }) => <div>urgent:{items.length}</div>,
  OthersSection: ({ items }) => <div>others:{items.length}</div>,
  DoneSection: ({ items }) => <div>done:{items.length}</div>,
}));

describe("TaskList", () => {
  const baseProps = {
    activePinned: [],
    urgentActive: [],
    otherActive: [],
    doneItems: [],
    onReorder: vi.fn(),
    editingId: null,
    editText: "",
    setEditText: vi.fn(),
    taskMenuId: null,
    onToggleDone: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onStartEdit: vi.fn(),
    onDotsClick: vi.fn(),
    onToggleUrgent: vi.fn(),
    onDelete: vi.fn(),
    taskMenuRef: { current: null },
    taskMenuPos: { top: 0, left: 0 },
  };

  it("shows empty state when isEmpty", () => {
    render(<TaskList {...baseProps} isEmpty />);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it("renders all sections and the reorder group", () => {
    render(
      <TaskList
        {...baseProps}
        isEmpty={false}
        urgentActive={[{ id: 1 }]}
        otherActive={[{ id: 2 }, { id: 3 }]}
        doneItems={[{ id: 4 }]}
      />
    );

    expect(screen.getByTestId("reorder-group")).toBeInTheDocument();
    expect(screen.getByText("urgent:1")).toBeInTheDocument();
    expect(screen.getByText("others:2")).toBeInTheDocument();
    expect(screen.getByText("done:1")).toBeInTheDocument();
  });
});
