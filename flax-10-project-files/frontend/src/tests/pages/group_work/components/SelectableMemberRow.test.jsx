import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectableMemberRow from "@/pages/group_work/components/SelectableMemberRow";

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: () => <div data-testid="avatar">Avatar</div>,
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((m) => m.name),
}));

describe("SelectableMemberRow", () => {
  const onToggle = vi.fn();
  const member = { id: 1, user: 101, name: "Alice" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with member info and handles toggle", () => {
    render(<SelectableMemberRow member={member} checked={false} onToggle={onToggle} />);
    expect(screen.getByText("Alice")).toBeTruthy();
    
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.checked).toBe(false);
    
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith("101");
  });

  it("supports custom checkbox ID prefixes", () => {
    render(<SelectableMemberRow member={member} checked={false} onToggle={onToggle} inputIdPrefix="task-assignee" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("id", "task-assignee-101");
  });

  it("handles checked state", () => {
    render(<SelectableMemberRow member={member} checked={true} onToggle={onToggle} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.checked).toBe(true);
  });

  it("uses member.id if member.user is missing", () => {
    render(<SelectableMemberRow member={{ id: 2, name: "Bob" }} checked={false} onToggle={onToggle} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith("2");
  });

  it("uses empty string if both user and id are missing", () => {
    // Hits line 9: String(member.user ?? member.id ?? "")
    render(<SelectableMemberRow member={{ name: "Stranger" }} checked={false} onToggle={onToggle} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith("");
  });
});
