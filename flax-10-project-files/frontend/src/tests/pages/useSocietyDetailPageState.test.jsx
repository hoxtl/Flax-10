import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const useChangeTrackerMock = vi.fn();
const useSocietyDetailMock = vi.fn();
const useSocietySubscriptionMock = vi.fn();
const useUnreportSocietyMock = vi.fn();
const scrollContentToTopMock = vi.fn();

vi.mock("../../components/Society/hooks/useChangeTracker", () => ({
  useChangeTracker: (...args) => useChangeTrackerMock(...args),
}));

vi.mock("../../components/Society/hooks/useSocietyDetail", () => ({
  useSocietyDetail: (...args) => useSocietyDetailMock(...args),
}));

vi.mock("../../components/Society/hooks/useSocietySubscription", () => ({
  useSocietySubscription: (...args) => useSocietySubscriptionMock(...args),
}));

vi.mock("../../components/Society/hooks/useUnreportSociety", () => ({
  useUnreportSociety: (...args) => useUnreportSocietyMock(...args),
}));

vi.mock("../../pages/Societies/SocietyDetailPageUtils", async () => {
  const actual = await vi.importActual("../../pages/Societies/SocietyDetailPageUtils");
  return {
    ...actual,
    scrollContentToTop: (...args) => scrollContentToTopMock(...args),
  };
});

import { useSocietyInit, useSocietyPageData } from "../../pages/Societies/useSocietyDetailPageState";

function createWrapper(entry) {
  return function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
  };
}

describe("useSocietyDetailPageState", () => {
  let detailData;
  let tracker;
  let subscription;
  let handleUnreport;
  let capturedUnreportCallback;

  beforeEach(() => {
    vi.clearAllMocks();

    detailData = {
      society: { id: 5, name: "Drama Society", announcements: [], tags: ["arts"] },
      updateLocalSociety: vi.fn(),
      addEvent: vi.fn().mockResolvedValue({ id: 1 }),
      updateEvent: vi.fn().mockResolvedValue({ id: 2 }),
      deleteEvent: vi.fn().mockResolvedValue({}),
      addException: vi.fn().mockResolvedValue({}),
      addAnnouncement: vi.fn().mockResolvedValue({ id: 3 }),
      updateAnnouncement: vi.fn().mockResolvedValue({ id: 4 }),
      deleteAnnouncement: vi.fn().mockResolvedValue({}),
      addTag: vi.fn(),
      deleteTag: vi.fn(),
      updateTag: vi.fn(),
      joinSociety: vi.fn(),
      leaveSociety: vi.fn(),
      publishChanges: vi.fn(),
    };
    tracker = {
      trackEvent: vi.fn(),
      trackAnnouncement: vi.fn(),
      hasChanges: vi.fn(() => false),
      getChangeSummary: vi.fn(() => []),
      resetChanges: vi.fn(),
    };
    subscription = {
      isSubscribed: true,
      toggleSubscription: vi.fn(),
    };
    handleUnreport = vi.fn();

    useSocietyDetailMock.mockReturnValue(detailData);
    useChangeTrackerMock.mockReturnValue(tracker);
    useSocietySubscriptionMock.mockReturnValue(subscription);
    useUnreportSocietyMock.mockImplementation((callback) => {
      capturedUnreportCallback = callback;
      return handleUnreport;
    });
  });

  it("builds society page data from url params, router state, and wrapped handlers", async () => {
    const onMembershipChange = vi.fn();
    const wrapper = createWrapper({
      pathname: "/societies/5",
      search: "?tab=about&announcementId=44",
      state: { activeTab: "members" },
    });

    const { result } = renderHook(
      () => useSocietyPageData(5, "calendar", onMembershipChange),
      { wrapper },
    );

    expect(useSocietyDetailMock).toHaveBeenCalledWith(5, onMembershipChange);
    expect(useSocietySubscriptionMock).toHaveBeenCalledWith(5, detailData.society, detailData.updateLocalSociety);
    expect(result.current.page.activeTab).toBe("about");
    expect(result.current.page.focusAnnouncementId).toBe("44");
    expect(result.current.handleUnreport).toBe(handleUnreport);
    expect(result.current.subscription).toBe(subscription);
    expect(result.current.onAddTag).toBe(detailData.addTag);
    expect(result.current.onDeleteTag).toBe(detailData.deleteTag);
    expect(result.current.onUpdateTag).toBe(detailData.updateTag);

    act(() => {
      result.current.page.handleTabChange("calendar", "99");
    });

    await waitFor(() => {
      expect(result.current.page.activeTab).toBe("calendar");
      expect(result.current.page.focusAnnouncementId).toBe("99");
    });
  });

  it("falls back to location state and tracks silent edit-mode changes", async () => {
    const wrapper = createWrapper({
      pathname: "/societies/5",
      state: { activeTab: "members", announcementId: "state-2" },
    });

    const { result } = renderHook(() => useSocietyPageData(5, null, vi.fn()), { wrapper });

    expect(result.current.page.activeTab).toBe("members");
    expect(result.current.page.focusAnnouncementId).toBe("state-2");
    expect(result.current.modals.editMode).toBe(false);

    act(() => {
      result.current.modals.setEditMode(true);
      result.current.modals.setGalleryOpen(true);
      result.current.modals.setShowCoverModal(true);
      result.current.modals.setShowSettings(true);
      result.current.modals.setShowReportModal(true);
      result.current.modals.setShowMembersModal(true);
      result.current.modals.setEditingAnnouncement({ id: 9 });
    });

    expect(result.current.modals.editMode).toBe(true);
    expect(result.current.modals.galleryOpen).toBe(true);
    expect(result.current.modals.showCoverModal).toBe(true);
    expect(result.current.modals.showSettings).toBe(true);
    expect(result.current.modals.showReportModal).toBe(true);
    expect(result.current.modals.showMembersModal).toBe(true);
    expect(result.current.modals.editingAnnouncement).toEqual({ id: 9 });

    await act(async () => {
      await result.current.addEvent({ title: "Mixer" });
      await result.current.updateEvent(3, { title: "Updated Mixer" });
      await result.current.deleteEvent(4, "Launch Night");
      await result.current.addAnnouncement({ title: "Notice" });
      await result.current.updateAnnouncement(6, { title: "Pinned" });
      await result.current.deleteAnnouncement(7, "Weekly Update");
      await result.current.addException(8, "2026-03-30");
    });

    expect(detailData.addEvent).toHaveBeenCalledWith({ title: "Mixer" }, true);
    expect(detailData.updateEvent).toHaveBeenCalledWith(3, { title: "Updated Mixer" }, true);
    expect(detailData.deleteEvent).toHaveBeenCalledWith(4, true);
    expect(detailData.addAnnouncement).toHaveBeenCalledWith({ title: "Notice" }, true);
    expect(detailData.updateAnnouncement).toHaveBeenCalledWith(6, { title: "Pinned" }, true);
    expect(detailData.deleteAnnouncement).toHaveBeenCalledWith(7, true);
    expect(detailData.addException).toHaveBeenCalledWith(8, "2026-03-30", true);
    expect(tracker.trackEvent).toHaveBeenCalledWith("Added", "Mixer");
    expect(tracker.trackEvent).toHaveBeenCalledWith("Updated", "Updated Mixer");
    expect(tracker.trackEvent).toHaveBeenCalledWith("Deleted", "Launch Night");
    expect(tracker.trackAnnouncement).toHaveBeenCalledWith("Added", "Notice");
    expect(tracker.trackAnnouncement).toHaveBeenCalledWith("Updated", "Pinned");
    expect(tracker.trackAnnouncement).toHaveBeenCalledWith("Deleted", "Weekly Update");

    capturedUnreportCallback(5, { has_reported: false });
    expect(detailData.updateLocalSociety).toHaveBeenCalledWith({ has_reported: false });
  });

  it("scrolls content on init and only clears history state when requested", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    renderHook(() => useSocietyInit("calendar"), {
      wrapper: createWrapper("/societies/5"),
    });
    expect(scrollContentToTopMock).toHaveBeenCalledTimes(1);
    expect(replaceStateSpy).toHaveBeenCalledWith({}, document.title);

    renderHook(() => useSocietyInit(null), {
      wrapper: createWrapper("/societies/5"),
    });
    expect(scrollContentToTopMock).toHaveBeenCalledTimes(2);
    expect(replaceStateSpy).toHaveBeenCalledTimes(1);

    replaceStateSpy.mockRestore();
  });
});
