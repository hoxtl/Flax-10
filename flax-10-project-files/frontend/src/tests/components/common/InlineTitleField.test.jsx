import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";

import InlineTitleField, { useInlineEdit } from "../../../components/common/inline_title_field/InlineTitleField";

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

  it("saves the draft on blur", () => {
    const onSave = vi.fn();
    render(<InlineTitleField isEditing value="T" draft="Updated" onSave={onSave} setDraft={vi.fn()} onStart={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onSave).toHaveBeenCalled();
  });

  it("saves the draft on Enter", () => {
    const onSave = vi.fn();
    render(<InlineTitleField isEditing value="T" draft="Updated" onSave={onSave} setDraft={vi.fn()} onStart={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSave).toHaveBeenCalled();
  });

  it("cancels the edit on Escape", () => {
    const onCancel = vi.fn();
    render(<InlineTitleField isEditing value="T" draft="Updated" onCancel={onCancel} setDraft={vi.fn()} onStart={vi.fn()} onSave={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
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
