import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";

import InlineTitleField, { useInlineEdit } from "../../../components/common/InlineTitleField/InlineTitleField";

function HookHarness({ initialValue = "Original", onSave = vi.fn() }) {
  const edit = useInlineEdit(initialValue, onSave);
  return (
    <div>
      <div data-testid="editing">{String(edit.isEditing)}</div>
      <div data-testid="draft">{edit.draft}</div>
      <button onClick={edit.start}>start</button>
      <button onClick={edit.save}>save</button>
      <button onClick={edit.cancel}>cancel</button>
      <button onClick={() => edit.setDraft(" Updated ")}>draft</button>
    </div>
  );
}

describe("InlineTitleField", () => {
  it("exercises the inline edit hook lifecycle", () => {
    const onSave = vi.fn();
    render(<HookHarness onSave={onSave} />);

    fireEvent.click(screen.getByText("start"));
    expect(screen.getByTestId("editing").textContent).toBe("true");

    fireEvent.click(screen.getByText("draft"));
    expect(screen.getByTestId("draft").textContent).toBe(" Updated ");

    fireEvent.click(screen.getByText("save"));
    expect(onSave).toHaveBeenCalledWith("Updated");
    expect(screen.getByTestId("editing").textContent).toBe("false");

    fireEvent.click(screen.getByText("start"));
    fireEvent.click(screen.getByText("cancel"));
    expect(screen.getByTestId("draft").textContent).toBe("Original");
  });

  it("renders a read-only span and switches to textarea editing", () => {
    const onStart = vi.fn();
    render(
      <InlineTitleField
        value="Task title"
        isEditing={false}
        draft="Task title"
        setDraft={vi.fn()}
        onStart={onStart}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        className="readonly"
        readOnlyStyles={{ color: "red" }}
      />
    );

    const span = screen.getByText("Task title");
    expect(span).toHaveClass("readonly");
    fireEvent.click(span);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("saves on blur, saves on Enter, and cancels on Escape", () => {
    const setDraft = vi.fn();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <InlineTitleField
        value="Task title"
        isEditing={true}
        draft="Changed title"
        setDraft={setDraft}
        onStart={vi.fn()}
        onSave={onSave}
        onCancel={onCancel}
        textareaClassName="editor"
        placeholder="Rename task"
      />
    );

    const textarea = screen.getByPlaceholderText("Rename task");
    fireEvent.change(textarea, { target: { value: "Another" } });
    expect(setDraft).toHaveBeenCalledWith("Another");

    fireEvent.keyDown(textarea, { key: "Enter", preventDefault: vi.fn() });
    expect(onSave).toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();

    fireEvent.blur(textarea);
    expect(onSave).toHaveBeenCalled();
  });

  it("does not save unchanged or blank values", () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useInlineEdit("Original", onSave));

    act(() => {
      result.current.start();
      result.current.save();
    });
    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      result.current.start();
      result.current.setDraft("   ");
      result.current.save();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
