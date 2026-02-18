import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskRow from "../../../components/Tasks/TaskRow";

const defaultProps = (overrides = {}) => ({
  isEditing: false,
  editText: "",
  setEditText: () => {},
  onToggleDone: () => {},
  onSaveEdit: () => {},
  onCancelEdit: () => {},
  onStartEdit: () => {},
  onDotsClick: () => {},
  isMenuActive: false,
  ...overrides,
});

describe("TaskRow", () => {
  it("calls onToggleDone when checkbox changes", () => {
    const onToggleDone = vi.fn();
    render(
      <TaskRow item={{ id: 99, title: "Toggle", done: false, urgent: false }}
        {...defaultProps({ onToggleDone })} />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleDone).toHaveBeenCalledWith(99);
  });

  it("TaskLabel applies done class when not urgent but done=true", () => {
    render(
      <TaskRow item={{ id: 1, title: "Done task", done: true, urgent: false }}
        {...defaultProps()} />
    );
    expect(screen.getByText("Done task").className).not.toBe("");
  });

  it("non-urgent label branch renders", () => {
    render(
      <TaskRow item={{ id: 2, title: "Normal", done: false, urgent: false }}
        {...defaultProps()} />
    );
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("urgent label branch renders when not done", () => {
    render(
      <TaskRow item={{ id: 3, title: "Urgent", done: false, urgent: true }}
        {...defaultProps()} />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("urgent label branch renders when done", () => {
    render(
      <TaskRow item={{ id: 3, title: "Urgent", done: true, urgent: true }}
        {...defaultProps()} />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("double click label starts edit", () => {
    const onStartEdit = vi.fn();
    const item = { id: 4, title: "Edit me", done: false, urgent: false };
    render(<TaskRow item={item} {...defaultProps({ onStartEdit })} />);
    fireEvent.doubleClick(screen.getByText("Edit me"));
    expect(onStartEdit).toHaveBeenCalledWith(item);
  });

  it("dots button calls onDotsClick with event and item", () => {
    const onDotsClick = vi.fn();
    const item = { id: 5, title: "Dots", done: false, urgent: false };
    render(<TaskRow item={item} {...defaultProps({ onDotsClick })} />);
    fireEvent.click(screen.getByRole("button", { name: /task options/i }));
    expect(onDotsClick).toHaveBeenCalled();
    expect(onDotsClick.mock.calls[0][1]).toEqual(item);
  });

  it("editing: change updates text and Enter saves", () => {
    const setEditText = vi.fn();
    const onSaveEdit = vi.fn();
    render(
      <TaskRow item={{ id: 7, title: "Edit", done: false, urgent: false }}
        {...defaultProps({ isEditing: true, editText: "Edit", setEditText, onSaveEdit })} />
    );
    const input = screen.getByDisplayValue("Edit");
    fireEvent.change(input, { target: { value: "New" } });
    expect(setEditText).toHaveBeenCalledWith("New");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSaveEdit).toHaveBeenCalledWith(7);
  });

  it("editing: Escape cancels and blur saves", () => {
    const onSaveEdit = vi.fn();
    const onCancelEdit = vi.fn();
    render(
      <TaskRow item={{ id: 7, title: "Edit", done: false, urgent: false }}
        {...defaultProps({ isEditing: true, editText: "Edit", onSaveEdit, onCancelEdit })} />
    );
    const input = screen.getByDisplayValue("Edit");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(onSaveEdit).toHaveBeenCalledWith(7);
  });
});