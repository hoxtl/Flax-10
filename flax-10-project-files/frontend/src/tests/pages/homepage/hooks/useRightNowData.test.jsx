import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getHomeAddressMock = vi.fn();
const journeyPlannerMock = vi.fn();
const resolveCampusFromTextMock = vi.fn();
const getCurrentBlockMock = vi.fn();
const getNextEventMock = vi.fn();
const formatTimeLeftMock = vi.fn();
const getLeaveByInfoMock = vi.fn();
const hasCampusCommuteMock = vi.fn();
const useCountdownMock = vi.fn();

vi.mock("../../../../api/userApi", () => ({
  getHomeAddress: () => getHomeAddressMock(),
}));

vi.mock("../../../../api/tflApi", () => ({
  tflService: {
    journeyPlanner: (...args) => journeyPlannerMock(...args),
  },
}));

vi.mock("../../../../lib/kclCampuses", () => ({
  resolveCampusFromText: (...args) => resolveCampusFromTextMock(...args),
}));

vi.mock("@/pages/homepage/components/rightNowUtils", () => ({
  formatTimeLeft: (...args) => formatTimeLeftMock(...args),
  getCurrentBlock: (...args) => getCurrentBlockMock(...args),
  getLeaveByInfo: (...args) => getLeaveByInfoMock(...args),
  getNextEvent: (...args) => getNextEventMock(...args),
  hasCampusCommute: (...args) => hasCampusCommuteMock(...args),
}));

vi.mock("../../../../pages/homepage/hooks/useCountdown", () => ({
  useCountdown: (...args) => useCountdownMock(...args),
}));

import { useRightNowData } from "@/pages/homepage/hooks/useRightNowData.js";

describe("useRightNowData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formatTimeLeftMock.mockReturnValue("20m left");
    useCountdownMock.mockReturnValue("45m");
    getCurrentBlockMock.mockReturnValue(null);
    getNextEventMock.mockReturnValue(null);
    getLeaveByInfoMock.mockReturnValue({ leaveBy: "09:10" });
    hasCampusCommuteMock.mockReturnValue(true);
    resolveCampusFromTextMock.mockReturnValue({ name: "Strand", coords: [-0.116, 51.511] });
    getHomeAddressMock.mockResolvedValue({ home_latitude: "51.5", home_longitude: "-0.12" });
    journeyPlannerMock.mockResolvedValue({ duration: 22 });
  });

  const setupCtx = () => {
    const cb = { id: "current", start_time: "2026-03-25T09:00:00Z", end_time: "2026-03-25T10:00:00Z" };
    const ne = { id: "next", title: "Lecture", location: "Strand Campus", start_time: "2026-03-25T11:00:00Z", end_time: "2026-03-25T12:00:00Z" };
    getCurrentBlockMock.mockReturnValue(cb);
    getNextEventMock.mockReturnValue(ne);
    return { cb, ne };
  };

  it("derives timeline state securely mapping current gaps to next events", async () => {
    const { cb, ne } = setupCtx();
    const { result } = renderHook(() => useRightNowData({ isToday: true, navigatorContext: { overlaps: [{ id: 1 }], state: "now" }, now: new Date("2026-03-25T09:30:00Z"), sortedEvents: [cb, ne], taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }], tflDelays: [{ lineName: "Northern" }] }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentBlock).toEqual(cb);
    expect(result.current.nextEvent).toEqual(ne);
    expect(result.current.countdown).toBe("45m");
    expect(result.current.timeLeftStr).toBe("20m left");
    expect(result.current.timeRangeStr).toBe("09:00 – 10:00");
  });

  it("computes accurate transit commute bounds targeting the active campus", async () => {
    const { cb, ne } = setupCtx();
    const { result } = renderHook(() => useRightNowData({ isToday: true, navigatorContext: { overlaps: [{ id: 1 }], state: "now" }, now: new Date("2026-03-25T09:30:00Z"), sortedEvents: [cb, ne], taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }], tflDelays: [{ lineName: "Northern" }] }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentProgressPct).toBe(50);
    expect(result.current.commuteInfo).toEqual({ duration: 22 });
    expect(result.current.nextCampus).toEqual({ name: "Strand", coords: [-0.116, 51.511] });
    expect(result.current.leaveByInfo).toEqual({ leaveBy: "09:10" });
    expect(journeyPlannerMock).toHaveBeenCalledWith(51.5, -0.12, 51.511, -0.116);
  });

  it("collects operational summaries across events tasks and warnings", async () => {
    const { cb, ne } = setupCtx();
    const { result } = renderHook(() => useRightNowData({ isToday: true, navigatorContext: { overlaps: [{ id: 1 }], state: "now" }, now: new Date("2026-03-25T09:30:00Z"), sortedEvents: [cb, ne], taskWidgetItemsOnly: [{ id: 1, completed: false }, { id: 2, completed: true }], tflDelays: [{ lineName: "Northern" }] }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.showTfl).toBe(true);
    expect(result.current.conflicts).toEqual([{ id: 1 }]);
    expect(result.current.eventCount).toBe(2);
    expect(result.current.tasksPending).toBe(1);
    expect(result.current.isEmptyDay).toBe(false);
    expect(result.current.isEndOfDay).toBe(false);
  });

  it("handles non-today and failing commute data without showing transport alerts", async () => {
    getHomeAddressMock.mockRejectedValue(new Error("no home"));

    const { result } = renderHook(() =>
      useRightNowData({
        isToday: false,
        navigatorContext: { state: "endOfDay" },
        now: null,
        sortedEvents: [],
        taskWidgetItemsOnly: [],
        tflDelays: [{ lineName: "" }],
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.commuteInfo).toBe(null);
    expect(result.current.nextCampus).toEqual({ name: "Strand", coords: [-0.116, 51.511] });
    expect(result.current.leaveByInfo).toBe(null);
    expect(result.current.showTfl).toBe(false);
    expect(result.current.isEmptyDay).toBe(false);
    expect(result.current.isEndOfDay).toBe(true);
    expect(journeyPlannerMock).not.toHaveBeenCalled();
  });

  it("skips commute data for off-campus events", async () => {
    hasCampusCommuteMock.mockReturnValue(false);
    resolveCampusFromTextMock.mockReturnValue(null);
    const ne = { id: "n", title: "L", location: "Off", start_time: "2026-03-25T11:00:00Z" };
    getNextEventMock.mockReturnValue(ne);
    const { result } = renderHook(() => useRightNowData({
      isToday: true, now: new Date("2026-03-25T09:30:00Z"), sortedEvents: [ne],
      navigatorContext: { state: "now" }, taskWidgetItemsOnly: [], tflDelays: [],
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaveByInfo).toBeNull();
    expect(result.current.showTfl).toBe(false);
    expect(journeyPlannerMock).not.toHaveBeenCalled();
  });

  it("uses safe fallbacks for missing props and the Date.now branch", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1711111111111);
    getCurrentBlockMock.mockReturnValue(null);
    getNextEventMock.mockReturnValue(null);

    const { result } = renderHook(() =>
      useRightNowData({
        isToday: true,
        now: "not-a-date",
        tflDelays: [{ lineName: "" }],
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.eventCount).toBe(0);
    expect(result.current.tasksPending).toBe(0);
    expect(result.current.isEmptyDay).toBe(true);
    expect(result.current.isEndOfDay).toBe(false);
    expect(result.current.conflicts).toEqual([]);
    expect(result.current.showTfl).toBe(false);
    expect(result.current.timeLeftStr).toBeNull();
    expect(nowSpy).toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  it("suppresses leave-by info when transport delays have no named lines", async () => {
    const ne = { id: "next", title: "Lecture", location: "Strand Campus", start_time: "2026-03-25T11:00:00Z" };
    getNextEventMock.mockReturnValue(ne);

    const { result } = renderHook(() =>
      useRightNowData({
        isToday: true,
        now: new Date("2026-03-25T09:30:00Z"),
        sortedEvents: [ne],
        taskWidgetItemsOnly: [],
        tflDelays: [{ lineName: "" }],
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaveByInfo).toBeNull();
    expect(result.current.showTfl).toBe(false);
  });

  it("returns a null journey when the home address lookup fails during an active commute fetch", async () => {
    const ne = { id: "next", title: "Lecture", location: "Strand Campus", start_time: "2026-03-25T11:00:00Z" };
    getNextEventMock.mockReturnValue(ne);
    getHomeAddressMock.mockRejectedValueOnce(new Error("missing home"));

    const { result } = renderHook(() =>
      useRightNowData({
        isToday: true,
        now: new Date("2026-03-25T09:30:00Z"),
        sortedEvents: [ne],
        taskWidgetItemsOnly: [],
        tflDelays: [{ lineName: "Northern" }],
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.commuteInfo).toBeNull();
    expect(journeyPlannerMock).not.toHaveBeenCalled();
  });

  it("does not update commute state after the hook unmounts", async () => {
    let resolveJourney;
    const journeyPromise = new Promise((resolve) => {
      resolveJourney = resolve;
    });
    const ne = { id: "next", title: "Lecture", location: "Strand Campus", start_time: "2026-03-25T11:00:00Z" };
    getNextEventMock.mockReturnValue(ne);
    journeyPlannerMock.mockReturnValueOnce(journeyPromise);

    const { unmount } = renderHook(() =>
      useRightNowData({
        isToday: true,
        now: new Date("2026-03-25T09:30:00Z"),
        sortedEvents: [ne],
        taskWidgetItemsOnly: [],
        tflDelays: [{ lineName: "Northern" }],
      }),
    );

    unmount();
    resolveJourney({ duration: 18 });
    await journeyPromise;

    expect(journeyPlannerMock).toHaveBeenCalled();
  });

  it("handles undefined delays and invalid home coordinates without planning a journey", async () => {
    const ne = { id: "next", title: "Lecture", location: "Strand Campus", start_time: "2026-03-25T11:00:00Z" };
    getNextEventMock.mockReturnValue(ne);
    getHomeAddressMock.mockResolvedValue({ home_latitude: "abc", home_longitude: undefined });
    journeyPlannerMock.mockClear();

    const { result } = renderHook(() =>
      useRightNowData({
        isToday: true,
        now: new Date("2026-03-25T09:30:00Z"),
        sortedEvents: [ne],
        taskWidgetItemsOnly: [],
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaveByInfo).toBeNull();
    expect(result.current.commuteInfo).toBeNull();
    expect(journeyPlannerMock).not.toHaveBeenCalled();
  });
});
