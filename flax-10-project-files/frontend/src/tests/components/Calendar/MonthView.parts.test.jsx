import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

  it("renders editable and readonly day cells and creates draft events", () => {
    const onDateSelect = vi.fn();
    const onMoreClick = vi.fn();
    const { rerender } = render(
      <DayCell
        day={new Date("2026-03-24T00:00:00.000Z")}
        events={[]}
        isCur
        onDateSelect={onDateSelect}
        onMoreClick={onMoreClick}
        readOnly={false}
      />,
    );

    fireEvent.click(screen.getByText("+"));
    expect(openModal).toHaveBeenCalledWith(expect.objectContaining({ start_time: expect.any(Date), end_time: expect.any(Date) }));
    fireEvent.click(screen.getByText("24"));
    expect(onDateSelect).toHaveBeenCalled();

    rerender(
      <DayCell
        day={new Date("2026-03-24T00:00:00.000Z")}
        events={[]}
        isCur={false}
        onDateSelect={onDateSelect}
        onMoreClick={onMoreClick}
        readOnly
      />,
    );
    expect(screen.queryByText("+")).not.toBeInTheDocument();
  });

  it("renders event dots for personal and readonly variants", () => {
    const onEventClick = vi.fn();
    const { rerender } = render(
      <EventDot e={{ id: 1, title: "Personal", source: "personal" }} onEventClick={onEventClick} readOnly={false} />,
    );
    fireEvent.click(screen.getByText("Personal"));
    expect(onEventClick).toHaveBeenCalled();

    getEventType.mockReturnValueOnce("society");
    rerender(<EventDot e={{ id: 2, title: "Chess", source: "society", society_name: "Club" }} readOnly={false} />);
    expect(screen.getByText("Chess")).toHaveAttribute("title", "Chess (Club)");

    getEventType.mockReturnValueOnce("personal");
    rerender(<EventDot e={{ id: 3, title: "Popup only", source: "personal" }} readOnly />);
    fireEvent.click(screen.getByText("Popup only"));
    expect(openPopup).toHaveBeenCalled();
  });

  it("covers the more-events control and swipe month view navigation", async () => {
    const onClick = vi.fn();
    render(<MoreEvents count={3} onClick={onClick} />);
    fireEvent.click(screen.getByText("+3 more"));
    expect(onClick).toHaveBeenCalled();

    render(<SwipeMonthView />);
    expect(useSwipeNavigation).toHaveBeenCalled();
    fireEvent.click(screen.getByText("24"));
    expect(dispatch).toHaveBeenCalledWith({ type: "SET_SELECTED_DATE", payload: expect.any(Date) });
    expect(dispatch).toHaveBeenCalledWith({ type: "SET_VIEW_MODE", payload: "day" });
    await waitFor(() => expect(dispatch).not.toBeNull());
  });
});
