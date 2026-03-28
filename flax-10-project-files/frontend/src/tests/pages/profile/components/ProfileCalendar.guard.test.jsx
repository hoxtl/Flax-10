import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../../../../context/CalendarContext", () => {
  return {
    CalendarProvider: ({ children }) => children,
    useCalendar: () => ({ selectedDate: new Date("2026-01-01T00:00:00Z") }),
    useCalendarDispatch: () => null,
  };
});

vi.mock("../../../../context/ResizeHighlightContext", () => ({
  ResizeHighlightProvider: ({ children }) => children,
}));

vi.mock("../../../../components/calendar/header/CalendarHeaderUtils", () => {
  const React = require("react");
  return {
    CalendarNav: ({ onPrev, onNext, onToday, onDatePick }) => {
      React.useEffect(() => {
        onPrev?.();
        onNext?.();
        onToday?.();
        onDatePick?.(new Date("2026-02-01T00:00:00Z"));
      }, [onPrev, onNext, onToday, onDatePick]);
      return <div data-testid="calendar-nav-guard" />;
    },
  };
});

vi.mock("../../../../components/calendar/month_view/MonthView", () => ({
  MonthView: () => <div data-testid="month-view-guard" />,
}));

vi.mock("../../../../components/calendar/EventPopups", () => ({
  EventPopups: () => <div data-testid="event-popups-guard" />,
}));

vi.mock("../../../../components/calendar/events_summary_modal/EventsSummaryModal", () => ({
  EventsSummaryModal: () => <div data-testid="summary-modal-guard" />,
}));

const { ProfileCalendar } = await import("../../../../pages/profile/components/ProfileCalendar");

describe("ProfileCalendar dispatch guards", () => {
  it("renders safely even when calendar dispatch is unavailable", () => {
    const { getByTestId } = render(<ProfileCalendar allEvents={[]} />);
    expect(getByTestId("calendar-nav-guard")).toBeInTheDocument();
    expect(getByTestId("month-view-guard")).toBeInTheDocument();
    expect(getByTestId("event-popups-guard")).toBeInTheDocument();
    expect(getByTestId("summary-modal-guard")).toBeInTheDocument();
  });
});
