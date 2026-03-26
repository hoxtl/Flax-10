import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import styles from "../../../../components/Calendar/month_view/SwipeMonthView.module.css";
import { SwipeMonthView } from "../../../../components/Calendar/month_view/SwipeMonthView";

let calendarState;
const dispatch = vi.fn();
const useSwipeNavigation = vi.fn();

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendar: () => calendarState,
  useCalendarDispatch: () => dispatch,
}));

vi.mock("../../../../components/Calendar/hooks/useSwipeNavigation", () => ({
  useSwipeNavigation: (...args) => useSwipeNavigation(...args),
}));

vi.mock("../../../../components/Calendar/month_view/WeekdayHeader", () => ({
  WeekdayHeader: () => <div>weekday-header</div>,
}));

vi.mock("../../../../components/Calendar/month_view/WeekRow", () => ({
  WeekRow: () => <div>week-row</div>,
}));

describe("SwipeMonthView coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calendarState = {
      selectedDate: new Date("2026-03-15T00:00:00.000Z"),
      events: [],
      readOnly: false,
    };
  });

  it("resets scroll position and applies both animation directions", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<SwipeMonthView />);
    const root = container.firstChild;
    act(() => { useSwipeNavigation.mock.calls.at(-1)[0].onNext(); });
    expect(root.firstChild.className).toContain(styles.slideUp);

    act(() => { vi.advanceTimersByTime(150); });
    root.scrollTop = 40;
    calendarState = { ...calendarState, selectedDate: new Date("2026-04-15T00:00:00.000Z") };
    rerender(<SwipeMonthView />);
    expect(root.scrollTop).toBe(0);

    act(() => { useSwipeNavigation.mock.calls.at(-1)[0].onPrev(); });
    expect(container.firstChild.firstChild.className).toContain(styles.slideDown);
    vi.useRealTimers();
  });
});
