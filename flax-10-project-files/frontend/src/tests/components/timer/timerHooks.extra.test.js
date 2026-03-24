import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const {
  saveSession,
  logTaskTime,
  playCompletionChime,
  useCompletionCheck,
  getProgress,
} = vi.hoisted(() => ({
  saveSession: vi.fn(),
  logTaskTime: vi.fn(),
  playCompletionChime: vi.fn(),
  useCompletionCheck: vi.fn(),
  getProgress: vi.fn(() => 42),
}));

vi.mock("../../../components/Timer/utils/historyUtils", () => ({
  saveSession: (...args) => saveSession(...args),
}));

vi.mock("../../../api/taskApi", () => ({
  logTaskTime: (...args) => logTaskTime(...args),
}));

vi.mock("../../../lib/sounds", () => ({
  playCompletionChime: (...args) => playCompletionChime(...args),
}));

vi.mock("../../../components/Timer/utils/timerUtils", () => ({
  useCompletionCheck: (...args) => useCompletionCheck(...args),
  getProgress: (...args) => getProgress(...args),
}));

import { useTimer } from "../../../components/Timer/hooks/useTimer";
import { useTimerFlow } from "../../../components/Timer/hooks/useTimerFlow";
import { useTimerHandlers } from "../../../components/Timer/hooks/useTimerHandlers";
import { useTimerPopupEffects } from "../../../components/Timer/hooks/useTimerPopupEffects";

describe("timer hook extras", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates timer settings for work, break, and sessions branches", () => {
    const { result } = renderHook(() => useTimer(25, 5, 4));

    act(() => result.current.updateTime("work", 30));
    expect(result.current.workTime).toBe(30);
    expect(result.current.timeLeft).toBe(30 * 60);

    act(() => {
      result.current.setMode("break");
    });
    act(() => {
      result.current.updateTime("break", 8);
    });
    expect(result.current.breakTime).toBe(8);
    expect(result.current.timeLeft).toBe(8 * 60);

    act(() => result.current.updateTime("sessions", 6));
    expect(result.current.targetSessions).toBe(6);

    act(() => {
      result.current.setIsActive(true);
      result.current.togglePause();
      result.current.updateTime("break", 10);
    });
    expect(result.current.timeLeft).toBe((8 + (10 - 8)) * 60);
  });

  it("covers timer flow actions including addDistraction, auto-break, and goal handling", async () => {
    const timer = {
      completedSessions: 0,
      targetSessions: 1,
      totalWork: 1800,
      totalBreak: 300,
      totalPaused: 120,
      task: "Essay",
      activeTaskId: 9,
      activeTaskMeta: { moduleCode: "CS101" },
      workTime: 25,
      setCompletedSessions: vi.fn(),
      updateSettings: vi.fn(),
      setMode: vi.fn(),
      setTimeLeft: vi.fn(),
      setIsActive: vi.fn(),
      resetTimer: vi.fn(),
    };

    const { result } = renderHook(() => useTimerFlow(timer, vi.fn()));
    act(() => result.current.addDistraction());
    expect(result.current.distractionCount).toBe(1);

    act(() => result.current.onWorkComplete());
    expect(playCompletionChime).toHaveBeenCalledWith(0.3);
    expect(timer.setMode).toHaveBeenCalledWith("break");
    expect(timer.setTimeLeft).toHaveBeenCalledWith(300);
    expect(timer.setIsActive).toHaveBeenCalledWith(true);

    act(() => result.current.autoBreakDone());
    expect(saveSession).toHaveBeenCalled();
    expect(logTaskTime).toHaveBeenCalledWith(9, 30);
    expect(timer.setCompletedSessions).toHaveBeenCalledWith(1);
    expect(timer.updateSettings).toHaveBeenCalledWith({ totalWork: 0, totalBreak: 0, totalPaused: 0 });
    expect(result.current.modal).toBe("goal");

    act(() => result.current.resetTimer());
    expect(timer.resetTimer).toHaveBeenCalled();
  });

  it("covers finishEarly and autoBreakDone no-op branches", async () => {
    const timer = {
      completedSessions: 1,
      targetSessions: 4,
      totalWork: 0,
      totalBreak: 0,
      totalPaused: 0,
      task: "",
      activeTaskId: null,
      activeTaskMeta: null,
      workTime: 25,
      setCompletedSessions: vi.fn(),
      updateSettings: vi.fn(),
      setMode: vi.fn(),
      setTimeLeft: vi.fn(),
      setIsActive: vi.fn(),
      resetTimer: vi.fn(),
    };

    const { result } = renderHook(() => useTimerFlow(timer, vi.fn()));
    act(() => result.current.autoBreakDone());
    expect(saveSession).not.toHaveBeenCalled();

    await act(async () => {
      result.current.endEarly();
    });
    expect(timer.resetTimer).toHaveBeenCalled();
  });

  it("covers popup effect timers and handler branches", async () => {
    const t = {
      setIsActive: vi.fn(),
      completedSessions: 0,
      targetSessions: 4,
      workTime: 25,
      breakTime: 5,
      setMode: vi.fn(),
      setTimeLeft: vi.fn(),
      resetTimer: vi.fn(),
    };
    const setModal = vi.fn();
    const startNext = vi.fn();
    const resetBlockId = vi.fn();
    const endEarly = vi.fn();

    const handlers = useTimerHandlers(t, "break", setModal, startNext, resetBlockId, endEarly);
    handlers.break();
    expect(t.setMode).toHaveBeenCalledWith("break");
    expect(t.setTimeLeft).toHaveBeenCalledWith(5 * 60);

    const goalHandlers = useTimerHandlers({ ...t, completedSessions: 3, targetSessions: 4 }, "goal", setModal, startNext, resetBlockId, endEarly);
    goalHandlers.break();
    goalHandlers.goal();
    goalHandlers.overtimeBreak();
    goalHandlers.autoBreakDone();
    goalHandlers.endEarly();
    expect(startNext).toHaveBeenCalled();
    expect(t.resetTimer).toHaveBeenCalled();
    expect(resetBlockId).toHaveBeenCalled();
    expect(endEarly).toHaveBeenCalled();

    localStorage.setItem("timerAutoStart", "true");
    const breakHandler = vi.fn();
    const autoBreakDone = vi.fn();

    renderHook(() => useTimerPopupEffects({
      modal: "break",
      handlers: { break: breakHandler, autoBreakDone },
      isActive: false,
      timeLeft: 100,
    }));
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(breakHandler).toHaveBeenCalled();

    renderHook(() => useTimerPopupEffects({
      modal: "autoBreak",
      handlers: { break: breakHandler, autoBreakDone },
      isActive: true,
      timeLeft: 0,
    }));
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(autoBreakDone).toHaveBeenCalled();
  });

  it("builds timer logic state and applies task estimates when task metadata changes", async () => {
    vi.resetModules();
    const timerState = {
      timeLeft: 0,
      mode: "work",
      updateTime: vi.fn(),
      setCompletedSessions: vi.fn(),
      setMode: vi.fn(),
      setTimeLeft: vi.fn(),
      workTime: 25,
      breakTime: 5,
      targetSessions: 4,
    };
    const flowState = {
      modal: "goal",
      setModal: vi.fn(),
      startNext: vi.fn(),
      resetBlockId: vi.fn(),
      endEarly: vi.fn(),
    };
    const handlers = { break: vi.fn() };
    const notify = vi.fn();

    vi.doMock("../../../components/Notifications/hooks/useNotify", () => ({
      useNotify: () => notify,
    }));
    vi.doMock("../../../components/Timer/hooks/useTimer", () => ({
      useTimer: () => timerState,
    }));
    vi.doMock("../../../components/Timer/hooks/useTimerFlow", () => ({
      useTimerFlow: vi.fn(() => flowState),
    }));
    vi.doMock("../../../components/Timer/hooks/useTimerHandlers", () => ({
      useTimerHandlers: vi.fn(() => handlers),
    }));

    const { useTimerLogic } = await import("../../../components/Timer/hooks/useTimerLogic");
    const { result, rerender } = renderHook(
      ({ activeTaskId, meta }) => useTimerLogic(activeTaskId, vi.fn(), meta),
      {
        initialProps: {
          activeTaskId: 7,
          meta: {
            title: "Essay draft",
            estimatedWorkMinutes: 45,
            estimatedSessionCount: 3,
          },
        },
      },
    );

    await act(async () => {});
    expect(result.current.task).toBe("Essay draft");
    expect(result.current.handlers).toBe(handlers);
    expect(result.current.progress).toBe(42);
    expect(result.current.isOvertime).toBe(true);
    expect(result.current.isBreakOvertime).toBe(false);
    expect(timerState.updateTime).toHaveBeenCalledWith("sessions", 3);
    expect(timerState.updateTime).toHaveBeenCalledWith("work", 45);
    expect(timerState.setCompletedSessions).toHaveBeenCalledWith(0);
    expect(timerState.setMode).toHaveBeenCalledWith("work");
    expect(timerState.setTimeLeft).toHaveBeenCalledWith(45 * 60);

    timerState.updateTime.mockClear();
    rerender({
      activeTaskId: 7,
      meta: {
        title: "Essay draft",
        estimatedBlocks: 2,
      },
    });
    await act(async () => {});
    expect(timerState.updateTime).toHaveBeenCalledTimes(0);

    rerender({
      activeTaskId: 7,
      meta: {
        title: "Revision set",
        estimatedBlocks: 2,
      },
    });
    await act(async () => {});
    expect(timerState.updateTime).toHaveBeenCalledWith("sessions", 1);
    expect(timerState.updateTime).toHaveBeenCalledWith("work", 50);

    timerState.updateTime.mockClear();
    rerender({
      activeTaskId: 8,
      meta: {
        title: null,
        estimatedBlocks: 0,
      },
    });
    await act(async () => {});
    expect(timerState.updateTime).not.toHaveBeenCalled();
    vi.doUnmock("../../../components/Notifications/hooks/useNotify");
    vi.doUnmock("../../../components/Timer/hooks/useTimer");
    vi.doUnmock("../../../components/Timer/hooks/useTimerFlow");
    vi.doUnmock("../../../components/Timer/hooks/useTimerHandlers");
  });
});
