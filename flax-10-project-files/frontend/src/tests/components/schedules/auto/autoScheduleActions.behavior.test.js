import { describe, expect, it, vi } from "vitest";

const buildScheduleAutoFormMock = vi.fn();

vi.mock("../../../../pages/homepage/utils/scheduleAutoForm", () => ({
  buildScheduleAutoForm: (...args) => buildScheduleAutoFormMock(...args),
}));

import { buildAutoSchedulePayload } from "../../../../components/schedules/auto/autoScheduleActions";

describe("autoScheduleActions coverage topups", () => {
  it("includes worktime preferences in the generated payload", () => {
    buildScheduleAutoFormMock.mockReturnValue({
      title: "Generated Plan",
      deadline_preferences: [{ id: 1 }],
    });

    expect(
      buildAutoSchedulePayload([{ id: 1 }], { worktime_preference: "deep-work" }, ""),
    ).toEqual({
      title: "Generated Plan",
      deadline_preferences: [{ id: 1 }],
      worktime_preference: "deep-work",
    });
  });
});
