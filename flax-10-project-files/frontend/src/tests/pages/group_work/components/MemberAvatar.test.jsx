import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MemberAvatar from "@/pages/group_work/components/MemberAvatar";

vi.mock("@/pages/group_work/utils/priorityUtils", () => ({
  getUserColor: vi.fn(() => "blue"),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn(() => "Alice"),
  getInitials: vi.fn(() => "A"),
  getPhotoUrl: vi.fn(),
}));

import * as avatarUtils from "@/pages/group_work/utils/memberAvatarUtils";

// ... mocks ...

describe("MemberAvatar", () => {
  it("renders image when photoUrl is present", () => {
    avatarUtils.getPhotoUrl.mockReturnValue("http://photo.jpg");
    
    render(<MemberAvatar member={{ id: 1 }} size={32} />);
    const img = screen.getByRole("img");
    expect(img.src).toContain("photo.jpg");
    expect(img.alt).toBe("Alice");
    expect(img.style.width).toBe("32px");
  });

  it("renders initials when photoUrl is missing", () => {
    avatarUtils.getPhotoUrl.mockReturnValue(null);
    const { container } = render(<MemberAvatar member={{ id: 1 }} size={24} />);
    expect(screen.getByText("A")).toBeTruthy();
    expect(container.firstChild.style.getPropertyValue("--avatar-bg")).toBe("blue");
  });
});
