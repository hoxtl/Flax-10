/* Tests for useDateTimePicker hook day selection and time changes */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDateTimePicker from "../../../../pages/Tasks/hooks/useDateTimePicker";

describe("useDateTimePicker", () => {
  it("selects day and changes time", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateTimePicker("2026-03-08T12:30", onChange, false));
    act(() => result.current.selectDay(9));
    act(() => result.current.changeHour(15));
    act(() => result.current.changeMinute(45));
    expect(onChange).toHaveBeenCalled();
    expect(result.current.days.length).toBeGreaterThan(27);
  });

  it("moves months and clears selection", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDateTimePicker("", onChange, false));
    const month = result.current.viewM;
    act(() => result.current.nextMonth());
    act(() => result.current.prevMonth());
    act(() => result.current.clearSelection());
    expect(result.current.viewM).toBe(month);
    expect(onChange).toHaveBeenCalledWith("");
  });
});
