import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSocietyDetailPageData,
  renderSocietyDetailPage,
  societyDetailPageStateMocks,
} from "./societyDetailPageTestUtils.jsx";

import SocietyDetailPage from "../../pages/Societies/SocietyDetailPage";

function buildData(overrides = {}) {
  return createSocietyDetailPageData({
    ...overrides,
    members: overrides.members ?? [{ id: 1 }, { id: 2 }],
    society: {
      id: 1,
      name: "Drama Society",
      role: "editor",
      is_admin: true,
      has_reported: false,
      images: [{ url: "cover-1" }, { url: "cover-2" }],
      announcements: [],
      tags: ["arts", "events"],
      ratification_status: "pending",
      is_ratified: false,
      ...overrides.society,
    },
    page: {
      activeTab: "calendar",
      handleTabChange: vi.fn(),
      focusAnnouncementId: null,
      ...overrides.page,
    },
    modals: {
      showSettings: true,
      setShowSettings: vi.fn(),
      showReportModal: true,
      setShowReportModal: vi.fn(),
      galleryOpen: { index: 1 },
      setGalleryOpen: vi.fn(),
      showCoverModal: true,
      setShowCoverModal: vi.fn(),
      showMembersModal: true,
      setShowMembersModal: vi.fn(),
      editingAnnouncement: { id: 9 },
      setEditingAnnouncement: vi.fn(),
      editMode: false,
      setEditMode: vi.fn(),
      ...overrides.modals,
    },
    subscription: { isSubscribed: false, toggleSubscription: vi.fn(), ...overrides.subscription },
    tracker: {
      hasChanges: vi.fn(() => false),
      getChangeSummary: vi.fn(() => []),
      resetChanges: vi.fn(),
      ...overrides.tracker,
    },
  });
}

describe("SocietyDetailPage modal props", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the expected image, member, and announcement data into open modals", () => {
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(buildData());
    renderSocietyDetailPage(<SocietyDetailPage societyId={55} onBack={vi.fn()} />);

    expect(screen.getByTestId("settings-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("settings-modal")).toHaveTextContent("pending");
    expect(screen.getByTestId("gallery-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("gallery-modal")).toHaveTextContent("1");
    expect(screen.getByTestId("cover-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("report-modal")).toHaveTextContent("Drama Society");
    expect(screen.getByTestId("members-modal")).toHaveTextContent("Drama Society");
    expect(screen.getByTestId("members-modal")).toHaveTextContent("true");
    expect(screen.getByTestId("announcement-modal")).toHaveTextContent("55");
    expect(screen.getByTestId("announcement-modal")).toHaveTextContent("arts,events");
  });

  it("marks member directory as non-admin when the society role is not elevated", () => {
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(buildData({
      society: { role: "member", is_admin: false },
    }));

    renderSocietyDetailPage(<SocietyDetailPage societyId={3} onBack={vi.fn()} />);

    expect(screen.getByTestId("members-modal")).toHaveTextContent("false");
    fireEvent.click(screen.getByTitle("Report Society"));
    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
  });
});
