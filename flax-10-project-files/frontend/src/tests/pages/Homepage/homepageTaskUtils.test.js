import { describe, expect, it, vi, beforeEach } from "vitest";

const getTaskDurationMinutesMock = vi.fn();
const getTasksThatFitWindowMock = vi.fn();

vi.mock("../../../lib/focusPlanner", () => ({
  getTaskDurationMinutes: (...args) => getTaskDurationMinutesMock(...args),
  getTasksThatFitWindow: (...args) => getTasksThatFitWindowMock(...args),
}));

import {
  calculateSeedsByCategory,
  getTasksThatFitGap,
  isAutoPassedTask,
  isRoutineOrEventTask,
  taskDurationMins,
} from "../../../pages/homepage/utils/taskUtils";

describe("homepageTaskUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTaskDurationMinutesMock.mockImplementation((task) => task.mockDuration ?? 25);
    getTasksThatFitWindowMock.mockImplementation((tasks, gapMinutes) => (tasks || []).filter((task) => (task.fitMinutes ?? 0) <= gapMinutes));
  });

  const getTag = (tagId) => ({ 1: { label: "routine" }, 2: { label: "wellness" }, 3: { label: "event" }, 4: { label: "academic" }, 5: { label: "personal" } }[tagId] || null);

  it("delegates task duration mapping to the focus planner", () => {
    expect(taskDurationMins({ mockDuration: 50 })).toBe(50);
    expect(getTaskDurationMinutesMock).toHaveBeenCalled();
  });

  it("delegates fitting gap computations to the focus planner", () => {
    expect(getTasksThatFitGap([{ id: 1, fitMinutes: 20 }, { id: 2, fitMinutes: 40 }], 25)).toEqual([{ id: 1, fitMinutes: 20 }]);
    expect(getTasksThatFitWindowMock).toHaveBeenCalledWith([{ id: 1, fitMinutes: 20 }, { id: 2, fitMinutes: 40 }], 25);
  });

  it("identifies tasks functionally equivalent to routines and events", () => {
    expect(isRoutineOrEventTask(null, getTag)).toBe(false);
    expect(isRoutineOrEventTask({ title: "Essay", tag: 1 }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ tag_name: "event" }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ title: "Lecture" })).toBe(true);
    expect(isRoutineOrEventTask({ title: "Coffee run" }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ title: "Tutorial prep" }, getTag)).toBe(true);
    expect(isRoutineOrEventTask({ title: "Deep Work" }, getTag)).toBe(false);
  });

  it("calculates progress seeds clustered by functional category", () => {
    expect(calculateSeedsByCategory(null, getTag)).toEqual({ academic: 0, personal: 0 });
    expect(calculateSeedsByCategory([{ completed: true, title: "Admin task" }])).toEqual({ academic: 0, personal: 1 });
    expect(calculateSeedsByCategory([{ completed: true, title: "Revision", tag_name: "study" }])).toEqual({ academic: 1, personal: 0 });
    const tasks = [{ completed: true, title: "Essay", tag: 4 }, { completed: true, title: "Lunch", tag: 1 }, { completed: false, tag: 4 }];
    expect(calculateSeedsByCategory(tasks, getTag)).toEqual({ academic: 1, personal: 0 });
  });

  it("determines if routine tasks automatically pass based on current time", () => {
    expect(isAutoPassedTask({ title: "Essay" }, new Date("2026-03-24T10:00Z"), getTag)).toBe(false);
    expect(isAutoPassedTask({ title: "Lunch" }, new Date("2026-03-24T10:00Z"), getTag)).toBe(false);
    expect(isAutoPassedTask({ title: "Lunch", due_date: "2026-03-24T07:00Z" }, undefined, getTag)).toBe(true);
    expect(isAutoPassedTask({ title: "Lunch", due_date: "2026-03-24T09:00Z" }, new Date("2026-03-24T10:00Z"), getTag)).toBe(true);
    expect(isAutoPassedTask({ title: "Lunch", due_date: "2026-03-24T11:00Z" }, new Date("2026-03-24T10:00Z"), getTag)).toBe(false);
  });
});
