import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/client", () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from "../../api/client";
import { cancelCourseChangeRequest } from "../../api/adminApi";
import { authService } from "../../api/authApi";
import { getCalendarEvents } from "../../api/calendarApi";
import { createSchedule, deleteSchedule, renameSchedule } from "../../api/scheduleApi";
import { getUserSettings, searchUsers } from "../../api/userApi";

describe("api extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("covers remaining admin, calendar, schedule, and user api branches", async () => {
    fetchApi.mockResolvedValueOnce(null);
    await cancelCourseChangeRequest();
    expect(fetchApi).toHaveBeenCalledWith("/course-change/my-request/", { method: "DELETE" });

    fetchApi.mockResolvedValueOnce([]);
    await getCalendarEvents();
    expect(fetchApi).toHaveBeenCalledWith("/calendar/events/map/");

    fetchApi.mockResolvedValueOnce({});
    await createSchedule({ title: "Autumn" });
    await renameSchedule(4, "Spring");
    await deleteSchedule(9);
    expect(fetchApi).toHaveBeenNthCalledWith(3, "/schedules/", expect.objectContaining({ method: "POST" }));
    expect(fetchApi).toHaveBeenNthCalledWith(4, "/schedules/4/", expect.objectContaining({ method: "PATCH" }));
    expect(fetchApi).toHaveBeenNthCalledWith(5, "/schedules/9/", { method: "DELETE" });

    fetchApi.mockResolvedValueOnce({ settings: { theme: "dark" } });
    await expect(getUserSettings()).resolves.toEqual({ theme: "dark" });

    fetchApi.mockResolvedValueOnce({});
    await searchUsers("ava", "Computer Science", "Chess", 10, 5, "Year 2", "admin", "name-desc");
    expect(fetchApi).toHaveBeenLastCalledWith(
      expect.stringContaining("q=ava"),
    );
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("course=Computer%20Science");
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("society=Chess");
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("offset=10&limit=5");
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("year=Year%202");
    expect(fetchApi.mock.calls.at(-1)[0]).toContain("role=admin");
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
