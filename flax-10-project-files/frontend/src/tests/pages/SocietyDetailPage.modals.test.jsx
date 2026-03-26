<<<<<<< HEAD
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSocietyDetailPageData,
  createSocietyDetailPageInteractiveOverrides,
  renderSocietyDetailPage,
  societyDetailPageStateMocks,
} from "./societyDetailPageTestUtils.jsx";

import SocietyDetailPage from "../../pages/Societies/SocietyDetailPage";

function renderInteractivePage(overrides = {}, props = {}) {
  const baseOverrides = createSocietyDetailPageInteractiveOverrides();
  const data = createSocietyDetailPageData({
    ...overrides,
    modals: { ...baseOverrides.modals, ...overrides.modals },
    society: { ...baseOverrides.society, ...overrides.society },
  });
  societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(data);
  renderSocietyDetailPage(<SocietyDetailPage societyId={1} {...props} />);
  return data;
}

function buildEditModeData({ editMode, publishChanges }) {
  return createSocietyDetailPageData({
    modals: {
      editMode,
      setEditMode: vi.fn(),
    },
    tracker: {
      hasChanges: vi.fn(() => true),
      getChangeSummary: vi.fn(() => ["updated-announcement"]),
      resetChanges: vi.fn(),
    },
    publishChanges,
  });
=======
/**
 * Exercises SocietyDetailPage modal interactions with mocked page state.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { mergeNested } from "../utils/testBuilderUtils";
import { buildPageData } from "./societyDetailPageTestUtils";

const useSocietyPageDataMock = vi.fn();

vi.mock("../../pages/societies/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => useSocietyPageDataMock(...args),
  useSocietyInit: vi.fn(),
}));

vi.mock("../../components/society/society_detail/SocietyHero", () => ({
  default: ({ society, onUpdateName, onImageClick, onEditImages }) => (
    <div data-testid="hero">
      <span>{society.name}</span>
      <button type="button" onClick={() => onUpdateName("Renamed Society")}>rename-society</button>
      <button type="button" onClick={() => onImageClick(1)}>open-gallery</button>
      <button type="button" onClick={onEditImages}>edit-images</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/SocietyInfo", () => ({
  default: ({ onViewMembers, onToggleEditMode }) => (
    <div data-testid="info">
      <button type="button" onClick={onViewMembers}>view-members</button>
      <button type="button" onClick={onToggleEditMode}>toggle-edit-mode</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/tabs/SocietyTabs", () => ({
  default: ({ focusAnnouncementId, onEditAnnouncement }) => (
    <div data-testid="tabs">
      <span>{focusAnnouncementId || "no-focus"}</span>
      <button type="button" onClick={() => onEditAnnouncement({ id: 7 })}>edit-announcement</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/SocietySidebar", () => ({
  default: () => <div data-testid="sidebar">sidebar</div>,
}));

vi.mock("../../components/society/society_detail/image_handlers/CoverImageModal", () => ({
  default: ({ onClose, onUpdate }) => (
    <div data-testid="cover-modal">
      <button type="button" onClick={onClose}>close-cover</button>
      <button type="button" onClick={() => onUpdate(["img-1", "img-2"])}>save-cover</button>
      <button type="button" onClick={() => onUpdate([])}>save-empty-cover</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/image_handlers/ImageGalleryModal", () => ({
  default: ({ initialIndex, onClose }) => (
    <div data-testid="gallery-modal">
      <span>{initialIndex}</span>
      <button type="button" onClick={onClose}>close-gallery</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/SettingsModal", () => ({
  default: ({ onClose, onDelete }) => (
    <div data-testid="settings-modal">
      <button type="button" onClick={onClose}>close-settings</button>
      <button type="button" onClick={onDelete}>delete-society</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal", () => ({
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

vi.mock("../../components/society/society_detail/ReportSocietyModal", () => ({
  default: ({ onClose, onReportSuccess }) => (
    <div data-testid="report-modal">
      <button type="button" onClick={onClose}>close-report</button>
      <button type="button" onClick={onReportSuccess}>report-success</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/MemberDirectoryModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="members-modal">
      <button type="button" onClick={onClose}>close-members</button>
    </div>
  ),
}));

vi.mock("../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
}));

vi.mock("../../pages/societies/SocietySkeletons", () => ({
  SocietyDetailSkeleton: () => <div>Loading...</div>,
}));

import SocietyDetailPage from "../../pages/societies/SocietyDetailPage";

function renderPage(ui, { routeState } = {}) {
  const initialEntries = routeState ? [{ pathname: "/societies/1", state: routeState }] : ["/societies/1"];
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function renderDetailPageWithData(overrides = {}, props = {}) {
  const data = mergeNested(buildPageData(), overrides, ["modals", "society", "page", "subscription", "tracker"]);
  useSocietyPageDataMock.mockReturnValue(data);
  renderPage(<SocietyDetailPage societyId={1} {...props} />);
  return data;
>>>>>>> origin/main
}

function clickByText(text) {
  fireEvent.click(screen.getByText(text));
}

describe("SocietyDetailPage Modals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("modal workflows", () => {
    it("handles basic entry points and reporting", () => {
      const data = renderInteractivePage();
      clickByText("rename-society");
      clickByText("open-gallery");
      clickByText("edit-images");
      clickByText("view-members");
      clickByText("edit-announcement");

      expect(data.updateSociety).toHaveBeenCalledWith({ name: "Renamed Society" });
      expect(data.modals.setGalleryOpen).toHaveBeenCalledWith({ index: 1 });
      expect(data.modals.setShowCoverModal).toHaveBeenCalledWith(true);
      expect(data.modals.setShowMembersModal).toHaveBeenCalledWith(true);
      expect(data.modals.setEditingAnnouncement).toHaveBeenCalledWith({ id: 7 });

      fireEvent.click(screen.getByText("report-success"));
      expect(data.updateLocalSociety).toHaveBeenCalledWith({ has_reported: true });
    });

    it("handles modal closing states", () => {
      const data = renderInteractivePage();
      fireEvent.click(screen.getByText("close-report"));
      fireEvent.click(screen.getByText("close-gallery"));
      fireEvent.click(screen.getByText("close-cover"));
      fireEvent.click(screen.getByText("close-members"));
      fireEvent.click(screen.getByText("close-announcement"));

      expect(data.modals.setShowReportModal).toHaveBeenCalledWith(false);
      expect(data.modals.setGalleryOpen).toHaveBeenCalledWith(null);
      expect(data.modals.setShowCoverModal).toHaveBeenCalledWith(false);
      expect(data.modals.setShowMembersModal).toHaveBeenCalledWith(false);
      expect(data.modals.setEditingAnnouncement).toHaveBeenCalledWith(null);
    });

    it("handles cover image and announcement persistence", () => {
      const data = renderInteractivePage();
      fireEvent.click(screen.getByText("save-cover"));
      expect(data.updateSociety).toHaveBeenCalledWith({ images: ["img-1", "img-2"], image: "img-1" });
      fireEvent.click(screen.getByText("save-empty-cover"));
      expect(data.updateSociety).toHaveBeenCalledWith({ images: [], image: null });

      fireEvent.click(screen.getByText("submit-announcement"));
      fireEvent.click(screen.getByText("submit-new-announcement"));
      fireEvent.click(screen.getByText("delete-announcement"));
      expect(data.updateAnnouncement).toHaveBeenCalledWith(7, { id: 7, title: "Updated announcement" }, false);
      expect(data.addAnnouncement).toHaveBeenCalledWith({ title: "Fresh announcement" }, false);
      expect(data.deleteAnnouncement).toHaveBeenCalledWith(7, false);
    });

    it("handles settings and society deletion", async () => {
      const onBack = vi.fn();
      const onDelete = vi.fn();
      const data = renderInteractivePage({}, { onBack, onDelete });

      fireEvent.click(screen.getByText("close-settings"));
      expect(data.modals.setShowSettings).toHaveBeenCalledWith(false);

      fireEvent.click(screen.getByText("delete-society"));
      await waitFor(() => expect(data.deleteSociety).toHaveBeenCalledTimes(1));
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  it("publishes tracked changes before leaving edit mode", async () => {
    const data = buildEditModeData({ editMode: true, publishChanges: vi.fn().mockResolvedValue({}) });
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(data);

    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    fireEvent.click(screen.getByText("toggle-edit-mode"));

    await waitFor(() => expect(data.publishChanges).toHaveBeenCalledWith(["updated-announcement"]));
    expect(data.tracker.resetChanges).toHaveBeenCalledTimes(1);
    expect(data.modals.setEditMode).toHaveBeenCalledWith(false);
  });

  it("toggles edit mode without publishing when it is not already editing", () => {
    const data = buildEditModeData({ editMode: false, publishChanges: vi.fn() });
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(data);

    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("toggle-edit-mode"));

    expect(data.publishChanges).not.toHaveBeenCalled();
    expect(data.modals.setEditMode).toHaveBeenCalledWith(true);
  });
});
