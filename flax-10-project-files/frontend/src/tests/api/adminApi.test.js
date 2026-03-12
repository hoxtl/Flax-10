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