import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const useMonthDayDrop = vi.fn();
const openModal = vi.fn();
const useTags = vi.fn();
const useDrag = vi.fn();
const openPopup = vi.fn();
const getEventType = vi.fn();
const getEventTheme = vi.fn();
const useCalendar = vi.fn();
const dispatch = vi.fn();
const useSwipeNavigation = vi.fn();

vi.mock("../../../components/Calendar/hooks/useMonthDayDrop", () => ({
  useMonthDayDrop: (...args) => useMonthDayDrop(...args),
}));

vi.mock("../../../context/CalendarContext", () => ({
  useEventModal: () => ({ openModal }),
  useCalendar: (...args) => useCalendar(...args),
  useCalendarDispatch: () => dispatch,
  useEventPopup: () => ({ openPopup }),
}));

vi.mock("../../../context/TagContext", () => ({
  useTags: (...args) => useTags(...args),
}));

vi.mock("../../../components/Calendar/hooks/useDragDrop", () => ({
  useDrag: (...args) => useDrag(...args),
}));

vi.mock("../../../components/Calendar/utils/eventUtils", () => ({
  getEventType: (...args) => getEventType(...args),
}));

vi.mock("../../../components/Calendar/utils/eventStyleUtils", () => ({
  getEventTheme: (...args) => getEventTheme(...args),
}));

vi.mock("../../../components/Calendar/hooks/useSwipeNavigation", () => ({
  useSwipeNavigation: (...args) => useSwipeNavigation(...args),
}));

import { DayCell } from "../../../components/Calendar/MonthView/DayCell";
import { EventDot, MoreEvents } from "../../../components/Calendar/MonthView/EventDot";
import { SwipeMonthView } from "../../../components/Calendar/MonthView/SwipeMonthView";

describe("MonthView parts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMonthDayDrop.mockReturnValue({ dropProps: {}, isOver: false });
    useTags.mockReturnValue({ tags: [] });
    useDrag.mockReturnValue({ dragProps: { draggable: true }, isDragging: false });
    getEventType.mockReturnValue("personal");
    getEventTheme.mockReturnValue({ color: "#09f" });
    useCalendar.mockReturnValue({
      selectedDate: new Date("2026-03-24T00:00:00.000Z"),
      events: [{ id: 1, title: "Lecture", start_time: new Date("2026-03-24T10:00:00.000Z"), end_time: new Date("2026-03-24T11:00:00.000Z") }],
      readOnly: false,
    });
  });

  it("renders editable DayCell and creates draft events", () => {
    render(<DayCell day={new Date("2026-03-24T00:00:00.000Z")} events={[]} isCur readOnly={false} />);
    fireEvent.click(screen.getByText("+"));
    expect(openModal).toHaveBeenCalledWith(expect.objectContaining({ start_time: expect.any(Date) }));
  });

  it("renders readonly DayCell without add button", () => {
    render(<DayCell day={new Date("2026-03-24T00:00:00.000Z")} events={[]} isCur readOnly />);
    expect(screen.queryByText("+")).not.toBeInTheDocument();
  });

  it("handles date selection in DayCell", () => {
    const onDateSelect = vi.fn();
    render(<DayCell day={new Date("2026-03-24T00:00:00.000Z")} events={[]} isCur onDateSelect={onDateSelect} />);
    fireEvent.click(screen.getByText("24"));
    expect(onDateSelect).toHaveBeenCalled();
  });

  it("delays next month navigation for swipe animation", () => {
    vi.useFakeTimers();
    render(<SwipeMonthView />);
    const { onNext } = useSwipeNavigation.mock.calls.at(-1)[0];
    act(() => { onNext(); });
    expect(dispatch).not.toHaveBeenCalledWith({ type: "SET_SELECTED_DATE", payload: expect.any(Date) });
    act(() => { vi.advanceTimersByTime(150); });
    expect(dispatch).toHaveBeenCalledWith({ type: "SET_SELECTED_DATE", payload: expect.any(Date) });
    vi.useRealTimers();
  });

  it("delays prev month navigation for swipe animation", () => {
    vi.useFakeTimers();
    render(<SwipeMonthView />);
    const { onPrev } = useSwipeNavigation.mock.calls.at(-1)[0];
    act(() => { onPrev(); });
    act(() => { vi.advanceTimersByTime(150); });
    const calls = dispatch.mock.calls.filter(c => c[0].type === "SET_SELECTED_DATE");
    expect(calls.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});
