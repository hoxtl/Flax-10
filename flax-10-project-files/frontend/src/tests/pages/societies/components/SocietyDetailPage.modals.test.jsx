import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSocietyDetailPageData,
  createSocietyDetailPageInteractiveOverrides,
  renderSocietyDetailPage,
  societyDetailPageStateMocks,
} from "./societyDetailPageTestUtils.jsx";

import SocietyDetailPage from "../../../../pages/societies/components/SocietyDetailPage";

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
      fireEvent.click(screen.getByText("submit-conflict"));
      fireEvent.click(screen.getByText("delete-announcement"));
      expect(data.updateAnnouncement).toHaveBeenCalledWith(4, { id: 4, pinned: false, title: "Existing pinned" }, false);
      expect(data.updateAnnouncement).toHaveBeenCalledWith(7, { id: 7, title: "Updated announcement" }, false);
      expect(data.updateAnnouncement).toHaveBeenCalledWith(7, { id: 7, title: "Pinned announcement" }, false);
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
