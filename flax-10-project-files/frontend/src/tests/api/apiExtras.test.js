import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/client", () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from "../../api/client";
import { cancelCourseChangeRequest } from "../../api/adminApi";
import { authService } from "../../api/authenticationApi";
import { getCalendarEvents } from "../../api/calendarApi";
import { createSchedule, deleteSchedule, renameSchedule } from "../../api/scheduleApi";
import { getUserSettings, searchUsers } from "../../api/userApi";

describe("api extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("covers admin and calendar api branches", async () => {
    fetchApi.mockResolvedValueOnce(null);
    await cancelCourseChangeRequest();
    expect(fetchApi).toHaveBeenCalledWith("/course-change/my-request/", { method: "DELETE" });

    fetchApi.mockResolvedValueOnce([]);
    await getCalendarEvents();
    expect(fetchApi).toHaveBeenCalledWith("/calendar/events/map/");
  });

  it("covers schedule and user api branches", async () => {
    fetchApi.mockResolvedValue({});
    await createSchedule({ title: "S1" });
    await renameSchedule(1, "S2");
    await deleteSchedule(1);
    expect(fetchApi).toHaveBeenCalledWith("/schedules/", expect.objectContaining({ method: "POST" }));
    expect(fetchApi).toHaveBeenCalledWith("/schedules/1/", expect.objectContaining({ method: "PATCH" }));
    expect(fetchApi).toHaveBeenCalledWith("/schedules/1/", { method: "DELETE" });

    fetchApi.mockResolvedValueOnce({ settings: { theme: "light" } });
    await expect(getUserSettings()).resolves.toEqual({ theme: "light" });
  });

  it("covers user search with complex query params", async () => {
    fetchApi.mockResolvedValueOnce({});
    await searchUsers("u", "C", "S", 0, 1, "Y", "r", "name-desc");
    expect(fetchApi).toHaveBeenLastCalledWith(expect.stringContaining("q=u"));
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("course=C");
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("ordering=-name");
  });

  it("covers auth logout without token and fetch client error fallback", async () => {
    vi.resetModules();
    vi.doUnmock("../../api/client");
    const { fetchApi: actualFetchApi } = await import("../../api/client");
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ ok: true }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ non_field_errors: "plain string" }),
      });

    await authService.logout();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/auth/logout/"),
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );

    await expect(actualFetchApi("/broken")).rejects.toThrow("plain string");
  });
});
