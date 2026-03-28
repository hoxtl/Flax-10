import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MembersSection from "@/pages/group_work/components/MembersSection";
import * as utils from "@/pages/group_work/utils/memberAvatarUtils";

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: () => <div data-testid="avatar">Avatar</div>,
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((m) => m.name),
  openMemberProfile: vi.fn(),
}));

describe("MembersSection", () => {
  const onRemove = vi.fn();
  const members = [
    { id: 1, name: "Alice", role: "owner" },
    { id: 2, name: "Bob", role: "member" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state", () => {
    render(<MembersSection members={[]} onRemove={onRemove} />);
    expect(screen.getByText(/No teammates added yet/)).toBeTruthy();
  });

  it("renders list and handles profile opening", () => {
    render(<MembersSection members={members} onRemove={onRemove} />);
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("Owner")).toBeTruthy();

    fireEvent.click(screen.getByTitle("Open Alice profile"));
    expect(utils.openMemberProfile).toHaveBeenCalled();
  });

  it("handles remove button visibility logic (owner, allowOwnerRemove=false)", () => {
    render(<MembersSection members={members} onRemove={onRemove} canRemove={true} allowOwnerRemove={false} />);
    // Owner (Alice) should NOT have remove button if allowOwnerRemove is false
    const alicePill = screen.getByText("Alice").closest("div");
    // Bob should have remove button
    const bobPill = screen.getByText("Bob").closest("div");

    expect(alicePill.querySelector("button:nth-child(2)")).toBeNull();
    expect(bobPill.querySelector("button:nth-child(2)")).toBeTruthy();
    
    fireEvent.click(screen.getByText("Remove"));
    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it("handles remove button visibility logic (owner, allowOwnerRemove=true)", () => {
    render(<MembersSection members={members} onRemove={onRemove} canRemove={true} allowOwnerRemove={true} />);
    // Both should have remove/leave buttons
    expect(screen.getByText("Leave project")).toBeTruthy();
    expect(screen.getByText("Remove")).toBeTruthy();

    fireEvent.click(screen.getByText("Leave project"));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it("hides remove buttons when canRemove is false", () => {
    render(<MembersSection members={members} onRemove={onRemove} canRemove={false} />);
    expect(screen.queryByText("Remove")).toBeNull();
    expect(screen.queryByText("Leave project")).toBeNull();
  });
});
