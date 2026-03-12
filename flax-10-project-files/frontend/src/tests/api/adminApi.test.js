import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api/client", () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from "../../api/client";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchTeacherRequests,
  resolveTeacherRequest,
  fetchReportedSocieties,
  dismissReport,
  fetchPendingRatifications,
  approveRatification,
  rejectRatification,
  requestTeacherRole,
} from "../../api/adminApi";

beforeEach(() => vi.clearAllMocks());

describe("adminApi – users", () => {
  it("fetchAdminUsers calls /admin/users/", () => {
    fetchApi.mockResolvedValue([]);
    fetchAdminUsers();
    expect(fetchApi).toHaveBeenCalledWith("/admin/users/");
  });

  it("banUser calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    banUser(1, "Spam");
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/users/1/ban/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("banUser sends correct action and reason in body", () => {
    fetchApi.mockResolvedValue({});
    banUser(1, "Spam");
    const body = JSON.parse(fetchApi.mock.calls[0][1].body);
    expect(body).toEqual({ action: "ban", reason: "Spam" });
  });

  it("unbanUser calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    unbanUser(2);
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/users/2/ban/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("unbanUser sends unban action in body", () => {
    fetchApi.mockResolvedValue({});
    unbanUser(2);
    const body = JSON.parse(fetchApi.mock.calls[0][1].body);
    expect(body.action).toBe("unban");
  });
});

describe("adminApi – teacher requests", () => {
  it("fetchTeacherRequests calls /admin/teacher-requests/", () => {
    fetchApi.mockResolvedValue([]);
    fetchTeacherRequests();
    expect(fetchApi).toHaveBeenCalledWith("/admin/teacher-requests/");
  });

  it("resolveTeacherRequest calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    resolveTeacherRequest(3, "approve");
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/teacher-requests/3/resolve/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resolveTeacherRequest sends decision in body", () => {
    fetchApi.mockResolvedValue({});
    resolveTeacherRequest(3, "reject");
    const body = JSON.parse(fetchApi.mock.calls[0][1].body);
    expect(body).toEqual({ decision: "reject" });
  });

  it("requestTeacherRole calls /request-teacher-role/ with POST", () => {
    fetchApi.mockResolvedValue({});
    requestTeacherRole();
    expect(fetchApi).toHaveBeenCalledWith(
      "/request-teacher-role/",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
