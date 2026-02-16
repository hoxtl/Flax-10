import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTodoStorage } from "../../hooks/tasks/useTodoStorage";

const TWO_HOURS = 2 * 60 * 60 * 1000;

describe("useTodoStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialise with empty array if no stored data", () => {
    const { result } = renderHook(() => useTodoStorage());
    expect(result.current[0]).toEqual([]);
  });

  it("should load tasks from localStorage on mount", () => {
    const mockTasks = [{ id: "1", title: "Test", done: false, urgent: false, completedAt: null }];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const { result } = renderHook(() => useTodoStorage());
    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].title).toBe("Test");
  });

  it("should save tasks to localStorage when updated", () => {
    const { result } = renderHook(() => useTodoStorage());
    const newTask = { id: "1", title: "New", done: false, urgent: false, completedAt: null };

    act(() => {
      result.current[1]([newTask]);
    });

    const stored = JSON.parse(localStorage.getItem("flax_todo_items_v1"));
    expect(stored[0].title).toBe("New");
  });

  it("should handle invalid localStorage data gracefully", () => {
    localStorage.setItem("flax_todo_items_v1", "invalid json");
    const { result } = renderHook(() => useTodoStorage());
    expect(result.current[0]).toEqual([]);
  });

  it("should normalise items loaded from localStorage", () => {
    const mockTasks = [{ id: "1", title: "Task without done field" }];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const { result } = renderHook(() => useTodoStorage());
    expect(result.current[0][0].done).toBe(false);
    expect(result.current[0][0].urgent).toBe(false);
    expect(result.current[0][0].completedAt).toBeNull();
  });

  it("should immediately clear expired tasks on mount", async () => {
    const now = Date.now();
    const mockTasks = [
      { id: "1", title: "Keep", done: false, urgent: false, completedAt: null },
      { id: "2", title: "Expired", done: true, urgent: false, completedAt: now - TWO_HOURS - 1000 },
    ];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const { result } = renderHook(() => useTodoStorage());
    await act(async () => {});

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].id).toBe("1");
  });

  it("should not clear tasks that have not expired", () => {
    const now = Date.now();
    const mockTasks = [
      { id: "1", title: "A", done: false, urgent: false, completedAt: null },
      { id: "2", title: "B", done: true, urgent: false, completedAt: now },
    ];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const { result } = renderHook(() => useTodoStorage());
    expect(result.current[0]).toHaveLength(2);
  });

  it("should schedule future clear and execute it", async () => {
    vi.useFakeTimers();

    const now = Date.now();
    const mockTasks = [
      { id: "1", title: "Keep", done: false, urgent: false, completedAt: null },
      // expires in 1 hour
      { id: "2", title: "Will expire", done: true, urgent: false, completedAt: now - TWO_HOURS + 60 * 60 * 1000 },
    ];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const { result } = renderHook(() => useTodoStorage());
    expect(result.current[0]).toHaveLength(2);

    await act(async () => {
      vi.advanceTimersByTime(60 * 60 * 1000 + 200); 
    });

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].id).toBe("1");
  });

  it("should sort expiry times and schedule the earliest", async () => {
    vi.useFakeTimers();

    const now = Date.now();
    const mockTasks = [
      { id: "1", title: "Later", done: true, urgent: false, completedAt: now },
      { id: "2", title: "Sooner", done: true, urgent: false, completedAt: now - 60 * 60 * 1000 },
    ];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const { result } = renderHook(() => useTodoStorage());

    await act(async () => {
      vi.advanceTimersByTime(60 * 60 * 1000 + 200);
    });

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].id).toBe("1");
  });

  it("should handle localStorage.setItem errors gracefully", () => {
    const { result } = renderHook(() => useTodoStorage());
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error("Storage full");
    });

    expect(() => {
      act(() => {
        result.current[1]([{ id: "1", title: "New", done: false, urgent: false, completedAt: null }]);
      });
    }).not.toThrow();

    Storage.prototype.setItem = originalSetItem;
  });

  it("should clear timeout on unmount", () => {
    vi.useFakeTimers();

    const now = Date.now();
    const mockTasks = [{ id: "1", title: "X", done: true, urgent: false, completedAt: now - 60 * 60 * 1000 }];
    localStorage.setItem("flax_todo_items_v1", JSON.stringify(mockTasks));

    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = renderHook(() => useTodoStorage());

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
