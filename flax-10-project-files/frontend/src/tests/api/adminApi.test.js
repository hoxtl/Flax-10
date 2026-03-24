import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../api/client", () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from "../../api/client";
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchReportedSocieties,
  dismissReport,
  banReportedSociety,
  fetchPendingRatifications,
  approveRatification,
  rejectRatification,
  fetchCourseChangeRequests,
  resolveCourseChangeRequest,
  requestCourseChange,
  getMyCourseChangeRequest,
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

describe("adminApi – reported societies", () => {
  it("fetchReportedSocieties calls /admin/reported-societies/", () => {
    fetchApi.mockResolvedValue([]);
    fetchReportedSocieties();
    expect(fetchApi).toHaveBeenCalledWith("/admin/reported-societies/");
  });

  it("dismissReport calls correct endpoint with DELETE", () => {
    fetchApi.mockResolvedValue(undefined);
    dismissReport(7);
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/reports/7/dismiss/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("banReportedSociety calls correct endpoint with POST and reason", () => {
    fetchApi.mockResolvedValue({});
    banReportedSociety(7, "Hate speech");
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/reports/7/ban/",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchApi.mock.calls[0][1].body);
    expect(body).toEqual({ reason: "Hate speech" });
  });
});

describe("adminApi – ratifications", () => {
  it("fetchPendingRatifications calls correct endpoint", () => {
    fetchApi.mockResolvedValue([]);
    fetchPendingRatifications();
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/societies/pending-ratifications/",
    );
  });

  it("approveRatification calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    approveRatification(5);
    expect(fetchApi).toHaveBeenCalledWith(
      "/societies/5/ratification/approve/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejectRatification calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    rejectRatification(5);
    expect(fetchApi).toHaveBeenCalledWith(
      "/societies/5/ratification/reject/",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("adminApi – course change", () => {
  it("fetchCourseChangeRequests calls correct endpoint", () => {
    fetchApi.mockResolvedValue([]);
    fetchCourseChangeRequests();
    expect(fetchApi).toHaveBeenCalledWith("/admin/course-change-requests/");
  });

  it("resolveCourseChangeRequest calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    resolveCourseChangeRequest(3, "approve");
    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/course-change-requests/3/resolve/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("requestCourseChange calls correct endpoint with POST", () => {
    fetchApi.mockResolvedValue({});
    requestCourseChange("Physics");
    expect(fetchApi).toHaveBeenCalledWith(
      "/course-change/request/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getMyCourseChangeRequest calls correct endpoint", () => {
    fetchApi.mockResolvedValue(null);
    getMyCourseChangeRequest();
    expect(fetchApi).toHaveBeenCalledWith("/course-change/my-request/");
  });
});
