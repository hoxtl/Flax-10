import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const getAttendanceStats = vi.fn();
const getAttendanceRecords = vi.fn();
const getEvents = vi.fn();
const buildRecordsByEventId = vi.fn((records) => new Map(records.map((record) => [record.event_id, record.attended])));
const buildTimetableDateRange = vi.fn(() => ({ start: "2026-03-01T00:00:00.000Z", end: "2026-03-31T00:00:00.000Z" }));
const isTimetableEvent = vi.fn((event) => event.keep === true);

vi.mock("../../../../api/attendanceApi", () => ({
  getAttendanceStats: (...args) => getAttendanceStats(...args),
  getAttendanceRecords: (...args) => getAttendanceRecords(...args),
}));

vi.mock("../../../../api/eventApi", () => ({
  getEvents: (...args) => getEvents(...args),
}));

vi.mock("../../../../pages/attendance/utils/attendanceRecords", () => ({
  buildRecordsByEventId: (...args) => buildRecordsByEventId(...args),
}));

vi.mock("../../../../pages/attendance/utils/attendanceTimetable", () => ({
  buildTimetableDateRange: (...args) => buildTimetableDateRange(...args),
  isTimetableEvent: (...args) => isTimetableEvent(...args),
}));

import { useAttendanceResource } from "../../../../pages/attendance/hooks/useAttendanceResource";
import { useAttendanceRecords } from "../../../../pages/attendance/hooks/useAttendanceRecords";
import { useAttendanceStats } from "../../../../pages/attendance/hooks/useAttendanceStats";
import { useTimetableEvents } from "../../../../pages/attendance/hooks/useTimetableEvents";

describe("attendance hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads attendance resources and supports manual refetch", async () => {
    const loader = vi.fn()
      .mockResolvedValueOnce(["first"])
      .mockResolvedValueOnce(["second"]);
    const { result } = renderHook(() => useAttendanceResource(loader, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["first"]);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.refetch();
    });

    expect(loader).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(["second"]);
  });

  it("stores the loader error message without throwing", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useAttendanceResource(loader, ["seed"]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["seed"]);
    expect(result.current.error).toBe("network down");
  });

  it("maps attendance stats into the expected shape", async () => {
    const stats = { overall: { attended: 5, missed: 1 } };
    getAttendanceStats.mockResolvedValue(stats);

    const { result } = renderHook(() => useAttendanceStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(stats);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("builds records state and falls back to an empty array for invalid payloads", async () => {
    getAttendanceRecords.mockResolvedValueOnce([
      { event_id: 1, attended: true },
      { event_id: 2, attended: false },
    ]).mockResolvedValueOnce({ invalid: true });

    const { result } = renderHook(() => useAttendanceRecords());

    await waitFor(() => expect(result.current.records).toHaveLength(2));
    expect(buildRecordsByEventId).toHaveBeenCalledWith([
      { event_id: 1, attended: true },
      { event_id: 2, attended: false },
    ]);
    expect(result.current.recordsByEventId.get(1)).toBe(true);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.records).toEqual([]);
    expect(result.current.recordsByEventId.size).toBe(0);
  });

  it("loads and filters timetable events while tolerating non-array responses", async () => {
    getEvents.mockResolvedValueOnce([
      { id: 1, keep: true },
      { id: 2, keep: false },
    ]).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useTimetableEvents());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(buildTimetableDateRange).toHaveBeenCalledTimes(1);
    expect(getEvents).toHaveBeenCalledWith({ start: "2026-03-01T00:00:00.000Z", end: "2026-03-31T00:00:00.000Z" });
    expect(isTimetableEvent).toHaveBeenCalledTimes(2);
    expect(result.current.events).toEqual([{ id: 1, keep: true }]);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.events).toEqual([]);
  });
});

describe("useAttendancePageModel", () => {
  it("builds the page model from composed hooks", async () => {
    vi.resetModules();
    const buildAttendancePageModel = vi.fn(() => ({ ready: true }));
    vi.doMock("../../../../pages/attendance/hooks/useAttendanceStats", () => ({ useAttendanceStats: () => ({}) }));
    vi.doMock("../../../../pages/attendance/hooks/useAttendanceRecords", () => ({ useAttendanceRecords: () => ({}) }));
    vi.doMock("../../../../pages/attendance/hooks/useTimetableEvents", () => ({ useTimetableEvents: () => ({}) }));
    vi.doMock("../../../../pages/attendance/utils/attendancePageModel", () => ({ buildAttendancePageModel }));

    const { useAttendancePageModel } = await import("../../../../pages/attendance/hooks/useAttendancePageModel");
    const { result } = renderHook(() => useAttendancePageModel());
    expect(result.current.ready).toBe(true);
    expect(buildAttendancePageModel).toHaveBeenCalled();
  });

  it("passes correct initial state to page model", async () => {
    vi.resetModules();
    const buildAttendancePageModel = vi.fn();
    vi.doMock("../../../../pages/attendance/utils/attendancePageModel", () => ({ buildAttendancePageModel }));
    const { useAttendancePageModel } = await import("../../../../pages/attendance/hooks/useAttendancePageModel");
    renderHook(() => useAttendancePageModel());
    expect(buildAttendancePageModel).toHaveBeenCalledWith(expect.objectContaining({ listTab: "record", selectedSegment: null }), expect.anything(), expect.anything(), expect.anything());
  });
});
