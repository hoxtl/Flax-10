import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../../pages/Profile/utils/profileHelpers", () => ({
  buildInitials: () => "AB",
  buildFullName: (user) => user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Guest",
}));

vi.mock("../../../../components/Social/ShareButton", () => ({
  default: ({ onToggle }) => <button data-testid="share-toggle" onClick={() => onToggle?.(true)}>Share</button>,
}));

vi.mock("../../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, onClick, ...props }) => <button type="button" onClick={onClick} {...props}>{children}</button>,
}));

vi.mock("../../../../utils/tutorPhotoFallback", () => ({
  getResolvedUserPhoto: () => "",
}));

import ProfileHeader from "../../../../pages/Profile/components/ProfileHeader";

const handlers = {
  onEditProfile: vi.fn(),
  onModulesClick: vi.fn(),
  onTasksClick: vi.fn(),
  onEventsClick: vi.fn(),
  onSharedWithClick: vi.fn(),
  onSharedByClick: vi.fn(),
  reload: vi.fn(),
  setOptimisticShare: vi.fn(),
};

const sharedUser = { id: 9, username: "ava", first_name: "Ava", last_name: "Stone", is_sharing: false };
const sharedProfileData = { id: 12, is_shared_with_me: true, email: "ava@example.com", bio: "Runner", major: "Physics", year: "Year 2" };
const sharedBadges = [
  { id: 1, emoji: "🏅", label: "Consistency", description: "Keeps going" },
  { id: 2, emoji: "🔥", label: "Streak", description: "Long streak" },
];
const sharedPersona = { emoji: "🦉", label: "Night Owl", description: "Best later on" };

describe("ProfileHeader shared-profile extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders persona and peak hour details", () => {
    render(
      <ProfileHeader
        user={sharedUser}
        profileData={sharedProfileData}
        handlers={handlers}
        visibility={{ canViewModules: true, canViewTasks: true, canViewEvents: true }}
        persona={sharedPersona}
        peakHour={21}
        onPinBadge={vi.fn()}
        onViewAllBadges={vi.fn()}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Based on your 9pm peak")).toBeInTheDocument();
    expect(screen.getByText("Night Owl")).toBeInTheDocument();
  });

  it("handles shared calendar actions and navigation", () => {
    const onNavigate = vi.fn();
    render(
      <ProfileHeader
        user={sharedUser}
        profileData={sharedProfileData}
        handlers={handlers}
        visibility={{ canViewEvents: true, canEditProfile: false }}
        onPinBadge={vi.fn()}
        onViewAllBadges={vi.fn()}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getAllByText("Shared calendar with me")).toHaveLength(2);
    fireEvent.click(screen.getByText("View their calendar"));
    expect(onNavigate).toHaveBeenCalledWith(expect.stringContaining("user_id=12"));
    
    fireEvent.click(screen.getAllByTestId("share-toggle")[0]);
    expect(handlers.setOptimisticShare).toHaveBeenCalledWith(true);
  });

  it("renders badges and societies", () => {
    const onPinBadge = vi.fn();
    render(
      <ProfileHeader
        user={sharedUser}
        profileData={sharedProfileData}
        handlers={handlers}
        visibility={{ canEditProfile: false }}
        badges={sharedBadges}
        pinnedBadgeId={1}
        onPinBadge={onPinBadge}
        onViewAllBadges={vi.fn()}
        societies={[{ id: 7, name: "Chess" }]}
        onSocietiesClick={vi.fn()}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Consistency")).toBeInTheDocument();
    expect(screen.getByText("Keeps going")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Consistency"));
    expect(onPinBadge).not.toHaveBeenCalled(); // Read-only for shared profiles
  });
});
