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

describe("ProfileHeader shared-profile extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders shared calendar actions, persona, badges, and contact links", () => {
    const onNavigate = vi.fn();
    const onPinBadge = vi.fn();
    render(
      <ProfileHeader
        user={{ id: 9, username: "ava", first_name: "Ava", last_name: "Stone", is_sharing: false }}
        profileData={{ id: 12, is_shared_with_me: true, email: "ava@example.com", bio: "Runner", major: "Physics", year: "Year 2" }}
        upcomingEventCount={0}
        handlers={handlers}
        visibility={{ canViewModules: true, canViewTasks: true, canViewEvents: true, canViewSharedWith: true, canEditProfile: false }}
        badges={[
          { id: 1, emoji: "🏅", label: "Consistency", description: "Keeps going" },
          { id: 2, emoji: "🔥", label: "Streak", description: "Long streak" },
        ]}
        pinnedBadgeId={1}
        onPinBadge={onPinBadge}
        onViewAllBadges={vi.fn()}
        persona={{ emoji: "🦉", label: "Night Owl", description: "Best later on" }}
        peakHour={21}
        societies={[{ id: 7, name: "Chess" }]}
        onSocietiesClick={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getAllByText("Shared calendar with me")).toHaveLength(2);
    expect(screen.getByText("View their calendar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("View their calendar"));
    expect(onNavigate).toHaveBeenCalledWith(expect.stringContaining("user_id=12"));
    expect(onNavigate).toHaveBeenCalledWith(expect.stringContaining("shared_name=Guest"));

    expect(screen.getByText("Based on your 9pm peak")).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId("share-toggle")[0]);
    expect(handlers.setOptimisticShare).toHaveBeenCalledWith(true);
    expect(handlers.reload).toHaveBeenCalled();

    expect(screen.getByText("Consistency")).toBeInTheDocument();
    expect(screen.getByText("Keeps going")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Consistency"));
    expect(onPinBadge).not.toHaveBeenCalled();
  });
});
