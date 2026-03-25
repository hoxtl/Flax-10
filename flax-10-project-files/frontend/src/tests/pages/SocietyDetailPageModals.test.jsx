import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const useSocietyPageDataMock = vi.fn();

vi.mock("../../pages/Societies/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => useSocietyPageDataMock(...args),
  useSocietyInit: vi.fn(),
}));

vi.mock("../../components/Society/SocietyDetail/SocietyHero", () => ({
  default: () => <div>hero</div>,
}));

vi.mock("../../components/Society/SocietyDetail/SocietyInfo", () => ({
  default: () => <div>info</div>,
}));

vi.mock("../../components/Society/SocietyDetail/tabs/SocietyTabs", () => ({
  default: () => <div>tabs</div>,
}));

vi.mock("../../components/Society/SocietyDetail/SocietySidebar", () => ({
  default: () => <div>sidebar</div>,
}));

vi.mock("../../components/Society/SocietyDetail/imageHandlers/CoverImageModal", () => ({
  default: ({ images }) => <div data-testid="cover-modal">{images.length}</div>,
}));

vi.mock("../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal", () => ({
  default: ({ images, initialIndex }) => (
    <div data-testid="gallery-modal">
      <span>{images.length}</span>
      <span>{initialIndex}</span>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/SettingsModal", () => ({
  default: ({ members, ratificationStatus, isRatified, isAdmin }) => (
    <div data-testid="settings-modal">
      <span>{members.length}</span>
      <span>{ratificationStatus}</span>
      <span>{String(isRatified)}</span>
      <span>{String(isAdmin)}</span>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/ReportSocietyModal", () => ({
  default: ({ society }) => <div data-testid="report-modal">{society.name}</div>,
}));

vi.mock("../../components/Society/SocietyDetail/MemberDirectoryModal", () => ({
  default: ({ societyName, isAdmin }) => (
    <div data-testid="members-modal">
      <span>{societyName}</span>
      <span>{String(isAdmin)}</span>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal", () => ({
  default: ({ societyId, tags = [] }) => (
    <div data-testid="announcement-modal">
      <span>{societyId}</span>
      <span>{tags.join(",")}</span>
    </div>
  ),
}));

vi.mock("../../components/common/BackButton/BackButton.jsx", () => ({
  default: ({ label }) => <button type="button">{label}</button>,
}));

import SocietyDetailPage from "../../pages/Societies/SocietyDetailPage";

function buildData(overrides = {}) {
  return {
    loading: false,
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
    members: [{ id: 1 }, { id: 2 }],
    page: { activeTab: "calendar", handleTabChange: vi.fn(), focusAnnouncementId: null },
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
    subscription: { isSubscribed: false, toggleSubscription: vi.fn() },
    tracker: { hasChanges: vi.fn(() => false), getChangeSummary: vi.fn(() => []), resetChanges: vi.fn() },
    updateSociety: vi.fn(),
    updateLocalSociety: vi.fn(),
    fetchMembers: vi.fn(),
    removeMember: vi.fn(),
    deleteSociety: vi.fn(),
    updateAnnouncement: vi.fn(),
    addAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    addCollaborator: vi.fn(),
    requestRatification: vi.fn(),
    updateMemberRole: vi.fn(),
    publishChanges: vi.fn(),
    addEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    addException: vi.fn(),
    onAddTag: vi.fn(),
    onDeleteTag: vi.fn(),
    onUpdateTag: vi.fn(),
    joinSociety: vi.fn(),
    leaveSociety: vi.fn(),
    handleUnreport: vi.fn(),
    ...overrides,
  };
}

describe("SocietyDetailPage modal props", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the expected image, member, and announcement data into open modals", () => {
    useSocietyPageDataMock.mockReturnValue(buildData());
    render(
      <MemoryRouter>
        <SocietyDetailPage societyId={55} onBack={vi.fn()} />
      </MemoryRouter>,
    );

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
    useSocietyPageDataMock.mockReturnValue(buildData({
      society: { role: "member", is_admin: false },
    }));

    render(
      <MemoryRouter>
        <SocietyDetailPage societyId={3} onBack={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("members-modal")).toHaveTextContent("false");
    fireEvent.click(screen.getByTitle("Report Society"));
    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
  });
});
