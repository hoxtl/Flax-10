import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ListContextMenu, RenameInput } from "../../../../pages/tasks/components/listSidebarParts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ListSidebarParts", () => {
  it("saves trimmed values on enter or blur and cancels on escape", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<RenameInput value="Inbox" onSave={onSave} onCancel={onCancel} />);

    const input = screen.getByDisplayValue("Inbox");
    fireEvent.change(input, { target: { value: "  Study  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("Study");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("Inbox");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith("Inbox");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders the context menu at the requested position and closes from actions and outside clicks", () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();

    render(<ListContextMenu x={28} y={42} onRename={onRename} onDelete={onDelete} onClose={onClose} />);

    const menu = screen.getByRole("button", { name: /rename/i }).parentElement;
    expect(menu.style.getPropertyValue("--ctx-top")).toBe("42px");
    expect(menu.style.getPropertyValue("--ctx-left")).toBe("28px");

    fireEvent.mouseDown(menu);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    expect(onRename).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /delete list/i }));
    expect(onDelete).toHaveBeenCalled();

    onClose.mockClear();
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
