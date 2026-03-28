import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskAvatarStack from "@/pages/group_work/components/TaskAvatarStack";
import * as avatarUtils from "@/pages/group_work/utils/memberAvatarUtils";

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: () => <div data-testid="avatar">Avatar</div>,
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((a) => a.name || "Alice"),
  openMemberProfile: vi.fn(),
}));

describe("TaskAvatarStack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no assignees", () => {
    const { container } = render(<TaskAvatarStack assignees={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders visible assignees within max limit", () => {
    const assignees = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ];
    render(<TaskAvatarStack assignees={assignees} max={3} />);
    
    expect(screen.getAllByTestId("avatar").length).toBe(2);
    expect(screen.queryByText(/\+/)).toBeNull();
  });

  it("renders overflow badge when more than max", () => {
    const assignees = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
      { id: 4, name: "D" }
    ];
    render(<TaskAvatarStack assignees={assignees} max={2} />);
    
    expect(screen.getAllByTestId("avatar").length).toBe(2);
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("handles interaction on avatar buttons", () => {
    const assignees = [{ id: 1, name: "Alice" }];
    render(<TaskAvatarStack assignees={assignees} />);
    
    const button = screen.getByRole("button", { name: /Open Alice profile/ });
    fireEvent.click(button);
    expect(avatarUtils.openMemberProfile).toHaveBeenCalled();
  });
});
