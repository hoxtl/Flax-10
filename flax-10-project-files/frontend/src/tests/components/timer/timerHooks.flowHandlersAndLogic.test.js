/**
 * Covers supplemental timer hook paths and dynamic timer-logic mocks.
 */

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

vi.mock("../../../components/timer/utils/historyUtils", () => ({
  saveSession: (...args) => saveSession(...args),
}));

vi.mock("../../../api/taskApi", () => ({
  logTaskTime: (...args) => logTaskTime(...args),
}));

vi.mock("../../../lib/sounds", () => ({
  playCompletionChime: (...args) => playCompletionChime(...args),
}));

vi.mock("../../../components/timer/utils/timerUtils", () => ({
  useCompletionCheck: (...args) => useCompletionCheck(...args),
  getProgress: (...args) => getProgress(...args),
}));

import { useTimer } from "../../../components/timer/hooks/useTimer";
import { useTimerFlow } from "../../../components/timer/hooks/useTimerFlow";
import { useTimerHandlers } from "../../../components/timer/hooks/useTimerHandlers";
import { useTimerPopupEffects } from "../../../components/timer/hooks/useTimerPopupEffects";

describe("timer hook extras", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useTimer", () => {
    it("updates work time and remaining seconds", () => {
      const { result } = renderHook(() => useTimer(25, 5, 4));
      act(() => result.current.updateTime("work", 30));
      expect(result.current.workTime).toBe(30);
      expect(result.current.timeLeft).toBe(30 * 60);
    });

    it("syncs break duration when switching modes", () => {
      const { result } = renderHook(() => useTimer(25, 5, 4));
      act(() => result.current.setMode("break"));
      act(() => result.current.updateTime("break", 8));
      expect(result.current.breakTime).toBe(8);
      expect(result.current.timeLeft).toBe(8 * 60);
    });

    it("updates session targets without clobbering active timer", () => {
      const { result } = renderHook(() => useTimer(25, 5, 4));
      act(() => result.current.updateTime("sessions", 6));
      expect(result.current.targetSessions).toBe(6);
      act(() => {
        result.current.setIsActive(true);
        result.current.togglePause();
        result.current.updateTime("break", 10);
      });
      expect(result.current.timeLeft).toBe(25 * 60);
    });
  });

  describe("useTimerFlow", () => {
    it("shifts to break mode when work completes", () => {
      const timer = buildTimerState();
      const { result } = renderHook(() => useTimerFlow(timer, vi.fn()));
      act(() => result.current.onWorkComplete());
      expect(playCompletionChime).toHaveBeenCalledWith(0.3);
      expect(timer.setMode).toHaveBeenCalledWith("break");
      expect(timer.setTimeLeft).toHaveBeenCalledWith(300);
    });

    it("logs sessions and opens goal modal after auto break", async () => {
      const timer = buildTimerState();
      const { result } = renderHook(() => useTimerFlow(timer, vi.fn()));
      act(() => result.current.onWorkComplete());
      await act(async () => result.current.autoBreakDone());
      expect(saveSession).toHaveBeenCalled();
      expect(logTaskTime).toHaveBeenCalledWith(9, 30);
      expect(timer.updateSettings).toHaveBeenCalledWith({ totalWork: 0, totalBreak: 0, totalPaused: 0 });
      expect(result.current.modal).toBe("goal");
    });

    it("ignores auto break done when there is no task context", async () => {
      const timer = buildTimerState({ activeTaskId: null, task: "" });
      const { result } = renderHook(() => useTimerFlow(timer, vi.fn()));
      act(() => result.current.autoBreakDone());
      expect(saveSession).not.toHaveBeenCalled();
      await act(async () => result.current.endEarly());
      expect(timer.resetTimer).toHaveBeenCalled();
    });
  });

  describe("useTimerHandlers and popup effects", () => {
    it("sets break mode and handles goal actions", () => {
      const timer = buildHandlersTimer();
      const setModal = vi.fn();
      const startNext = vi.fn();
      const resetBlockId = vi.fn();
      const endEarly = vi.fn();
      const handlers = useTimerHandlers(timer, "BREAK", setModal, startNext, resetBlockId, endEarly);
      handlers.break();
      expect(timer.setMode).toHaveBeenCalledWith("break");
      expect(timer.setTimeLeft).toHaveBeenCalledWith(5 * 60);

      const goalHandlers = useTimerHandlers({ ...timer, completedSessions: 3 }, "goal", setModal, startNext, resetBlockId, endEarly);
      goalHandlers.goal();
      expect(timer.resetTimer).toHaveBeenCalled();
      expect(resetBlockId).toHaveBeenCalled();
      goalHandlers.endEarly();
      expect(endEarly).toHaveBeenCalled();
      goalHandlers.overtimeBreak();
      expect(startNext).toHaveBeenCalled();
      goalHandlers.autoBreakDone();
      expect(timer.setIsActive).toHaveBeenCalledWith(false);
    });

    it("auto-starts breaks when preference is enabled", async () => {
      localStorage.setItem("timerAutoStart", "true");
      const breakHandler = vi.fn();
      renderHook(() => useTimerPopupEffects({ modal: "break", handlers: { break: breakHandler }, isActive: false, timeLeft: 100 }));
      await act(async () => vi.advanceTimersByTime(2000));
      expect(breakHandler).toHaveBeenCalled();
    });

    it("finishes auto breaks when countdown hits zero", async () => {
      const autoBreakDone = vi.fn();
      renderHook(() => useTimerPopupEffects({ modal: "autoBreak", handlers: { autoBreakDone }, isActive: true, timeLeft: 0 }));
      await act(async () => vi.advanceTimersByTime(250));
      expect(autoBreakDone).toHaveBeenCalled();
    });
  });

  describe("useTimerLogic", () => {
    it("applies incoming task estimates on mount", async () => {
      const setup = await mockTimerLogic();
      await setup.rerender();
      expect(setup.timerState.updateTime).toHaveBeenCalledWith("sessions", 3);
      expect(setup.timerState.updateTime).toHaveBeenCalledWith("work", 45);
      expect(setup.timerState.setMode).toHaveBeenCalledWith("work");
      expect(setup.result.current.task).toBe("Essay draft");
      setup.cleanup();
    });

    it("ignores metadata rerenders when nothing changed", async () => {
      const setup = await mockTimerLogic();
      setup.timerState.updateTime.mockClear();
      await setup.rerender();
      expect(setup.timerState.updateTime).not.toHaveBeenCalled();
      setup.cleanup();
    });

    it("recalculates sessions when title or blocks change", async () => {
      const setup = await mockTimerLogic();
      setup.timerState.updateTime.mockClear();
      await setup.rerender({
        activeTaskId: 7,
        meta: { title: "Revision set", estimatedBlocks: 2 },
      });
      expect(setup.timerState.updateTime).toHaveBeenCalledWith("sessions", 1);
      expect(setup.timerState.updateTime).toHaveBeenCalledWith("work", 50);
      setup.cleanup();
    });

    it("skips updates when metadata is missing", async () => {
      const setup = await mockTimerLogic();
      setup.timerState.updateTime.mockClear();
      await setup.rerender({
        activeTaskId: 8,
        meta: { title: null, estimatedBlocks: 0 },
      });
      expect(setup.timerState.updateTime).not.toHaveBeenCalled();
      setup.cleanup();
    });
  });
});

function buildTimerState(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function buildHandlersTimer() {
  return {
    setIsActive: vi.fn(),
    completedSessions: 0,
    targetSessions: 4,
    workTime: 25,
    breakTime: 5,
    setMode: vi.fn(),
    setTimeLeft: vi.fn(),
    resetTimer: vi.fn(),
  };
}

const timerLogicProps = {
  activeTaskId: 7,
  meta: { title: "Essay draft", estimatedWorkMinutes: 45, estimatedSessionCount: 3 },
};

function buildTimerLogicState() {
  return {
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
}

function buildFlowState() {
  return {
    modal: "goal",
    setModal: vi.fn(),
    startNext: vi.fn(),
    resetBlockId: vi.fn(),
    endEarly: vi.fn(),
  };
}

function mockTimerLogicModules(notify, timerState, flowState, handlers) {
  vi.doMock("../../../components/notifications/hooks/useNotify", () => ({ useNotify: () => notify }));
  vi.doMock("../../../components/timer/hooks/useTimer", () => ({ useTimer: () => timerState }));
  vi.doMock("../../../components/timer/hooks/useTimerFlow", () => ({ useTimerFlow: vi.fn(() => flowState) }));
  vi.doMock("../../../components/timer/hooks/useTimerHandlers", () => ({ useTimerHandlers: vi.fn(() => handlers) }));
}

async function renderTimerLogic() {
  const { useTimerLogic } = await import("../../../components/timer/hooks/useTimerLogic");
  return renderHook(({ activeTaskId, meta }) => useTimerLogic(activeTaskId, vi.fn(), meta), { initialProps: timerLogicProps });
}

function createRerender(renderState) {
  let currentProps = timerLogicProps;
  return async (props) => {
    currentProps = props || currentProps;
    await act(async () => { renderState.rerender(currentProps); });
  };
}

function unmockTimerLogicModules() {
  vi.doUnmock("../../../components/notifications/hooks/useNotify");
  vi.doUnmock("../../../components/timer/hooks/useTimer");
  vi.doUnmock("../../../components/timer/hooks/useTimerFlow");
  vi.doUnmock("../../../components/timer/hooks/useTimerHandlers");
}

async function mockTimerLogic() {
  vi.resetModules();
  const timerState = buildTimerLogicState();
  const flowState = buildFlowState();
  const handlers = { break: vi.fn() };
  mockTimerLogicModules(vi.fn(), timerState, flowState, handlers);
  const renderState = await renderTimerLogic();
  return { result: renderState.result, rerender: createRerender(renderState), timerState, cleanup: unmockTimerLogicModules };
}
