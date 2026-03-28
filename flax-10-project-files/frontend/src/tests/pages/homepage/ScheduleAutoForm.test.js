import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildScheduleAutoForm,
  getUrgencyTier,
} from "../../../pages/homepage/utils/scheduleAutoForm";

describe("scheduleAutoForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("classifies urgency tiers across invalid, overdue, critical, urgent, upcoming, and distant dates", () => {
    expect(getUrgencyTier("bad-date")).toBeNull();
    expect(getUrgencyTier("2026-02-28T12:00:00.000Z")).toBe("overdue");
    expect(getUrgencyTier("2026-03-03T12:00:00.000Z")).toBe("critical");
    expect(getUrgencyTier("2026-03-06T12:00:00.000Z")).toBe("urgent");
    expect(getUrgencyTier("2026-03-10T12:00:00.000Z")).toBe("upcoming");
    expect(getUrgencyTier("2026-03-25T12:00:00.000Z")).toBe("distant");
  });

  it("returns null for missing, empty, or unschedulable deadlines", () => {
    expect(buildScheduleAutoForm()).toBeNull();
    expect(buildScheduleAutoForm({ deadlines: [] })).toBeNull();
    expect(
      buildScheduleAutoForm({
        deadlines: [
          null,
          { id: null, start_due_date: "2026-03-02T12:00:00.000Z" },
          { id: 1, start_due_date: "2026-02-28T12:00:00.000Z" },
          { id: 2, start_due_date: "" },
        ],
      }),
    ).toBeNull();
  });

  it("builds sorted deadline preferences with urgency-based study minutes", () => {
    const form = buildScheduleAutoForm({
      deadlines: [
        { id: "7", start_due_date: "2026-03-20T12:00:00.000Z" },
        { id: 3, start_due_date: "2026-03-02T12:00:00.000Z" },
        { id: 5, start_due_date: "2026-03-07T12:00:00.000Z" },
      ],
    });

    expect(form).toEqual({
      title: "Homepage auto schedule 01/03/2026",
      clear_existing: true,
      deadline_preferences: [
        { deadline_id: 3, ideal_minutes_per_day: 75 },
        { deadline_id: 5, ideal_minutes_per_day: 45 },
        { deadline_id: 7, ideal_minutes_per_day: 30 },
      ],
    });
  });
});
