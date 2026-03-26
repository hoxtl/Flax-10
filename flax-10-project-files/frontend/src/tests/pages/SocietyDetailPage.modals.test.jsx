/**
 * Exercises SocietyDetailPage modal interactions with mocked page state.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { mergeNested } from "../utils/testBuilderUtils";
import { buildPageData } from "./societyDetailPageTestUtils";

const useSocietyPageDataMock = vi.fn();

vi.mock("../../pages/Societies/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => useSocietyPageDataMock(...args),
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

function renderPage(ui, { routeState } = {}) {
  const initialEntries = routeState ? [{ pathname: "/societies/1", state: routeState }] : ["/societies/1"];
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function renderDetailPageWithData(overrides = {}, props = {}) {
  const data = mergeNested(buildPageData(), overrides, ["modals", "society", "page", "subscription", "tracker"]);
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

describe("SocietyDetailPage Modals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("modal workflows", () => {
    it("handles basic entry points and reporting", () => {
      const data = renderDetailPageWithData(interactiveOverrides);
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
      const data = renderDetailPageWithData(interactiveOverrides);
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
      const data = renderDetailPageWithData(interactiveOverrides);
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
      const data = renderDetailPageWithData(interactiveOverrides, { onBack, onDelete });

      fireEvent.click(screen.getByText("close-settings"));
      expect(data.modals.setShowSettings).toHaveBeenCalledWith(false);

      fireEvent.click(screen.getByText("delete-society"));
      await waitFor(() => expect(data.deleteSociety).toHaveBeenCalledTimes(1));
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  it("publishes tracked changes before leaving edit mode", async () => {
    const data = buildPageData({
      modals: {
        editMode: true,
        setEditMode: vi.fn(),
      },
      tracker: {
        hasChanges: vi.fn(() => true),
        getChangeSummary: vi.fn(() => ["updated-announcement"]),
        resetChanges: vi.fn(),
      },
      publishChanges: vi.fn().mockResolvedValue({}),
    });
    useSocietyPageDataMock.mockReturnValue(data);

    renderPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    fireEvent.click(screen.getByText("toggle-edit-mode"));

    await waitFor(() => expect(data.publishChanges).toHaveBeenCalledWith(["updated-announcement"]));
    expect(data.tracker.resetChanges).toHaveBeenCalledTimes(1);
    expect(data.modals.setEditMode).toHaveBeenCalledWith(false);
  });

  it("toggles edit mode without publishing when it is not already editing", () => {
    const data = buildPageData({
      modals: {
        editMode: false,
        setEditMode: vi.fn(),
      },
      tracker: {
        hasChanges: vi.fn(() => true),
        getChangeSummary: vi.fn(() => ["updated-announcement"]),
        resetChanges: vi.fn(),
      },
      publishChanges: vi.fn(),
    });
    useSocietyPageDataMock.mockReturnValue(data);

    renderPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText("toggle-edit-mode"));

    expect(data.publishChanges).not.toHaveBeenCalled();
    expect(data.modals.setEditMode).toHaveBeenCalledWith(true);
  });
});
