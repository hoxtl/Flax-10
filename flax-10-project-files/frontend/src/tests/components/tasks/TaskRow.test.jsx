import { render, screen, fireEvent } from "@testing-library/react";
import TaskRow from "../../../components/Tasks/TaskRow";

describe("TaskRow", () => {
  it("toggles done checkbox", () => {
    const onToggleDone = vi.fn();
    render(
      <TaskRow
        item={{ id: 1, title: "A", done: false, urgent: false }}
        isEditing={false}
        editText=""
        setEditText={() => {}}
        onToggleDone={onToggleDone}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onStartEdit={() => {}}
        onDotsClick={() => {}}
        isMenuActive={false}
      />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleDone).toHaveBeenCalledWith(1);
  });

  it("non-urgent label branch renders", () => {
    render(
      <TaskRow
        item={{ id: 2, title: "Normal", done: false, urgent: false }}
        isEditing={false}
        editText=""
        setEditText={() => {}}
        onToggleDone={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onStartEdit={() => {}}
        onDotsClick={() => {}}
        isMenuActive={false}
      />
    );
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("urgent label branch renders (done + not done)", () => {
    const { rerender } = render(
      <TaskRow
        item={{ id: 3, title: "Urgent", done: false, urgent: true }}
        isEditing={false}
        editText=""
        setEditText={() => {}}
        onToggleDone={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onStartEdit={() => {}}
        onDotsClick={() => {}}
        isMenuActive={false}
      />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();

    rerender(
      <TaskRow
        item={{ id: 3, title: "Urgent", done: true, urgent: true }}
        isEditing={false}
        editText=""
        setEditText={() => {}}
        onToggleDone={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onStartEdit={() => {}}
        onDotsClick={() => {}}
        isMenuActive={false}
      />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("double click label starts edit", () => {
    const onStartEdit = vi.fn();
    const item = { id: 4, title: "Edit me", done: false, urgent: false };
    render(
      <TaskRow
        item={item}
        isEditing={false}
        editText=""
        setEditText={() => {}}
        onToggleDone={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onStartEdit={onStartEdit}
        onDotsClick={() => {}}
        isMenuActive={false}
      />
    );
    fireEvent.doubleClick(screen.getByText("Edit me"));
    expect(onStartEdit).toHaveBeenCalledWith(item);
  });

  it("dots button calls onDotsClick with event and item", () => {
    const onDotsClick = vi.fn();
    const item = { id: 5, title: "Dots", done: false, urgent: false };
    render(
      <TaskRow
        item={item}
        isEditing={false}
        editText=""
        setEditText={() => {}}
        onToggleDone={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onStartEdit={() => {}}
        onDotsClick={onDotsClick}
        isMenuActive={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /task options/i }));
    expect(onDotsClick).toHaveBeenCalled();
    expect(onDotsClick.mock.calls[0][1]).toEqual(item);
  });

  it("editing: change updates text, Enter saves, Escape cancels, blur saves", () => {
    const setEditText = vi.fn();
    const onSaveEdit = vi.fn();
    const onCancelEdit = vi.fn();
    render(
      <TaskRow
        item={{ id: 7, title: "Edit", done: false, urgent: false }}
        isEditing={true}
        editText="Edit"
        setEditText={setEditText}
        onToggleDone={() => {}}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onStartEdit={() => {}}
        onDotsClick={() => {}}
        isMenuActive={false}
      />
    );
    const input = screen.getByDisplayValue("Edit");
    fireEvent.change(input, { target: { value: "New" } });
    expect(setEditText).toHaveBeenCalledWith("New");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSaveEdit).toHaveBeenCalledWith(7);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(onSaveEdit).toHaveBeenCalledWith(7);
  });
});
