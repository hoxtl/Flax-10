import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SwipeMonthView } from "../../../components/Calendar/month_view/SwipeMonthView";

const dispatchMock = vi.fn();
const openPopupMock = vi.fn();
const swipeNavigationMock = vi.fn();

vi.mock("../../../context/CalendarContext", async () => {
  const actual = await vi.importActual("../../../context/CalendarContext");
  return {
    ...actual,
    useCalendar: vi.fn(() => ({
      selectedDate: new Date(2026, 1, 15),
      events: [
        { id: 1, title: "Personal", start_time: new Date(2026, 1, 15, 10, 0), end_time: new Date(2026, 1, 15, 11, 0) },
        { id: 2, title: "Lecture", source: "timetable", start_time: new Date(2026, 1, 15, 12, 0), end_time: new Date(2026, 1, 15, 13, 0) },
      ],
      readOnly: false,
    })),
    useCalendarDispatch: () => dispatchMock,
    useEventPopup: () => ({ openPopup: openPopupMock }),
  };
});

vi.mock("../../../components/Calendar/hooks/useSwipeNavigation", () => ({
  useSwipeNavigation: (...args) => swipeNavigationMock(...args),
}));

vi.mock("../../../context/TagContext", () => ({
  useTags: () => ({ tags: [], getTag: vi.fn(), getTagByName: vi.fn() }),
}));

vi.mock("../../../components/Calendar/hooks/useDragDrop", () => ({
  useDrag: vi.fn(() => ({ dragProps: { draggable: true }, isDragging: false })),
  useDrop: vi.fn(() => ({ dropProps: {}, isOver: false })),
}));

describe("SwipeMonthView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders month content, selects dates, and opens popup for default event clicks", () => {
    render(<SwipeMonthView />);
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Lecture")).toHaveClass("timetable-event");

    fireEvent.click(screen.getByText("15").closest(".day-cell"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "SET_SELECTED_DATE", payload: expect.any(Date) });
    expect(dispatchMock).toHaveBeenCalledWith({ type: "SET_VIEW_MODE", payload: "day" });

    fireEvent.click(screen.getByText("Personal"));
    expect(openPopupMock).toHaveBeenCalled();
    expect(swipeNavigationMock).toHaveBeenCalled();
  });
});
