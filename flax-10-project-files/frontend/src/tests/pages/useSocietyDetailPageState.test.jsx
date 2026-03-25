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

const renderSocietyState = (entry, tab = null, onMembershipChange = vi.fn()) =>
  renderHook(() => useSocietyPageData(5, tab, onMembershipChange), { wrapper: createWrapper(entry) });

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

  it("initializes page data and handlers from route state", () => {
    const onMembershipChange = vi.fn();
    const { result } = renderSocietyState({ pathname: "/societies/5", state: { activeTab: "members" }, search: "?announcementId=44" }, null, onMembershipChange);
    expect(useSocietyDetailMock).toHaveBeenCalledWith(5, onMembershipChange);
    expect(useSocietySubscriptionMock).toHaveBeenCalledWith(5, detailData.society, detailData.updateLocalSociety);
    expect(result.current.page.activeTab).toBe("members");
    expect(result.current.page.focusAnnouncementId).toBe("44");
    expect(result.current.handleUnreport).toBe(handleUnreport);
    expect(result.current.subscription).toBe(subscription);
    expect(result.current.onAddTag).toBe(detailData.addTag);
    expect(result.current.onDeleteTag).toBe(detailData.deleteTag);
    expect(result.current.onUpdateTag).toBe(detailData.updateTag);
  });

  it("handles tab navigation within useSocietyPageData", async () => {
    const { result } = renderSocietyState({ pathname: "/societies/5" });
    act(() => result.current.page.handleTabChange("calendar", "99"));
    await waitFor(() => {
      expect(result.current.page.activeTab).toBe("calendar");
      expect(result.current.page.focusAnnouncementId).toBe("99");
    });
  });

  it("proxies event edit actions through the tracker in edit mode", async () => {
    const { result } = renderSocietyState({ pathname: "/societies/5" });
    act(() => result.current.modals.setEditMode(true));
    await act(async () => {
      await result.current.addEvent({ title: "Mixer" });
      await result.current.updateEvent(3, { title: "Updated" });
      await result.current.deleteEvent(4, "Deleted");
    });
    expect(detailData.addEvent).toHaveBeenCalledWith({ title: "Mixer" }, true);
    expect(detailData.updateEvent).toHaveBeenCalledWith(3, { title: "Updated" }, true);
    expect(detailData.deleteEvent).toHaveBeenCalledWith(4, true);
    expect(tracker.trackEvent).toHaveBeenCalledWith("Added", "Mixer");
    expect(tracker.trackEvent).toHaveBeenCalledWith("Updated", "Updated");
    expect(tracker.trackEvent).toHaveBeenCalledWith("Deleted", "Deleted");
  });

  it("proxies announcement and exception actions in edit mode", async () => {
    const { result } = renderSocietyState({ pathname: "/societies/5" });
    act(() => result.current.modals.setEditMode(true));
    await act(async () => {
      await result.current.addAnnouncement({ title: "Notice" });
      await result.current.updateAnnouncement(6, { title: "Pinned" });
      await result.current.deleteAnnouncement(7, "Weekly Update");
      await result.current.addException(8, "2026-01-01");
    });
    expect(detailData.addAnnouncement).toHaveBeenCalledWith({ title: "Notice" }, true);
    expect(detailData.updateAnnouncement).toHaveBeenCalledWith(6, { title: "Pinned" }, true);
    expect(detailData.deleteAnnouncement).toHaveBeenCalledWith(7, true);
    expect(detailData.addException).toHaveBeenCalledWith(8, "2026-01-01", true);
    expect(tracker.trackAnnouncement).toHaveBeenCalledWith("Added", "Notice");
    expect(tracker.trackAnnouncement).toHaveBeenCalledWith("Updated", "Pinned");
    expect(tracker.trackAnnouncement).toHaveBeenCalledWith("Deleted", "Weekly Update");
  });

  it("updates local society state when unreport callback triggers", () => {
    renderSocietyState({ pathname: "/societies/5" });
    capturedUnreportCallback(5, { has_reported: false });
    expect(detailData.updateLocalSociety).toHaveBeenCalledWith({ has_reported: false });
  });

  describe("location state fallbacks", () => {
    const entry = {
      pathname: "/societies/5",
      state: { activeTab: "members", announcementId: "state-2" },
    };

    it("hydrates tab defaults and toggles modal state", () => {
      const { result } = renderSocietyState(entry);
      const { page } = result.current;
      expect(page.activeTab).toBe("members");
      expect(page.focusAnnouncementId).toBe("state-2");
      const toggles = [
        ["setEditMode", "editMode"],
        ["setGalleryOpen", "galleryOpen"],
        ["setShowCoverModal", "showCoverModal"],
        ["setShowSettings", "showSettings"],
        ["setShowReportModal", "showReportModal"],
        ["setShowMembersModal", "showMembersModal"],
      ];
      act(() => toggles.forEach(([setter]) => result.current.modals[setter](true)));
      toggles.forEach(([_, key]) => expect(result.current.modals[key]).toBe(true));
      act(() => result.current.modals.setEditingAnnouncement({ id: 9 }));
      expect(result.current.modals.editingAnnouncement).toEqual({ id: 9 });
    });
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
