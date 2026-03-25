import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const useSocietyPageDataMock = vi.fn();
const useSocietyInitMock = vi.fn();

vi.mock("../../pages/Societies/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => useSocietyPageDataMock(...args),
  useSocietyInit: (...args) => useSocietyInitMock(...args),
}));

vi.mock("../../components/Society/SocietyDetail/SocietyHero", () => ({
  default: ({ society, onUpdateName, onImageClick, onEditImages }) => (
    <div data-testid="hero">
      <span>{society.name}</span>
      <button type="button" onClick={() => onUpdateName("Renamed Society")}>rename-society</button>
      <button type="button" onClick={() => onImageClick(1)}>open-gallery</button>
      <button type="button" onClick={onEditImages}>edit-images</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/SocietyInfo", () => ({
  default: ({ onViewMembers, onToggleEditMode }) => (
    <div data-testid="info">
      <button type="button" onClick={onViewMembers}>view-members</button>
      <button type="button" onClick={onToggleEditMode}>toggle-edit-mode</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/tabs/SocietyTabs", () => ({
  default: ({ focusAnnouncementId, onEditAnnouncement }) => (
    <div data-testid="tabs">
      <span>{focusAnnouncementId || "no-focus"}</span>
      <button type="button" onClick={() => onEditAnnouncement({ id: 7 })}>edit-announcement</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/SocietySidebar", () => ({
  default: () => <div data-testid="sidebar">sidebar</div>,
}));

vi.mock("../../components/Society/SocietyDetail/imageHandlers/CoverImageModal", () => ({
  default: ({ onClose, onUpdate }) => (
    <div data-testid="cover-modal">
      <button type="button" onClick={onClose}>close-cover</button>
      <button type="button" onClick={() => onUpdate(["img-1", "img-2"])}>save-cover</button>
      <button type="button" onClick={() => onUpdate([])}>save-empty-cover</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal", () => ({
  default: ({ initialIndex, onClose }) => (
    <div data-testid="gallery-modal">
      <span>{initialIndex}</span>
      <button type="button" onClick={onClose}>close-gallery</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/SettingsModal", () => ({
  default: ({ onClose, onDelete }) => (
    <div data-testid="settings-modal">
      <button type="button" onClick={onClose}>close-settings</button>
      <button type="button" onClick={onDelete}>delete-society</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal", () => ({
  default: ({ onClose, onSubmit, onDelete }) => (
    <div data-testid="announcement-modal">
      <button type="button" onClick={onClose}>close-announcement</button>
      <button type="button" onClick={() => onSubmit({ id: 7, title: "Updated announcement" }, null)}>submit-announcement</button>
      <button type="button" onClick={() => onSubmit({ title: "Fresh announcement" }, null)}>submit-new-announcement</button>
      <button type="button" onClick={() => onSubmit({ id: 7, title: "Pinned announcement" }, { id: 4, pinned: true, title: "Existing pinned" })}>submit-conflict</button>
      <button type="button" onClick={() => onDelete(7)}>delete-announcement</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/ReportSocietyModal", () => ({
  default: ({ onClose, onReportSuccess }) => (
    <div data-testid="report-modal">
      <button type="button" onClick={onClose}>close-report</button>
      <button type="button" onClick={onReportSuccess}>report-success</button>
    </div>
  ),
}));

vi.mock("../../components/Society/SocietyDetail/MemberDirectoryModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="members-modal">
      <button type="button" onClick={onClose}>close-members</button>
    </div>
  ),
}));

vi.mock("../../components/common/BackButton/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
}));

vi.mock("../../pages/Societies/SocietySkeletons", () => ({
  SocietyDetailSkeleton: () => <div>Loading...</div>,
}));

import SocietyDetailPage from "../../pages/Societies/SocietyDetailPage";

function buildPageData(overrides = {}) {
  const {
    society: societyOverrides = {},
    page: pageOverrides = {},
    modals: modalOverrides = {},
    subscription: subscriptionOverrides = {},
    tracker: trackerOverrides = {},
    ...rest
  } = overrides;
  return {
    loading: false,
    society: {
      id: 1,
      name: "Robotics Society",
      role: "admin",
      is_admin: true,
      has_reported: false,
      images: [],
      announcements: [],
      tags: [],
      ratification_status: "approved",
      is_ratified: true,
      ...societyOverrides,
    },
    page: {
      activeTab: "calendar",
      handleTabChange: vi.fn(),
      focusAnnouncementId: null,
      ...pageOverrides,
    },
    modals: {
      showSettings: false,
      setShowSettings: vi.fn(),
      showReportModal: false,
      setShowReportModal: vi.fn(),
      galleryOpen: false,
      setGalleryOpen: vi.fn(),
      showCoverModal: false,
      setShowCoverModal: vi.fn(),
      showMembersModal: false,
      setShowMembersModal: vi.fn(),
      editingAnnouncement: null,
      setEditingAnnouncement: vi.fn(),
      editMode: false,
      setEditMode: vi.fn(),
      ...modalOverrides,
    },
    subscription: {
      isSubscribed: false,
      toggleSubscription: vi.fn(),
      ...subscriptionOverrides,
    },
    tracker: {
      hasChanges: vi.fn(() => false),
      getChangeSummary: vi.fn(() => []),
      resetChanges: vi.fn(),
      ...trackerOverrides,
    },
    members: [],
    updateSociety: vi.fn(),
    updateLocalSociety: vi.fn(),
    fetchMembers: vi.fn(),
    removeMember: vi.fn(),
    deleteSociety: vi.fn().mockResolvedValue({}),
    updateAnnouncement: vi.fn(),
    addAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    addCollaborator: vi.fn(),
    requestRatification: vi.fn(),
    updateMemberRole: vi.fn(),
    publishChanges: vi.fn().mockResolvedValue({}),
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
    ...rest,
  };
}

function renderPage(ui, { routeState } = {}) {
  const initialEntries = routeState ? [{ pathname: "/societies/1", state: routeState }] : ["/societies/1"];
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function renderDetailPageWithData(overrides = {}, props = {}) {
  const base = buildPageData();
  const data = {
    ...base,
    ...overrides,
    modals: { ...base.modals, ...overrides.modals },
    society: { ...base.society, ...overrides.society },
    page: { ...base.page, ...overrides.page },
    subscription: { ...base.subscription, ...overrides.subscription },
    tracker: { ...base.tracker, ...overrides.tracker },
  };
  useSocietyPageDataMock.mockReturnValue(data);
  renderPage(<SocietyDetailPage societyId={1} {...props} />);
  return data;
}

const interactiveOverrides = {
  modals: {
    showSettings: true,
    showReportModal: true,
    galleryOpen: { index: 1 },
    showCoverModal: true,
    showMembersModal: true,
    editingAnnouncement: { id: 7 },
  },
  society: {
    announcements: [{ id: 7, title: "Pinned announcement" }],
    tags: ["important"],
  },
};

function clickByText(text) {
  fireEvent.click(screen.getByText(text));
}

describe("SocietyDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current society layout and forwards route state into init", () => {
    const data = buildPageData({
      page: { focusAnnouncementId: "42" },
    });
    useSocietyPageDataMock.mockReturnValue(data);

    renderPage(
      <SocietyDetailPage societyId={1} initialTab="about" onMembershipChange={vi.fn()} />,
      { routeState: { activeTab: "members" } },
    );

    expect(useSocietyPageDataMock).toHaveBeenCalledWith(1, "about", expect.any(Function));
    expect(useSocietyInitMock).toHaveBeenCalledWith("members");
    expect(screen.getByTestId("hero")).toHaveTextContent("Robotics Society");
    expect(screen.getByTestId("info")).toBeInTheDocument();
    expect(screen.getByTestId("tabs")).toHaveTextContent("42");
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders loading and not-found states", () => {
    useSocietyPageDataMock.mockReturnValueOnce(buildPageData({ loading: true }));
    const { unmount } = renderPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    const onBack = vi.fn();
    unmount();
    const notFoundData = buildPageData();
    notFoundData.society = null;
    useSocietyPageDataMock.mockReturnValue(notFoundData);
    renderPage(<SocietyDetailPage societyId={1} onBack={onBack} />);

    expect(screen.getByText("Society not found.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back to Societies"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("opens the report and settings flows for admins", () => {
    const adminData = buildPageData();
    useSocietyPageDataMock.mockReturnValue(adminData);
    renderPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Report Society"));
    fireEvent.click(screen.getByTitle("Settings"));
    expect(adminData.modals.setShowReportModal).toHaveBeenCalledWith(true);
    expect(adminData.modals.setShowSettings).toHaveBeenCalledWith(true);
  });

  it("hides settings for non-admins and uses the unreport handler", () => {
    const memberData = buildPageData({
      society: { role: "member", is_admin: false, has_reported: true },
    });
    useSocietyPageDataMock.mockReturnValue(memberData);
    renderPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("You have reported this society. Click to unreport."));
    expect(memberData.handleUnreport).toHaveBeenCalledWith(memberData.society);
  });

});
