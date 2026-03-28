import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTaskWidgetState } from "@/pages/homepage/components/useTaskWidgetState";

const tasks = [
  { id: 1, title: "Task A", completed: false },
  { id: 2, title: "Task B", completed: false },
  { id: 3, title: "Task C", completed: false },
  { id: 4, title: "Task D", completed: false },
  { id: 5, title: "Task E", completed: true },
];

describe("useTaskWidgetState", () => {
  it("splits tasks into initial, extra and completed groups", () => {
    const { result } = renderHook(() => useTaskWidgetState({ taskWidgetList: tasks }));
    expect(result.current.initialTasks).toHaveLength(3);
    expect(result.current.extraTasks).toHaveLength(1);
    expect(result.current.completedTasks).toHaveLength(1);
    expect(result.current.allTasksDone).toBe(false);
  });

  it("returns allTasksDone=true when all tasks completed", () => {
    const all = tasks.map((t) => ({ ...t, completed: true }));
    const { result } = renderHook(() => useTaskWidgetState({ taskWidgetList: all }));
    expect(result.current.allTasksDone).toBe(true);
  });

  it("handles empty taskWidgetList", () => {
    const { result } = renderHook(() => useTaskWidgetState({ taskWidgetList: [] }));
    expect(result.current.allTasksDone).toBe(false);
    expect(result.current.initialTasks).toHaveLength(0);
  });

  it("handles null taskWidgetList without crash", () => {
    const { result } = renderHook(() => useTaskWidgetState({ taskWidgetList: null }));
    expect(result.current.initialTasks).toHaveLength(0);
  });

  it("exposes ctxMenu toggle and expanded toggle", () => {
    const { result } = renderHook(() => useTaskWidgetState({ taskWidgetList: [] }));
    expect(result.current.ctxMenu).toBeNull();
    act(() => result.current.setCtxMenu({ x: 10, y: 20, task: {} }));
    expect(result.current.ctxMenu).toBeTruthy();
    act(() => result.current.setExpanded(true));
    expect(result.current.expanded).toBe(true);
    act(() => result.current.setShowCompleted(true));
    expect(result.current.showCompleted).toBe(true);
  });
});
