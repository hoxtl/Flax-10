/*
 * Shared test doubles for the society detail page.
 */

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { createFnMap, mergeNested } from "../utils/testBuilderUtils";

const societyDetailPageStateMocks = vi.hoisted(() => ({
  useSocietyPageDataMock: vi.fn(),
  useSocietyInitMock: vi.fn(),
}));

export { societyDetailPageStateMocks };

const MUTATION_NAMES = [
  "updateSociety",
  "updateLocalSociety",
  "fetchMembers",
  "removeMember",
  "deleteSociety",
  "updateAnnouncement",
  "addAnnouncement",
  "deleteAnnouncement",
  "addCollaborator",
  "requestRatification",
  "updateMemberRole",
  "publishChanges",
  "addEvent",
  "updateEvent",
  "deleteEvent",
  "addException",
  "onAddTag",
  "onDeleteTag",
  "onUpdateTag",
  "joinSociety",
  "leaveSociety",
  "handleUnreport",
];
const DETAIL_NESTED_KEYS = ["society", "page", "modals", "subscription", "tracker"];

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

const BASE_DETAIL_DATA = {
  loading: false,
  society: createSocietyDefaults(),
  page: createPageDefaults(),
  modals: createModalDefaults(),
  subscription: createSubscriptionDefaults(),
  tracker: createTrackerDefaults(),
  members: [],
};

function createMutations() {
  const mutations = createFnMap(MUTATION_NAMES);
  mutations.deleteSociety.mockResolvedValue({});
  mutations.publishChanges.mockResolvedValue({});
  return mutations;
}

function SocietyHeroMock({ society, onUpdateName, onImageClick, onEditImages }) {
  return (
    <div data-testid="hero">
      <span>{society.name}</span>
      <button type="button" onClick={() => onUpdateName("Renamed Society")}>rename-society</button>
      <button type="button" onClick={() => onImageClick(1)}>open-gallery</button>
      <button type="button" onClick={onEditImages}>edit-images</button>
    </div>
  );
}

function SocietyInfoMock({ onViewMembers, onToggleEditMode }) {
  return (
    <div data-testid="info">
      <button type="button" onClick={onViewMembers}>view-members</button>
      <button type="button" onClick={onToggleEditMode}>toggle-edit-mode</button>
    </div>
  );
}

function SocietyTabsMock({ focusAnnouncementId, onEditAnnouncement }) {
  return (
    <div data-testid="tabs">
      <span>{focusAnnouncementId || "no-focus"}</span>
      <button type="button" onClick={() => onEditAnnouncement({ id: 7 })}>edit-announcement</button>
    </div>
  );
}

function SocietySidebarMock() {
  return <div data-testid="sidebar">sidebar</div>;
}

function CoverImageModalMock({ images = [], onClose, onUpdate }) {
  return (
    <div data-testid="cover-modal">
      <span>{images.length}</span>
      <button type="button" onClick={onClose}>close-cover</button>
      <button type="button" onClick={() => onUpdate(["img-1", "img-2"])}>save-cover</button>
      <button type="button" onClick={() => onUpdate([])}>save-empty-cover</button>
    </div>
  );
}

function ImageGalleryModalMock({ images = [], initialIndex, onClose }) {
  return (
    <div data-testid="gallery-modal">
      <span>{images.length}</span>
      <span>{initialIndex}</span>
      <button type="button" onClick={onClose}>close-gallery</button>
    </div>
  );
}

function SettingsModalMock({ members = [], ratificationStatus, isRatified, isAdmin, onClose, onDelete }) {
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

function AnnouncementModalMock({ societyId, tags = [], onClose, onSubmit, onDelete }) {
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

function ReportSocietyModalMock({ society, onClose, onReportSuccess }) {
  return (
    <div data-testid="report-modal">
      <span>{society?.name}</span>
      <button type="button" onClick={onClose}>close-report</button>
      <button type="button" onClick={onReportSuccess}>report-success</button>
    </div>
  );
}

function MemberDirectoryModalMock({ societyName, isAdmin, onClose }) {
  return (
    <div data-testid="members-modal">
      <span>{societyName}</span>
      <span>{String(isAdmin)}</span>
      <button type="button" onClick={onClose}>close-members</button>
    </div>
  );
}

function BackButtonMock({ onClick, label }) {
  return <button type="button" onClick={onClick}>{label}</button>;
}

function SocietySkeletonMock() {
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

/** Builds the open-modal overrides used by interaction tests. */
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

/** Renders the society detail page inside a memory router. */
export function renderSocietyDetailPage(ui, { routeState } = {}) {
  const initialEntries = routeState ? [{ pathname: "/societies/1", state: routeState }] : ["/societies/1"];
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function createModalTestSociety(overrides = {}) {
  return createSocietyDefaults({
    name: "Drama Society",
    role: "editor",
    is_admin: true,
    images: [{ url: "cover-1" }, { url: "cover-2" }],
    tags: ["arts", "events"],
    ratification_status: "pending",
    is_ratified: false,
    ...overrides,
  });
}

function createOpenModalDefaults(overrides = {}) {
  return createModalDefaults({
    showSettings: true,
    showReportModal: true,
    galleryOpen: { index: 1 },
    showCoverModal: true,
    showMembersModal: true,
    editingAnnouncement: { id: 9 },
    ...overrides,
  });
}

/** Builds default society detail page hook data for tests. */
export function createSocietyDetailPageData(overrides = {}) {
  return {
    ...mergeNested(BASE_DETAIL_DATA, overrides, DETAIL_NESTED_KEYS),
    ...createMutations(),
  };
}

/** Builds society detail data with every modal open for prop tests. */
export function createSocietyDetailPageModalData(overrides = {}) {
  return createSocietyDetailPageData({
    ...overrides,
    members: overrides.members ?? [{ id: 1 }, { id: 2 }],
    society: createModalTestSociety(overrides.society),
    page: createPageDefaults(overrides.page),
    modals: createOpenModalDefaults(overrides.modals),
    subscription: createSubscriptionDefaults(overrides.subscription),
    tracker: createTrackerDefaults(overrides.tracker),
  });
}
