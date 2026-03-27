import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

const societyDetailPageStateMocks = vi.hoisted(() => ({
  useSocietyPageDataMock: vi.fn(),
  useSocietyInitMock: vi.fn(),
}));

export { societyDetailPageStateMocks };

const createSocietyDefaults = (overrides = {}) => ({
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
  ...overrides,
});

const createPageDefaults = (overrides = {}) => ({
  activeTab: "calendar",
  handleTabChange: vi.fn(),
  focusAnnouncementId: null,
  ...overrides,
});

const createModalDefaults = (overrides = {}) => ({
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
  ...overrides,
});

const createSubscriptionDefaults = (overrides = {}) => ({
  isSubscribed: false,
  toggleSubscription: vi.fn(),
  ...overrides,
});

const createTrackerDefaults = (overrides = {}) => ({
  hasChanges: vi.fn(() => false),
  getChangeSummary: vi.fn(() => []),
  resetChanges: vi.fn(),
  ...overrides,
});

const createMutations = () => ({
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
});

export function SocietyHeroMock({ society, onUpdateName, onImageClick, onEditImages }) {
  return (
    <div data-testid="hero">
      <span>{society.name}</span>
      <button type="button" onClick={() => onUpdateName("Renamed Society")}>rename-society</button>
      <button type="button" onClick={() => onImageClick(1)}>open-gallery</button>
      <button type="button" onClick={onEditImages}>edit-images</button>
    </div>
  );
}

export function SocietyInfoMock({ onViewMembers, onToggleEditMode }) {
  return (
    <div data-testid="info">
      <button type="button" onClick={onViewMembers}>view-members</button>
      <button type="button" onClick={onToggleEditMode}>toggle-edit-mode</button>
    </div>
  );
}

export function SocietyTabsMock({ focusAnnouncementId, onEditAnnouncement }) {
  return (
    <div data-testid="tabs">
      <span>{focusAnnouncementId || "no-focus"}</span>
      <button type="button" onClick={() => onEditAnnouncement({ id: 7 })}>edit-announcement</button>
    </div>
  );
}

export function SocietySidebarMock() {
  return <div data-testid="sidebar">sidebar</div>;
}

export function CoverImageModalMock({ images = [], onClose, onUpdate }) {
  return (
    <div data-testid="cover-modal">
      <span>{images.length}</span>
      <button type="button" onClick={onClose}>close-cover</button>
      <button type="button" onClick={() => onUpdate(["img-1", "img-2"])}>save-cover</button>
      <button type="button" onClick={() => onUpdate([])}>save-empty-cover</button>
    </div>
  );
}

export function ImageGalleryModalMock({ images = [], initialIndex, onClose }) {
  return (
    <div data-testid="gallery-modal">
      <span>{images.length}</span>
      <span>{initialIndex}</span>
      <button type="button" onClick={onClose}>close-gallery</button>
    </div>
  );
}

export function SettingsModalMock({ members = [], ratificationStatus, isRatified, isAdmin, onClose, onDelete }) {
  return (
    <div data-testid="settings-modal">
      <span>{members.length}</span>
      <span>{ratificationStatus}</span>
      <span>{String(isRatified)}</span>
      <span>{String(isAdmin)}</span>
      <button type="button" onClick={onClose}>close-settings</button>
      <button type="button" onClick={onDelete}>delete-society</button>
    </div>
  );
}

export function AnnouncementModalMock({ societyId, tags = [], onClose, onSubmit, onDelete }) {
  return (
    <div data-testid="announcement-modal">
      <span>{societyId}</span>
      <span>{tags.join(",")}</span>
      <button type="button" onClick={onClose}>close-announcement</button>
      <button type="button" onClick={() => onSubmit({ id: 7, title: "Updated announcement" }, null)}>submit-announcement</button>
      <button type="button" onClick={() => onSubmit({ title: "Fresh announcement" }, null)}>submit-new-announcement</button>
      <button type="button" onClick={() => onSubmit({ id: 7, title: "Pinned announcement" }, { id: 4, pinned: true, title: "Existing pinned" })}>submit-conflict</button>
      <button type="button" onClick={() => onDelete(7)}>delete-announcement</button>
    </div>
  );
}

export function ReportSocietyModalMock({ society, onClose, onReportSuccess }) {
  return (
    <div data-testid="report-modal">
      <span>{society?.name}</span>
      <button type="button" onClick={onClose}>close-report</button>
      <button type="button" onClick={onReportSuccess}>report-success</button>
    </div>
  );
}

export function MemberDirectoryModalMock({ societyName, isAdmin, onClose }) {
  return (
    <div data-testid="members-modal">
      <span>{societyName}</span>
      <span>{String(isAdmin)}</span>
      <button type="button" onClick={onClose}>close-members</button>
    </div>
  );
}

export function BackButtonMock({ onClick, label }) {
  return <button type="button" onClick={onClick}>{label}</button>;
}

export function SocietySkeletonMock() {
  return <div>Loading...</div>;
}

vi.mock("../../pages/societies/hooks/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => societyDetailPageStateMocks.useSocietyPageDataMock(...args),
  useSocietyInit: (...args) => societyDetailPageStateMocks.useSocietyInitMock(...args),
}));

vi.mock("../../components/society/society_detail/SocietyHero", () => ({ default: SocietyHeroMock }));
vi.mock("../../components/society/society_detail/SocietyInfo", () => ({ default: SocietyInfoMock }));
vi.mock("../../components/society/society_detail/tabs/SocietyTabs", () => ({ default: SocietyTabsMock }));
vi.mock("../../components/society/society_detail/SocietySidebar", () => ({ default: SocietySidebarMock }));
vi.mock("../../components/society/society_detail/image_handlers/CoverImageModal", () => ({ default: CoverImageModalMock }));
vi.mock("../../components/society/society_detail/image_handlers/ImageGalleryModal", () => ({ default: ImageGalleryModalMock }));
vi.mock("../../components/society/society_detail/SettingsModal", () => ({ default: SettingsModalMock }));
vi.mock("../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal", () => ({ default: AnnouncementModalMock }));
vi.mock("../../components/society/society_detail/ReportSocietyModal", () => ({ default: ReportSocietyModalMock }));
vi.mock("../../components/society/society_detail/MemberDirectoryModal", () => ({ default: MemberDirectoryModalMock }));
vi.mock("../../components/common/back_button/BackButton.jsx", () => ({ default: BackButtonMock }));
vi.mock("../../pages/societies/components/SocietySkeletons", () => ({ SocietyDetailSkeleton: SocietySkeletonMock }));

export function createSocietyDetailPageInteractiveOverrides() {
  return {
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
}

export function renderSocietyDetailPage(ui, { routeState } = {}) {
  const initialEntries = routeState ? [{ pathname: "/societies/1", state: routeState }] : ["/societies/1"];
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

export function createSocietyDetailPageData(overrides = {}) {
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
    society: createSocietyDefaults(societyOverrides),
    page: createPageDefaults(pageOverrides),
    modals: createModalDefaults(modalOverrides),
    subscription: createSubscriptionDefaults(subscriptionOverrides),
    tracker: createTrackerDefaults(trackerOverrides),
    members: [],
    ...createMutations(),
    ...rest,
  };
}
