import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../hooks/tasks/useTodoStorage", () => ({
  useTodoStorage: () => [
    [
      { id: "1", title: "A", done: false, urgent: false },
      { id: "2", title: "B", done: true, urgent: false },
    ],
    vi.fn(),
  ],
}));

vi.mock("../../../hooks/tasks/useTodoPanelState", () => ({
  useTodoPanelState: () => ({
    text: "New",
    setText: vi.fn(),
    editingId: null,
    setEditingId: vi.fn(),
    editText: "",
    setEditText: vi.fn(),
    menuOpen: true,
    setMenuOpen: vi.fn(),
  }),
}));

const setTaskMenuId = vi.fn();
const setTaskMenuAnchor = vi.fn();

vi.mock("../../../hooks/tasks/useTaskMenu", () => ({
  useTaskMenu: () => ({
    taskMenuId: null,
    setTaskMenuId,
    taskMenuPos: { top: 10, left: 20 },
    taskMenuRef: { current: null },
    setTaskMenuAnchor,
  }),
}));

vi.mock("../../../hooks/useOutsideClick", () => ({
  useOutsideClick: vi.fn(),
}));

const ops = {
  addItem: vi.fn(),
  toggleDone: vi.fn(),
  toggleUrgent: vi.fn(),
  deleteTask: vi.fn(),
  clearCompleted: vi.fn(),
  saveEdit: vi.fn(),
};

vi.mock("../../../hooks/tasks/useTaskOperations", () => ({
  useTaskOperations: () => ops,
}));

vi.mock("../../../hooks/tasks/useTaskReorder", () => ({
  useTaskReorder: () => ({ onReorderActive: vi.fn() }),
}));

vi.mock("../../../utils/tasks/taskListUtils", () => ({
  partitionTasks: (items) => ({
    isEmpty: items.length === 0,
    anyCompleted: items.some((x) => x.done),
    activePinned: items.filter((x) => !x.done),
    urgentActive: items.filter((x) => !x.done && x.urgent),
    otherActive: items.filter((x) => !x.done && !x.urgent),
    doneItems: items.filter((x) => x.done),
  }),
}));

vi.mock("framer-motion", () => ({
  Reorder: {
    Group: ({ children }) => <div>{children}</div>,
    Item: ({ children }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return { ...actual, createPortal: (node) => node };
});

import ToDoPanel from "../../../components/Tasks/ToDoPanel";

describe("ToDoPanel", () => {
  it("submits add item via TaskInput form", () => {
    render(<ToDoPanel open={true} onClose={vi.fn()} fabRef={{ current: null }} />);

    const input = screen.getByPlaceholderText("New Task");
    fireEvent.submit(input.closest("form"));
    expect(ops.addItem).toHaveBeenCalled();
  });

  it("calls clearCompleted from header menu", () => {
    render(<ToDoPanel open={true} onClose={vi.fn()} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByRole("button", { name: /clear completed tasks/i }));
    expect(ops.clearCompleted).toHaveBeenCalled();
  });

  it("sets menu anchor and toggles task menu id on dots click", () => {
    render(<ToDoPanel open={true} onClose={vi.fn()} fabRef={{ current: null }} />);
    fireEvent.click(screen.getAllByLabelText("Task options")[0]);
    expect(setTaskMenuAnchor).toHaveBeenCalled();
    expect(setTaskMenuId).toHaveBeenCalled();
  });
});
