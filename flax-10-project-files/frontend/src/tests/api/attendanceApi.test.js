import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAttendanceRecords,
  getAttendanceStats,
  recordAttendance,
} from "../../api/attendanceApi";
import { fetchApi } from "../../api/client";

vi.mock("../../api/client", () => ({
  fetchApi: vi.fn(),
}));

describe("attendanceApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches attendance stats", async () => {
    await getAttendanceStats();
    expect(fetchApi).toHaveBeenCalledWith("/attendance/stats/");
  });

  it("fetches attendance records", async () => {
    await getAttendanceRecords();
    expect(fetchApi).toHaveBeenCalledWith("/attendance/records/");
  });

  it("records attended status by default", async () => {
    await recordAttendance(17);
    expect(fetchApi).toHaveBeenCalledWith("/attendance/record/", {
      method: "POST",
      body: JSON.stringify({ event_id: 17, attended: true }),
    });
  });

  it("records a missed status when attended is false", async () => {
    await recordAttendance(18, false);
    expect(fetchApi).toHaveBeenCalledWith("/attendance/record/", {
      method: "POST",
      body: JSON.stringify({ event_id: 18, attended: false }),
    });
  });
});
