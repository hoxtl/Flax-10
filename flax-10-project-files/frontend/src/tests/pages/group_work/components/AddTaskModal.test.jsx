import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AddTaskModal from "@/pages/group_work/components/AddTaskModal";

vi.mock("@/components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div data-testid="standard-modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close Modal</button>
      {children}
    </div>
  ),
}));

vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, type, disabled }) => (
    <button onClick={onClick} type={type} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("@/components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input 
      data-testid="date-picker" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
    />
  ),
}));

vi.mock("@/pages/group_work/components/SelectableMemberRow", () => ({
  default: ({ member, checked, onToggle }) => (
    <div data-testid={`member-${member.id}`}>
      <span>{member.name}</span>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={() => onToggle(member.user)} 
      />
    </div>
  ),
}));

describe("AddTaskModal", () => {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  const members = [
    { id: 1, user: "u1", name: "Alice" },
    { id: 2, user: "u2", name: "Bob" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with members", () => {
    render(<AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />);
    expect(screen.getByText("Add new task")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders correctly without members", () => {
    render(<AddTaskModal members={[]} onAdd={onAdd} onClose={onClose} />);
    expect(screen.queryByText("Assign to")).toBeNull();
  });

  it("handles title input and submission", async () => {
    render(<AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />);
    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: "   New Task   " } });
    });

    const submitBtn = screen.getByText("Add task");
    expect(submitBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onAdd).toHaveBeenCalledWith({
      title: "New Task",
      due_date: null,
      assigned_to: [],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("disables submit button for empty title", () => {
    render(<AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />);
    const submitBtn = screen.getByText("Add task");
    expect(submitBtn).toBeDisabled();
    
    // Test submitTask guard via form submission with empty title
    const form = screen.getByRole("heading", { name: /Add new task/i }).nextElementSibling;
    fireEvent.submit(form);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("handles date picking and assignee toggling", async () => {
    render(<AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />);
    
    const datePicker = screen.getByTestId("date-picker");
    fireEvent.change(datePicker, { target: { value: "2026-05-01" } });

    const aliceCheckbox = screen.getByTestId("member-1").querySelector("input");
    fireEvent.click(aliceCheckbox); // Add Alice
    fireEvent.click(aliceCheckbox); // Remove Alice
    fireEvent.click(aliceCheckbox); // Add Alice again
    
    const bobCheckbox = screen.getByTestId("member-2").querySelector("input");
    fireEvent.click(bobCheckbox); // Add Bob

    fireEvent.change(screen.getByPlaceholderText("What needs to be done?"), { target: { value: "Task" } });
    fireEvent.click(screen.getByText("Add task"));

    expect(onAdd).toHaveBeenCalledWith({
      title: "Task",
      due_date: "2026-05-01",
      assigned_to: ["u1", "u2"],
    });
  });

  it("handles cancellation", () => {
    render(<AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("normalises numeric assignee IDs before submitting", async () => {
    const numericMembers = [
      { id: 1, user: 1, name: "Alice" },
      { id: 2, user: 2, name: "Bob" },
    ];
    render(<AddTaskModal members={numericMembers} onAdd={onAdd} onClose={onClose} />);

    const aliceCheckbox = screen.getByTestId("member-1").querySelector("input");
    const bobCheckbox = screen.getByTestId("member-2").querySelector("input");
    fireEvent.click(aliceCheckbox);
    fireEvent.click(bobCheckbox);
    fireEvent.change(screen.getByPlaceholderText("What needs to be done?"), { target: { value: "Numeric task" } });
    fireEvent.click(screen.getByText("Add task"));

    expect(onAdd).toHaveBeenCalledWith({
      title: "Numeric task",
      due_date: null,
      assigned_to: [1, 2],
    });
  });

  it("uses default empty array for members when not provided", () => {
    // Hits members = [] default parameter on line 66
    render(<AddTaskModal onAdd={onAdd} onClose={onClose} />);
    expect(screen.queryByText("Assign to")).toBeNull();
  });

  it("hits the empty title guard in submitTask", async () => {
    // Hits if (!trimmed) return on line 62
    render(<AddTaskModal members={members} onAdd={onAdd} onClose={onClose} />);
    
    // Attempt to submit via form without setting title
    const form = screen.getByRole("heading", { name: /Add new task/i }).nextElementSibling;
    fireEvent.submit(form);
    
    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
