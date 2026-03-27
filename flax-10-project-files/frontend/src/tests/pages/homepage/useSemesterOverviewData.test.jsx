import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getEventsMock = vi.fn();
const getUpcomingDeadlinesMock = vi.fn();

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlinesMock(...args),
}));

import {
  useSemesterData,
  useSemesterRange,
} from "../../../pages/homepage/components/useSemesterOverviewData";

describe("useSemesterOverviewData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses an explicit semester start by normalizing it to the week Monday", () => {
    const { result } = renderHook(() => useSemesterRange("2026-03-04T12:00:00.000Z", 4));

    expect(result.current.semStart.getDay()).toBe(1);
    expect(result.current.semStart.getDate()).toBe(2);
    expect(result.current.semEnd.getDay()).toBe(1);
    expect(result.current.semEnd.getDate()).toBe(30);
  });

  it("rolls Sunday semester starts back to the previous Monday", () => {
    const { result } = renderHook(() => useSemesterRange("2026-03-08T12:00:00.000Z", 1));

    expect(result.current.semStart.getDay()).toBe(1);
    expect(result.current.semStart.getDate()).toBe(2);
  });

  it("accepts string date inputs and normalizes non-array fetch responses to empty lists", async () => {
    getEventsMock.mockResolvedValueOnce({ unexpected: true });
    getUpcomingDeadlinesMock.mockResolvedValueOnce({ unexpected: true });

    const { result } = renderHook(() => useSemesterData("2026-01-01", "2026-04-01"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getEventsMock).toHaveBeenCalledWith({ start: "2026-01-01", end: "2026-04-01" });
    expect(result.current.events).toEqual([]);
    expect(result.current.deadlines).toEqual([]);
  });

  it("falls back to empty deadlines when the deadline fetch rejects", async () => {
    getEventsMock.mockResolvedValueOnce([{ id: 1 }]);
    getUpcomingDeadlinesMock.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() =>
      useSemesterData(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-04-01T00:00:00.000Z")),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toEqual([{ id: 1 }]);
    expect(result.current.deadlines).toEqual([]);
  });
});
