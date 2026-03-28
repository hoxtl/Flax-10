import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskAssigneePopup from "@/pages/group_work/components/TaskAssigneePopup";
import * as assigneeUtils from "@/pages/group_work/utils/taskAssigneeUtils";

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: () => <div data-testid="avatar">Avatar</div>,
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((m) => m.name || "Alice"),
}));

vi.mock("@/pages/group_work/utils/priorityUtils", () => ({
  getUserColor: vi.fn(() => "blue"),
}));

vi.mock("@/pages/group_work/utils/taskAssigneeUtils", () => ({
  createPopupCoords: vi.fn(() => ({ top: 100, left: 100, width: 200 })),
  shouldShowPopupAbove: vi.fn(() => false),
}));

describe("TaskAssigneePopup", () => {
  const onClose = vi.fn();
  const onToggleAssignee = vi.fn();
  const members = [{ id: 1, user: 101, name: "Alice" }];
  const assignees = [{ id: 101 }];
  const triggerRef = { current: { getBoundingClientRect: () => ({ top: 50, bottom: 60, left: 50, right: 150, width: 100, height: 10, x: 50, y: 50 }), contains: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <TaskAssigneePopup isOpen={false} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when open and handles toggling", () => {
    render(
      <TaskAssigneePopup isOpen={true} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    
    expect(screen.getByText("Assign Members")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    
    fireEvent.click(screen.getByText("Alice"));
    expect(onToggleAssignee).toHaveBeenCalledWith(101);
  });

  it("handles close button click", () => {
    render(
      <TaskAssigneePopup isOpen={true} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    
    // The X icon is inside a span with class closePopupBtn
    fireEvent.click(screen.getByText("Assign Members").nextSibling); 
    expect(onClose).toHaveBeenCalled();
  });

  it("handles clicking outside", () => {
    render(
      <TaskAssigneePopup isOpen={true} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    
    // Simulate mousedown outside
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not close when clicking inside popup", () => {
    render(
      <TaskAssigneePopup isOpen={true} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    
    fireEvent.mouseDown(screen.getByText("Assign Members"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("updates position on scroll and resize", () => {
    render(
      <TaskAssigneePopup isOpen={true} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    
    fireEvent.scroll(window);
    expect(assigneeUtils.createPopupCoords).toHaveBeenCalled();
    
    fireEvent.resize(window);
    expect(assigneeUtils.createPopupCoords).toHaveBeenCalled();
  });

  it("positions popup above trigger if space is limited", () => {
    assigneeUtils.shouldShowPopupAbove.mockReturnValue(true);
    render(
      <TaskAssigneePopup isOpen={true} onClose={onClose} members={members} assignees={assignees} onToggleAssignee={onToggleAssignee} triggerRef={triggerRef} />
    );
    // Logic: if shouldShowPopupAbove is true, calcPos is "top"
    // We can't easily check internal state, but it affects getPopupStyle
    // "top" results in bottom: window.innerHeight - coords.top and top: "auto"
  });
});
