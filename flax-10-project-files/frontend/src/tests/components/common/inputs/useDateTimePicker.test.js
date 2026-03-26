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

  const setupOutside = () => {
    const inside = document.createElement("button"), dropdown = document.createElement("div"), portal = document.createElement("div");
    const ref = { current: document.createElement("div") }, dRef = { current: document.createElement("div") };
    document.body.append(ref.current, dRef.current, portal);
    ref.current.appendChild(inside);
    dRef.current.appendChild(dropdown);
    return { inside, dropdown, portal, ref, dRef };
  };
  it("ignores inside pointer down", () => {
    const setOpen = vi.fn(), { inside, ref, dRef } = setupOutside();
    renderHook(() => useClickOutside(true, ref, dRef, setOpen));
    act(() => { ref.current.contains = vi.fn(() => true); inside.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })); });
    expect(setOpen).not.toHaveBeenCalled();
    [ref.current, dRef.current].forEach(el => el.remove());
  });
  it("ignores dropdown pointer down", () => {
    const setOpen = vi.fn(), { dropdown, ref, dRef } = setupOutside();
    renderHook(() => useClickOutside(true, ref, dRef, setOpen));
    act(() => { ref.current.contains = vi.fn(() => false); dRef.current.contains = vi.fn(() => true); dropdown.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })); });
    expect(setOpen).not.toHaveBeenCalled();
    [ref.current, dRef.current].forEach(el => el.remove());
  });
  it("closes on body pointer down and Escape", () => {
    const setOpen = vi.fn(), { ref, dRef } = setupOutside();
    renderHook(() => useClickOutside(true, ref, dRef, setOpen));
    act(() => { document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })); });
    expect(setOpen).toHaveBeenCalledWith(false);
    setOpen.mockClear();
    act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(setOpen).toHaveBeenCalledWith(false);
    [ref.current, dRef.current].forEach(el => el.remove());
  });

  it("syncs value and derives flags", () => {
    const { result } = renderHook(() => useDateTimePickerState("2026-03-15T10:30", false, false));
    expect(result.current.open).toBe(false);
    expect(result.current.selDate).toBeInstanceOf(Date);
    const d = renderHook(() => useDerivedCalendarState(2026, 2, new Date("2026-03-15T10:30:00"), "2026-03-10")).result.current;
    expect(d.days.length).toBeGreaterThan(0);
  });
  it("exposes handlers and updates state", () => {
    const sM = vi.fn(), sY = vi.fn(), sD = vi.fn(), sH = vi.fn(), sMin = vi.fn(), oC = vi.fn();
    const h = useDateTimeHandlers(2026, 0, sM, sY, null, sD, 10, sH, 30, sMin, false, false, oC);
    h.selectDay(18);
    h.changeHour(11);
    h.changeMinute(45);
    h.prevMonth();
    h.nextMonth();
    expect(sD).toHaveBeenCalled();
    expect(sH).toHaveBeenCalledWith(11);
    expect(sMin).toHaveBeenCalledWith(45);
    expect(sM).toHaveBeenCalled();
  });
});
