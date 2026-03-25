import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyPreset,
  applyTaskToTimer,
  getPresetDurationTag,
  getPresetIcon,
  inferTaskType,
  isPresetActive,
} from "../../../components/Timer/utils/presetUtils";

describe("presetUtils", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("classifies task titles by keyword family", () => {
    expect(inferTaskType("Build thesis report")).toBe("lab");
    expect(inferTaskType("Practice quiz questions")).toBe("problem");
    expect(inferTaskType("Read lecture notes")).toBe("reading");
    expect(inferTaskType("Weekly admin")).toBe("general");
  });

  it("checks preset activation and applies preset timings", () => {
    const timer = {
      workTime: 25,
      breakTime: 5,
      targetSessions: 4,
      updateTime: vi.fn(),
    };
    const preset = { id: "pomodoro", work: 25, brk: 5, sessions: 4 };

    expect(isPresetActive(preset, timer)).toBe(true);
    expect(isPresetActive({ ...preset, sessions: 3 }, timer)).toBe(false);

    applyPreset({ work: 52, brk: 17, sessions: 3 }, timer);
    expect(timer.updateTime).toHaveBeenNthCalledWith(1, "work", 52);
    expect(timer.updateTime).toHaveBeenNthCalledWith(2, "break", 17);
    expect(timer.updateTime).toHaveBeenNthCalledWith(3, "sessions", 3);
  });

  it("returns preset icons and duration tags", () => {
    expect(getPresetIcon({ id: "pomodoro" })).toBe("⏱️");
    expect(getPresetIcon({ id: "5217" })).toBe("🌊");
    expect(getPresetIcon({ id: "ultradian" })).toBe("🧠");
    expect(getPresetIcon({ id: "deepwork" })).toBe("🎯");
    expect(getPresetIcon({ id: "sprint" })).toBe("⚡");
    expect(getPresetIcon({ id: "evening" })).toBe("🌙");
    expect(getPresetIcon({ id: "custom" })).toBe("⚙️");
    expect(getPresetDurationTag({ work: 45, brk: 10 })).toBe("45/10");
  });

  it("applies task timings and labels to the timer", () => {
    const timer = { updateTime: vi.fn(), setTimeLeft: vi.fn(), setTask: vi.fn(), setActiveTaskId: vi.fn() };
    const task = { id: 7, title: "Lab report", estimated_blocks: 13 };
    applyTaskToTimer(task, timer);
    expect(timer.setTask).toHaveBeenCalledWith("Lab report");
    expect(timer.updateTime).toHaveBeenCalledWith("work", 325);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(325 * 60);
  });

  it("persists enriched task metadata to active-task state and session storage", () => {
    const timer = { setActiveTaskId: vi.fn(), updateTime: vi.fn(), setTimeLeft: vi.fn(), setTask: vi.fn() };
    const task = { id: 7, title: "Lab report", module_code: "CS1", due_date: "2026-04-01", list_color: "#f00" };
    applyTaskToTimer(task, timer);
    expect(timer.setActiveTaskId).toHaveBeenCalledWith(7, expect.objectContaining({ title: "Lab report", moduleCode: "CS1", categoryColor: "#f00" }));
    expect(sessionStorage.getItem("timerTaskId")).toBe("7");
  });

  it("still applies timer values when no active-task setter is provided", () => {
    const timer = {
      setTask: vi.fn(),
      updateTime: vi.fn(),
      setTimeLeft: vi.fn(),
    };

    applyTaskToTimer(
      { id: 9, title: "Read article", estimated_blocks: 2, list_color: "#22c55e" },
      timer,
    );

    expect(timer.setTask).toHaveBeenCalledWith("Read article");
    expect(timer.updateTime).toHaveBeenNthCalledWith(1, "work", 25);
    expect(timer.updateTime).toHaveBeenNthCalledWith(2, "sessions", 2);
    expect(timer.setTimeLeft).toHaveBeenCalledWith(25 * 60);
    expect(sessionStorage.getItem("timerTaskId")).toBe("9");
  });

  it("covers empty metadata fallbacks for icons, task titles, and estimated blocks", () => {
    expect(inferTaskType(null)).toBe("general");
    expect(inferTaskType()).toBe("general");
    expect(getPresetIcon()).toBe("⚙️");

    const timer = {
      setTask: vi.fn(),
      updateTime: vi.fn(),
      setTimeLeft: vi.fn(),
      setActiveTaskId: vi.fn(),
    };

    applyTaskToTimer(
      {
        id: 12,
        title: "General admin",
        estimated_blocks: 0,
        list_color: "#000",
        module_code: "",
        due_date: "",
        list_name: "",
      },
      timer,
    );

    expect(timer.setActiveTaskId).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        moduleCode: null,
        dueDate: null,
        listName: null,
        estimatedBlocks: 1,
      }),
    );
  });
});
