import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskContextMenu from "@/pages/group_work/components/TaskContextMenu";

describe("TaskContextMenu", () => {
  const onDelete = vi.fn();
  const onClose = vi.fn();
  const onEditStart = vi.fn();
  const task = { id: 123 };
  const pos = { x: 100, y: 200 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders at the correct position and handles Edit", () => {
    render(
      <TaskContextMenu pos={pos} task={task} onDelete={onDelete} onClose={onClose} onEditStart={onEditStart} />
    );
    
    const editBtn = screen.getByText("Edit");
    expect(editBtn).toBeTruthy();
    
    // Check styles in parent of button (ContextMenuPortal)
    const menu = editBtn.closest("div");
    expect(menu.style.getPropertyValue("--ctx-top")).toBe("200px");
    expect(menu.style.getPropertyValue("--ctx-left")).toBe("100px");

    fireEvent.click(editBtn);
    expect(onClose).toHaveBeenCalled();
    expect(onEditStart).toHaveBeenCalled();
  });

  it("handles Delete", () => {
    render(<TaskContextMenu pos={pos} task={task} onDelete={onDelete} onClose={onClose} onEditStart={onEditStart} />);
    
    const deleteBtn = screen.getByText("Delete");
    fireEvent.click(deleteBtn);
    
    expect(onClose).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(123);
  });

  it("closes when clicking outside", () => {
    render(<TaskContextMenu pos={pos} task={task} onDelete={onDelete} onClose={onClose} onEditStart={onEditStart} />);
    
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("stops propagation on internal mousedown", () => {
    render(<TaskContextMenu pos={pos} task={task} onDelete={onDelete} onClose={onClose} onEditStart={onEditStart} />);
    
    const editBtn = screen.getByText("Edit");
    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, "stopPropagation");
    
    fireEvent(editBtn.parentElement, event);
    expect(spy).toHaveBeenCalled();
    // Since we stopped propagation, the document's mousedown listener (onClose) should NOT be called from this event alone
    // actually fireEvent(element, event) just triggers it on that element. 
    // RTL's fireEvent handles the propagation.
  });
});
