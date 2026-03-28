import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const useTaskTitleEditMock = vi.fn();
const handleTaskTitleKeyDownMock = vi.fn();

vi.mock("@/pages/group_work/components/taskCardEditUtils", () => ({
  useTaskTitleEdit: (...args) => useTaskTitleEditMock(...args),
  handleTaskTitleKeyDown: (...args) => handleTaskTitleKeyDownMock(...args),
}));

vi.mock("@/pages/group_work/components/TaskAssigneePopup", () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="assignee-popup" /> : null,
}));

vi.mock("@/pages/group_work/components/TaskAvatarStack", () => ({
  default: () => <div data-testid="avatar-stack" />,
}));

vi.mock("@/pages/group_work/components/TaskContextMenu", () => ({
  default: ({ pos, onClose }) => (
    <div data-testid="context-menu" style={{ left: pos.x, top: pos.y }}>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("@/components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input data-testid="date-picker" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("@/pages/group_work/utils/priorityUtils", () => ({
  getPriorityStyle: vi.fn(() => ({ backgroundColor: "#fff", color: "#000" })),
}));

vi.mock("@/pages/group_work/utils/taskUtils", () => ({
  buildToggleAssignee: vi.fn(() => vi.fn()),
  filterVisibleAssignees: vi.fn(() => []),
  getDueDateStr: vi.fn(() => ""),
}));

import TaskBoardCard from "@/pages/group_work/components/TaskBoardCard";

const baseTask = { id: 1, title: "Do something", priority: "medium", assignees_info: [], status: "todo", completed: false };
const noEdit = { editing: false, setEditing: vi.fn(), editTitle: "", setEditTitle: vi.fn(), saveEdit: vi.fn() };

const renderCard = (task = baseTask, overrides = {}) =>
  render(
    <TaskBoardCard
      task={{ ...baseTask, ...task }}
      members={[]}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      onDragStart={vi.fn()}
      {...overrides}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  useTaskTitleEditMock.mockReturnValue({ ...noEdit });
});

it("renders the task title", () => {
  renderCard();
  expect(screen.getByText("Do something")).toBeTruthy();
});

it("renders priority select", () => {
  renderCard();
  expect(screen.getByRole("combobox")).toBeTruthy();
});

it("opens context menu on right-click", () => {
  renderCard();
  fireEvent.contextMenu(screen.getByRole("button", { name: /Do something/i }), { clientX: 100, clientY: 200 });
  expect(screen.getByTestId("context-menu")).toBeTruthy();
});

it("closes context menu when close is clicked", () => {
  renderCard();
  fireEvent.contextMenu(screen.getByRole("button", { name: /Do something/i }), { clientX: 100, clientY: 200 });
  fireEvent.click(screen.getByText("Close"));
  expect(screen.queryByTestId("context-menu")).toBeNull();
});

it("renders editing textarea when in edit mode", () => {
  useTaskTitleEditMock.mockReturnValue({ ...noEdit, editing: true, editTitle: "Edit me" });
  renderCard();
  expect(screen.getByDisplayValue("Edit me")).toBeTruthy();
});

it("renders title button when not editing", () => {
  renderCard();
  expect(screen.getByRole("button", { name: /Do something/i })).toBeTruthy();
});

it("enters edit mode when title is clicked", () => {
  renderCard();
  fireEvent.click(screen.getByRole("button", { name: /Do something/i }));
  expect(noEdit.setEditTitle).toHaveBeenCalledWith(baseTask.title);
  expect(noEdit.setEditing).toHaveBeenCalledWith(true);
});

it("opens assignee popup on footer click", () => {
  renderCard();
  const footerBtn = screen.getByTestId("avatar-stack").parentElement;
  fireEvent.click(footerBtn);
  expect(screen.getByTestId("assignee-popup")).toBeTruthy();
});

it("applies done styling when task is completed", () => {
  const { container } = renderCard({ completed: true });
  expect(container.querySelector("[draggable]").className).toContain("Done");
});

it("applies active styling when assign popup is open", () => {
  renderCard();
  const footerBtn = screen.getByTestId("avatar-stack").parentElement;
  fireEvent.click(footerBtn);
  const card = screen.getByTestId("avatar-stack").closest("[draggable]");
  expect(card.className).toContain("Active");
});
