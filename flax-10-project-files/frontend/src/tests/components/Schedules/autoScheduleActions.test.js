import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  buildScheduleAutoFormMock,
  createScheduleMock,
  getUpcomingDeadlinesMock,
  getUserSettingsMock,
} = vi.hoisted(() => ({
  buildScheduleAutoFormMock: vi.fn(),
  createScheduleMock: vi.fn(),
  getUpcomingDeadlinesMock: vi.fn(),
  getUserSettingsMock: vi.fn(),
}));

vi.mock("../../../api/scheduleApi", () => ({
  createSchedule: createScheduleMock,
}));

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: getUpcomingDeadlinesMock,
}));

vi.mock("../../../api/userApi", () => ({
  getUserSettings: getUserSettingsMock,
}));

vi.mock("../../../pages/Homepage/utils/ScheduleAutoForm", () => ({
  buildScheduleAutoForm: buildScheduleAutoFormMock,
}));

import {
  buildAutoSchedulePayload,
  loadScheduleSettings,
  loadUpcomingDeadlineItems,
  submitAutoScheduleWithPrefs,
} from "../../../components/Schedules/auto/autoScheduleActions";

describe("autoScheduleActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when an auto-schedule form cannot be built", () => {
    buildScheduleAutoFormMock.mockReturnValue(null);

    expect(buildAutoSchedulePayload([{ id: 1 }], null, "Revision Sprint")).toBeNull();
  });

  it("builds a payload with schedule preferences and falls back to the form title", () => {
    buildScheduleAutoFormMock.mockReturnValue({
      title: "Generated Plan",
      deadline_preferences: [{ ideal_minutes_per_day: 45 }],
      deadlines: [{ id: 1 }],
    });

    expect(
      buildAutoSchedulePayload(
        [{ id: 1 }],
        {
          wake_time: "07:30",
          sleep_time: "23:15",
          week_preference: "balanced",
          worktime_preference: "morning",
        },
        "",
      ),
    ).toEqual({
      title: "Generated Plan",
      deadline_preferences: [{ ideal_minutes_per_day: 45 }],
      deadlines: [{ id: 1 }],
      wake_time: "07:30",
      sleep_time: "23:15",
      week_preference: "balanced",
      worktime_preference: "morning",
    });
  });

  it("uses a custom title override when one is provided", () => {
    buildScheduleAutoFormMock.mockReturnValue({
      title: "Generated Plan",
      deadline_preferences: [],
    });

    expect(buildAutoSchedulePayload([], null, "Custom Title")).toEqual({
      title: "Custom Title",
      deadline_preferences: [],
    });
  });

  it("loads scheduling settings successfully", async () => {
    const settings = { wake_time: "08:00" };
    getUserSettingsMock.mockResolvedValue(settings);

    await expect(loadScheduleSettings(vi.fn())).resolves.toEqual(settings);
  });

  it("shows an error toast when scheduling settings fail to load", async () => {
    const showToast = vi.fn();
    getUserSettingsMock.mockRejectedValue(new Error("offline"));

    await expect(loadScheduleSettings(showToast)).resolves.toBeNull();
    expect(showToast).toHaveBeenCalledWith("Couldn't load scheduling settings.", { variant: "error" });
  });

  it("loads upcoming deadline items successfully", async () => {
    const deadlines = [{ id: 4, title: "Essay" }];
    getUpcomingDeadlinesMock.mockResolvedValue(deadlines);

    await expect(loadUpcomingDeadlineItems(vi.fn())).resolves.toEqual(deadlines);
  });

  it("shows an error toast when upcoming deadlines fail to load", async () => {
    const showToast = vi.fn();
    getUpcomingDeadlinesMock.mockRejectedValue(new Error("offline"));

    await expect(loadUpcomingDeadlineItems(showToast)).resolves.toEqual([]);
    expect(showToast).toHaveBeenCalledWith("Unable to load upcoming deadlines.", { variant: "error" });
  });

  it("stops and shows an error when there is no valid auto-schedule payload", async () => {
    const showToast = vi.fn();
    buildScheduleAutoFormMock.mockReturnValue(null);

    await expect(
      submitAutoScheduleWithPrefs({
        deadlines: [],
        settings: null,
        showToast,
        title: "Impossible Plan",
      }),
    ).resolves.toBeNull();

    expect(createScheduleMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("No upcoming deadlines to auto-schedule.", { variant: "error" });
  });

  it("creates a schedule, surfaces overwrite info, and runs onDone", async () => {
    const showToast = vi.fn();
    const onDone = vi.fn();
    const data = { id: 11, overwritten: true };

    buildScheduleAutoFormMock.mockReturnValue({
      title: "Generated Plan",
      deadline_preferences: [{ ideal_minutes_per_day: 50 }],
    });
    createScheduleMock.mockResolvedValue(data);

    await expect(
      submitAutoScheduleWithPrefs({
        deadlines: [{ id: 2 }],
        settings: { wake_time: "08:00" },
        showToast,
        title: "Morning Plan",
        onDone,
      }),
    ).resolves.toEqual(data);

    expect(createScheduleMock).toHaveBeenCalledWith({
      title: "Morning Plan",
      deadline_preferences: [{ ideal_minutes_per_day: 50 }],
      wake_time: "08:00",
    });
    expect(showToast).toHaveBeenNthCalledWith(1, "A schedule with this name existed and was replaced.", { variant: "info" });
    expect(showToast).toHaveBeenNthCalledWith(2, "Your auto schedule is ready.", { variant: "success" });
    expect(onDone).toHaveBeenCalledWith(data);
  });

  it("creates a schedule without an overwrite toast when nothing was replaced", async () => {
    const showToast = vi.fn();
    const data = { id: 12, overwritten: false };

    buildScheduleAutoFormMock.mockReturnValue({
      title: "Generated Plan",
      deadline_preferences: [],
    });
    createScheduleMock.mockResolvedValue(data);

    await expect(
      submitAutoScheduleWithPrefs({
        deadlines: [{ id: 3 }],
        settings: { sleep_time: "22:30" },
        showToast,
      }),
    ).resolves.toEqual(data);

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith("Your auto schedule is ready.", { variant: "success" });
  });
});
