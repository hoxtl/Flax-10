import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getUpcomingDeadlinesMock = vi.fn();
const toastMock = vi.fn();

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlinesMock(...args),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

import { useUpcomingDeadlines } from "../../../components/Schedules/auto/useUpcomingDeadlines";

describe("useUpcomingDeadlines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads upcoming deadlines on mount", async () => {
    getUpcomingDeadlinesMock.mockResolvedValue([{ id: 1, title: "Essay" }]);

    const { result } = renderHook(() => useUpcomingDeadlines());

    await waitFor(() => expect(result.current.deadlines).toEqual([{ id: 1, title: "Essay" }]));
    expect(result.current.showToast).toBe(toastMock);
  });

  it("shows a toast when loading deadlines fails", async () => {
    getUpcomingDeadlinesMock.mockRejectedValueOnce(new Error("nope"));

    const { result } = renderHook(() => useUpcomingDeadlines());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("Unable to load upcoming deadlines.", { variant: "error" }),
    );
    expect(result.current.deadlines).toEqual([]);
  });
});
