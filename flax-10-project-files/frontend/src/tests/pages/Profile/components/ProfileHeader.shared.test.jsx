import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../../pages/profile/utils/profileHelpers", () => ({
  buildInitials: () => "AB",
  buildFullName: (user) => user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Guest",
}));

vi.mock("../../../../components/social/ShareButton", () => ({
  default: ({ onToggle }) => <button data-testid="share-toggle" onClick={() => onToggle?.(true)}>Share</button>,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, ...props }) => <button type="button" onClick={onClick} {...props}>{children}</button>,
}));

vi.mock("../../../../utils/tutorPhotoFallback", () => ({
  getResolvedUserPhoto: (user) => user?.profile_photo_url || "",
}));

import ProfileHeader from "../../../../pages/profile/components/ProfileHeader";

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

  it("renders the contact email when one is available", () => {
    render(
      <ProfileHeader
        user={sharedUser}
        profileData={sharedProfileData}
        handlers={handlers}
        visibility={{ canEditProfile: true }}
      />
    );

    expect(screen.getByRole("link", { name: "ava@example.com" })).toHaveAttribute(
      "href",
      "mailto:ava@example.com"
    );
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

  it("omits persona and badge sections when those datasets are empty", () => {
    render(
      <ProfileHeader
        user={sharedUser}
        profileData={{ ...sharedProfileData, email: null, bio: null }}
        handlers={handlers}
        visibility={{ canEditProfile: true }}
        badges={[]}
        persona={null}
      />
    );

    expect(screen.queryByText("Night Owl")).not.toBeInTheDocument();
    expect(screen.queryByText(/View All/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ava@example.com" })).not.toBeInTheDocument();
  });

  it("pins the featured badge when the profile is editable", () => {
    const onPinBadge = vi.fn();
    render(
      <ProfileHeader
        user={sharedUser}
        profileData={{ ...sharedProfileData, pinned_badge_id: 1 }}
        handlers={handlers}
        visibility={{ canEditProfile: true }}
        badges={sharedBadges}
        pinnedBadgeId={1}
        onPinBadge={onPinBadge}
        onViewAllBadges={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Consistency"));
    expect(onPinBadge).toHaveBeenCalledWith(1);
  });

  it("renders a resolved profile photo when one is available", () => {
    render(
      <ProfileHeader
        user={{ id: 15, username: "ava", profile_photo_url: "https://cdn.example/avatar.png" }}
        profileData={null}
        handlers={handlers}
        visibility={{ canEditProfile: true }}
      />
    );

    expect(screen.getAllByAltText("Profile")).toHaveLength(2);
    expect(screen.getAllByAltText("Profile")[0].getAttribute("src")).toContain("avatar.png");
  });

  it("detects teachers from a Dr. prefix and falls back to the teaching staff major", () => {
    render(
      <ProfileHeader
        user={{}}
        profileData={{ name: "Dr. Ada Lovelace", major: "Teaching staff" }}
        handlers={handlers}
        visibility={{ canEditProfile: true }}
      />
    );

    expect(screen.getAllByText("Professor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Department: Teaching staff").length).toBeGreaterThan(0);
  });

  it("uses the teaching staff fallback when a teacher has no major at all", () => {
    render(
      <ProfileHeader
        user={{ role: "teacher" }}
        profileData={{ name: "Dr. Ada Lovelace" }}
        handlers={handlers}
        visibility={{ canEditProfile: true }}
      />
    );

    expect(screen.getAllByText("Professor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Department: Teaching staff").length).toBeGreaterThan(0);
  });

  it("hides the shared-calendar pill when the shared profile has no navigation target", () => {
    render(
      <ProfileHeader
        user={{ username: "ava" }}
        profileData={{ is_shared_with_me: true }}
        handlers={handlers}
        visibility={{ canEditProfile: false }}
      />
    );

    expect(screen.queryByText("Shared calendar with me")).not.toBeInTheDocument();
  });

  it("renders the shared-calendar fallback route when the user id is missing", () => {
    const onNavigate = vi.fn();

    render(
      <ProfileHeader
        user={{ username: "ava" }}
        profileData={{ is_shared_with_me: true }}
        handlers={handlers}
        visibility={{ canEditProfile: false }}
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByText("View their calendar"));
    expect(onNavigate).toHaveBeenCalledWith("/calendar");
  });
});
