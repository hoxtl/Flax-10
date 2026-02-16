import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ToDoPanel from "../../../components/Tasks/ToDoPanel";

vi.mock("../../../components/Tasks/TaskHeader", () => ({
  default: ({ onClearCompleted }) => (
    <div>
      <button onClick={onClearCompleted}>clear-completed</button>
    </div>
  ),
}));

vi.mock("../../../components/Tasks/TaskList", () => ({
  default: ({ onDotsClick, onCancelEdit, onSaveEdit, onStartEdit }) => (
    <div>
      <button
        onClick={() =>
          onDotsClick(
            { currentTarget: { getBoundingClientRect: () => ({ left: 1, top: 2, width: 3, height: 4 }) } },
            { id: 123 }
          )
        }
      >
        dots
      </button>

      <button onClick={onCancelEdit}>cancel-edit</button>
      <button onClick={() => onSaveEdit(777)}>save-edit</button>
      <button onClick={() => onStartEdit({ id: 888, title: "Hello" })}>start-edit</button>
    </div>
  ),
}));

vi.mock("../../../components/Tasks/TaskInput", () => ({
  default: ({ onSubmit }) => (
    <form onSubmit={onSubmit}>
      <button type="submit">submit</button>
    </form>
  ),
}));

const setEditingId = vi.fn();
const setEditText = vi.fn();
const setMenuOpen = vi.fn();
const setText = vi.fn();

vi.mock("../../../hooks/tasks/useTodoPanelState", () => ({
  useTodoPanelState: () => ({
    text: "abc",
    setText,
    editingId: 1,
    setEditingId,
    editText: "edit",
    setEditText,
    menuOpen: false,
    setMenuOpen,
  }),
}));

const setTaskMenuId = vi.fn();
const setTaskMenuAnchor = vi.fn();

vi.mock("../../../hooks/tasks/useTaskMenu", () => ({
  useTaskMenu: () => ({
    taskMenuId: null,
    setTaskMenuId,
    taskMenuPos: null,
    taskMenuRef: { current: null },
    setTaskMenuAnchor,
  }),
}));

vi.mock("../../../hooks/useOutsideClick", () => ({
  useOutsideClick: () => {},
}));

const ops = {
  addItem: vi.fn(),
  saveEdit: vi.fn(),
  clearCompleted: vi.fn(),
  toggleDone: vi.fn(),
  toggleUrgent: vi.fn(),
  deleteTask: vi.fn(),
};

vi.mock("../../../hooks/tasks/useTaskOperations", () => ({
  useTaskOperations: () => ops,
}));

vi.mock("../../../hooks/tasks/useTaskReorder", () => ({
  useTaskReorder: () => ({ onReorderActive: vi.fn() }),
}));

vi.mock("../../../hooks/tasks/useTodoStorage", () => ({
  useTodoStorage: () => [[{ id: 1, title: "A", done: false, urgent: false }], vi.fn()],
}));

vi.mock("../../../utils/tasks/taskListUtils", () => ({
  partitionTasks: () => ({
    isEmpty: false,
    anyCompleted: true,
    activePinned: [],
    urgentActive: [],
    otherActive: [],
    doneItems: [],
  }),
}));

describe("ToDoPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders closed class when open=false", () => {
    render(<ToDoPanel open={false} onClose={() => {}} fabRef={{ current: null }} />);
    const panel = screen.getByText("clear-completed").closest("div").parentElement; 
    expect(panel.className).toMatch(/closed/);
  });

  it("dots click sets anchor and toggles id (open then close)", () => {
    // First click should set anchor + setTaskMenuId called with updater
    render(<ToDoPanel open={true} onClose={() => {}} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByText("dots"));

    expect(setTaskMenuAnchor).toHaveBeenCalledWith({ x: 1, y: 2, w: 3, h: 4 });
    expect(setTaskMenuId).toHaveBeenCalledTimes(1);
   
    const updater = setTaskMenuId.mock.calls[0][0];
    expect(typeof updater).toBe("function");

    expect(updater(null)).toBe(123); 
    expect(updater(123)).toBe(null); 
  });

  it("cancel edit clears editingId and editText", () => {
    render(<ToDoPanel open={true} onClose={() => {}} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByText("cancel-edit"));

    expect(setEditingId).toHaveBeenCalledWith(null);
    expect(setEditText).toHaveBeenCalledWith("");
  });

  it("save edit calls operations.saveEdit with correct args", () => {
    render(<ToDoPanel open={true} onClose={() => {}} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByText("save-edit"));

    expect(ops.saveEdit).toHaveBeenCalledWith(777, "edit", setEditingId, setEditText);
  });

  it("start edit sets editingId and editText from item", () => {
    render(<ToDoPanel open={true} onClose={() => {}} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByText("start-edit"));

    expect(setEditingId).toHaveBeenCalledWith(888);
    expect(setEditText).toHaveBeenCalledWith("Hello");
  });

  it("clear completed calls operations.clearCompleted(setMenuOpen)", () => {
    render(<ToDoPanel open={true} onClose={() => {}} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByText("clear-completed"));

    expect(ops.clearCompleted).toHaveBeenCalledWith(setMenuOpen);
  });

  it("submit triggers addItem", () => {
    render(<ToDoPanel open={true} onClose={() => {}} fabRef={{ current: null }} />);
    fireEvent.click(screen.getByText("submit"));

    expect(ops.addItem).toHaveBeenCalledWith("abc", setText);
  });
});
