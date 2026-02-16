import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskRow from "../../../components/Tasks/TaskRow";

describe("TaskRow", () => {
  it("toggles done via checkbox", () => {
    const onToggleDone = vi.fn();
    render(
      <TaskRow
        item={{ id: "1", title: "A", done: false, urgent: false }}
        isEditing={false}
        editText=""
        setEditText={vi.fn()}
        onToggleDone={onToggleDone}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onStartEdit={vi.fn()}
        onDotsClick={vi.fn()}
        isMenuActive={false}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleDone).toHaveBeenCalledWith("1");
  });

  it("starts edit on double click", () => {
    const onStartEdit = vi.fn();
    render(
      <TaskRow
        item={{ id: "1", title: "Edit me", done: false, urgent: false }}
        isEditing={false}
        editText=""
        setEditText={vi.fn()}
        onToggleDone={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onStartEdit={onStartEdit}
        onDotsClick={vi.fn()}
        isMenuActive={false}
      />
    );

    fireEvent.doubleClick(screen.getByText("Edit me"));
    expect(onStartEdit).toHaveBeenCalled();
  });

  it("edit input handles Enter, Escape and blur", () => {
    const onSaveEdit = vi.fn();
    const onCancelEdit = vi.fn();
    const setEditText = vi.fn();

    render(
      <TaskRow
        item={{ id: "1", title: "A", done: false, urgent: false }}
        isEditing={true}
        editText="X"
        setEditText={setEditText}
        onToggleDone={vi.fn()}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onStartEdit={vi.fn()}
        onDotsClick={vi.fn()}
        isMenuActive={false}
      />
    );

    const input = screen.getByDisplayValue("X");
    fireEvent.change(input, { target: { value: "Y" } });
    expect(setEditText).toHaveBeenCalledWith("Y");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSaveEdit).toHaveBeenCalledWith("1");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancelEdit).toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onSaveEdit).toHaveBeenCalledWith("1");
  });

  it("calls onDotsClick from options button", () => {
    const onDotsClick = vi.fn();
    render(
      <TaskRow
        item={{ id: "1", title: "A", done: false, urgent: false }}
        isEditing={false}
        editText=""
        setEditText={vi.fn()}
        onToggleDone={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onStartEdit={vi.fn()}
        onDotsClick={onDotsClick}
        isMenuActive={false}
      />
    );

    fireEvent.click(screen.getByLabelText("Task options"));
    expect(onDotsClick).toHaveBeenCalled();
  });
});
