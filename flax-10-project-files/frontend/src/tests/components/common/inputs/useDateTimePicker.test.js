import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useClickOutside,
  useDateTimeHandlers,
  useDerivedCalendarState,
  useDropdownPosition,
  useDateTimePickerState,
  useSyncValue,
} from "../../../../components/common/inputs/useDateTimePicker";

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

  it("skips dropdown positioning when the anchor ref is missing", () => {
    const setDropdownPos = vi.fn();
    renderHook(() => useDropdownPosition(true, { current: null }, false, false, setDropdownPos));
    expect(setDropdownPos).not.toHaveBeenCalled();
  });

  it("avoids window listeners while the dropdown stays closed", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useDropdownPosition(false, { current: { getBoundingClientRect: () => ({ bottom: 1, left: 1 }) } }, false, false, vi.fn()));
    expect(addSpy).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it("syncs valid values into picker state", () => {
    const setSelDate = vi.fn();
    const setHour = vi.fn();
    const setMinute = vi.fn();
    const setViewY = vi.fn();
    const setViewM = vi.fn();
    renderHook(() =>
      useSyncValue("2026-04-01T08:15", false, false, setSelDate, setHour, setMinute, setViewY, setViewM),
    );
    expect(setSelDate).toHaveBeenCalled();
  });

  it("clears selection when the external value is empty", () => {
    const setSelDate = vi.fn();
    renderHook(() => useSyncValue("", false, false, setSelDate, vi.fn(), vi.fn(), vi.fn(), vi.fn()));
    expect(setSelDate).toHaveBeenCalledWith(null);
  });

  it("ignores external strings that do not parse to a real date", () => {
    const setSelDate = vi.fn();
    renderHook(() => useSyncValue("not-a-date", false, false, setSelDate, vi.fn(), vi.fn(), vi.fn(), vi.fn()));
    expect(setSelDate).not.toHaveBeenCalled();
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

  it("ignores pointer events that originate inside dropdown portals", () => {
    const setOpen = vi.fn();
    const portal = document.createElement("div");
    portal.setAttribute("data-dropdown-portal", "true");
    document.body.append(portal);
    const ref = { current: document.createElement("div") };
    const dRef = { current: document.createElement("div") };
    document.body.append(ref.current, dRef.current);
    renderHook(() => useClickOutside(true, ref, dRef, setOpen));
    act(() => portal.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })));
    expect(setOpen).not.toHaveBeenCalled();
    [ref.current, dRef.current, portal].forEach((el) => el.remove());
  });

  it("skips outside listeners when the dropdown is closed", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const ref = { current: document.createElement("div") };
    document.body.append(ref.current);
    renderHook(() => useClickOutside(false, ref, { current: null }, vi.fn()));
    expect(addSpy).not.toHaveBeenCalledWith("pointerdown", expect.any(Function), true);
    addSpy.mockRestore();
    ref.current.remove();
  });

  it("ignores non-escape keys while listening for dismissal", () => {
    const setOpen = vi.fn();
    const ref = { current: document.createElement("div") };
    document.body.append(ref.current);
    renderHook(() => useClickOutside(true, ref, { current: null }, setOpen));
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })));
    expect(setOpen).not.toHaveBeenCalled();
    ref.current.remove();
  });

  it("falls back to the current clock when no initial value exists", () => {
    const { result } = renderHook(() => useDateTimePickerState("", false, false));
    expect(result.current.selDate).toBeNull();
    expect(result.current.hour).toBe(12);
    expect(result.current.minute).toBe(0);
  });

  it("syncs value and derives flags", () => {
    const { result } = renderHook(() => useDateTimePickerState("2026-03-15T10:30", false, false));
    expect(result.current.open).toBe(false);
    expect(result.current.selDate).toBeInstanceOf(Date);
    const anchor = new Date("2026-03-15T10:30:00");
    const d = renderHook(() => useDerivedCalendarState(2026, 2, anchor, "2026-03-20")).result.current;
    expect(d.days.length).toBeGreaterThan(0);
    expect(d.isSel(15)).toBe(true);
    expect(d.isDisabled(10)).toBe(true);
  });

  it("covers today and selection predicates across month and year boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    const sel = new Date("2026-06-15T10:00:00");
    const { result } = renderHook(() => useDerivedCalendarState(2026, 5, sel, "2026-06-01"));
    expect(result.current.isToday(10)).toBe(true);
    expect(result.current.isToday(11)).toBe(false);
    const wrongMonth = renderHook(() => useDerivedCalendarState(2026, 4, sel, null)).result.current;
    expect(wrongMonth.isToday(10)).toBe(false);
    const wrongYear = renderHook(() => useDerivedCalendarState(2025, 5, sel, null)).result.current;
    expect(wrongYear.isToday(10)).toBe(false);
    expect(result.current.isSel(15)).toBe(true);
    expect(result.current.isSel(16)).toBe(false);
    const otherMonth = renderHook(() => useDerivedCalendarState(2026, 4, sel, null)).result.current;
    expect(otherMonth.isSel(15)).toBe(false);
    vi.useRealTimers();
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
