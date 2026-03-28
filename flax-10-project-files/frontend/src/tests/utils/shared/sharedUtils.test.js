import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const journeyPlanner = vi.fn();

vi.mock("../../../api/tflApi", () => ({
  tflService: {
    journeyPlanner: (...args) => journeyPlanner(...args),
  },
}));

import { formatForDateTimeInput } from "../../../utils/dateTimeInput";
import { getModuleCodePrefix, normalizeModuleCode } from "../../../utils/moduleCodeUtils";
import { getTravelTimeModule } from "../../../utils/tflTravelTime";

describe("shared utils", () => {
  const realFetch = global.fetch;
  const toLocalInputValue = (value) => {
    const date = typeof value === "string" ? new Date(value) : value;
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it("formats date-time input values and defaults to the current moment", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:34:56.000Z"));

    expect(formatForDateTimeInput()).toMatch(/^2026-03-24T\d{2}:\d{2}$/);
    expect(formatForDateTimeInput()).toBe(
      new Date().toISOString().slice(0, 16),
    );
    expect(formatForDateTimeInput("2026-04-01T09:15:00.000Z")).toBe(
      toLocalInputValue("2026-04-01T09:15:00.000Z"),
    );
    expect(formatForDateTimeInput(new Date("2026-04-02T16:45:00.000Z"))).toBe(
      toLocalInputValue(new Date("2026-04-02T16:45:00.000Z")),
    );

    vi.useRealTimers();
  });

  it("normalizes module codes and extracts subject prefixes", () => {
    expect(normalizeModuleCode("  7ccsmaTH  ")).toBe("7CCSMATH");
    expect(normalizeModuleCode(null)).toBe("");
    expect(getModuleCodePrefix("7ccsmodl")).toBe("Other");
    expect(getModuleCodePrefix("math123")).toBe("MATH");
    expect(getModuleCodePrefix()).toBe("Other");
  });

  it("returns null when module travel inputs are incomplete", async () => {
    await expect(getTravelTimeModule(null, "Bush House")).resolves.toBeNull();
    await expect(getTravelTimeModule({ home_latitude: 51.5 }, "Bush House")).resolves.toBeNull();
    await expect(getTravelTimeModule({ home_latitude: 51.5, home_longitude: -0.1 }, "")).resolves.toBeNull();
  });

  it("returns null when geocoding or journey planning cannot produce a route", async () => {
    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ features: [] }),
    });

    await expect(getTravelTimeModule({ home_latitude: 51.5, home_longitude: -0.1 }, "Bush House")).resolves.toBeNull();

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ features: [{ center: [-0.12, 51.51] }] }),
    });
    journeyPlanner.mockResolvedValueOnce(null);

    await expect(getTravelTimeModule({ home_latitude: 51.5, home_longitude: -0.1 }, "Somerset House")).resolves.toBeNull();
    expect(journeyPlanner).toHaveBeenCalledWith(51.5, -0.1, 51.51, -0.12);
  });

  it("returns journey details on success and swallows downstream errors", async () => {
    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ features: [{ center: [-0.11, 51.52] }] }),
    });
    journeyPlanner.mockResolvedValueOnce({ duration: 27, legs: [{ mode: "tube" }] });

    await expect(getTravelTimeModule({ home_latitude: 51.5, home_longitude: -0.1 }, "Guy's Campus")).resolves.toEqual({
      duration: 27,
      legs: [{ mode: "tube" }],
    });

    global.fetch.mockRejectedValueOnce(new Error("boom"));
    await expect(getTravelTimeModule({ home_latitude: 51.5, home_longitude: -0.1 }, "KCL")).resolves.toBeUndefined();
  });
});
