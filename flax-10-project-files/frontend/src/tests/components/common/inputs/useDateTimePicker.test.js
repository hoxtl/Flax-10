import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useClickOutside, useDateTimeHandlers, useDerivedCalendarState, useDropdownPosition, useDateTimePickerState } from "../../../../components/common/inputs/useDateTimePicker";

describe("useDateTimePicker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("positions the dropdown and attaches listeners while open", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const ref = { current: { getBoundingClientRect: () => ({ bottom: 100, left: 40 }) } };
    const setDropdownPos = vi.fn();

    const { unmount } = renderHook(() => useDropdownPosition(true, ref, false, false, setDropdownPos));

    expect(setDropdownPos).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number), left: expect.any(Number) }));
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), true);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("closes on outside pointer down and Escape but ignores inside and portal targets", () => {
    const setOpen = vi.fn();
    const inside = document.createElement("button");
    const dropdown = document.createElement("div");
    const portal = document.createElement("div");
    portal.closest = vi.fn(() => null);
    inside.closest = vi.fn(() => null);
    dropdown.closest = vi.fn(() => null);

    const ref = { current: document.createElement("div") };
    const dropdownRef = { current: document.createElement("div") };

    renderHook(() => useClickOutside(true, ref, dropdownRef, setOpen));

    act(() => {
      ref.current.contains = vi.fn(() => true);
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true, target: inside }));
    });
    expect(setOpen).not.toHaveBeenCalled();

    act(() => {
      ref.current.contains = vi.fn(() => false);
      dropdownRef.current.contains = vi.fn(() => true);
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true, target: dropdown }));
    });
    expect(setOpen).not.toHaveBeenCalled();

    act(() => {
      ref.current.contains = vi.fn(() => false);
      dropdownRef.current.contains = vi.fn(() => false);
      portal.closest = vi.fn(() => portal);
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true, target: portal }));
    });
    expect(setOpen).not.toHaveBeenCalled();

    act(() => {
      portal.closest = vi.fn(() => null);
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true, target: document.body }));
    });
    expect(setOpen).toHaveBeenCalledWith(false);

    setOpen.mockClear();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("syncs value, exposes handlers, and derives calendar flags", () => {
    const { result } = renderHook(() => useDateTimePickerState("2026-03-15T10:30", false, false));
    expect(result.current.open).toBe(false);
    expect(result.current.selDate).toBeInstanceOf(Date);

    const setViewM = vi.fn();
    const setViewY = vi.fn();
    const setSelDate = vi.fn();
    const setHour = vi.fn();
    const setMinute = vi.fn();
    const onChange = vi.fn();
    const handlers = useDateTimeHandlers(2026, 2, setViewM, setViewY, null, setSelDate, 10, setHour, 30, setMinute, false, false, onChange);
    handlers.selectDay(18);
    handlers.changeHour(11);
    handlers.changeMinute(45);
    handlers.prevMonth();
    handlers.nextMonth();

    expect(setSelDate).toHaveBeenCalled();
    expect(setHour).toHaveBeenCalledWith(11);
    expect(setMinute).toHaveBeenCalledWith(45);
    expect(setViewM).toHaveBeenCalled();
    expect(setViewY).toHaveBeenCalled();

    const derived = renderHook(() => useDerivedCalendarState(2026, 2, new Date("2026-03-15T10:30:00"), "2026-03-10")).result.current;
    expect(derived.days.length).toBeGreaterThan(0);
    expect(typeof derived.isDisabled).toBe("function");
  });
});
