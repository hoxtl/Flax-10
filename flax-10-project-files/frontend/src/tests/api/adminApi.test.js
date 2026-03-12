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
