import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/client", () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from "../../api/client";
import { banReportedSociety } from "../../api/adminApi";

describe("adminApi extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses an empty string when banReportedSociety is called without a reason", async () => {
    fetchApi.mockResolvedValue({});

    await banReportedSociety(11);

    expect(fetchApi).toHaveBeenCalledWith(
      "/admin/reports/11/ban/",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(fetchApi.mock.calls[0][1].body)).toEqual({ reason: "" });
  });
});
