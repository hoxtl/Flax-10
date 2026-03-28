import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ProfileCalendar } from "../../../../pages/profile/components/ProfileCalendar";

// Mock side-effects in context
vi.mock("../../../../components/notifications/hooks/useReminderNotifications", () => ({
  useReminderNotifications: vi.fn(),
}));

// Mock subcomponents to simplify testing
vi.mock("../../../../components/calendar/header/CalendarHeaderUtils", () => ({
  CalendarNav: ({ onPrev, onNext, onToday, title, showToday }) => (
    <div data-testid="calendar-nav">
      <button onClick={onPrev}>Prev</button>
      <button onClick={onNext}>Next</button>
      <button onClick={onToday}>Go to Today</button>
      <span>{title}</span>
      {showToday && <span data-testid="today-indicator">Current Month</span>}
    </div>
  ),
}));

vi.mock("../../../../components/calendar/month_view/MonthView", () => ({
  MonthView: ({ onMoreClick, readOnly }) => (
    <div data-testid="month-view">
      <span>ReadOnly: {String(readOnly)}</span>
      <button onClick={() => onMoreClick?.(new Date(2026, 2, 20))}>More</button>
    </div>
  ),
}));

vi.mock("../../../../components/calendar/EventPopups", () => ({
  EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock("../../../../components/calendar/events_summary_modal/EventsSummaryModal", () => ({
  EventsSummaryModal: ({ isOpen, baseDate, onClose }) => (
    <div data-testid="summary-modal">
      {isOpen ? (
        <>
          <span>Open at {baseDate?.toISOString()}</span>
          <button onClick={onClose}>Close Summary</button>
        </>
      ) : (
        "Closed"
      )}
    </div>
  ),
}));

describe("ProfileCalendar", () => {
  const mockEvents = [{ id: 1, title: "Event 1" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and initializes calendar mode", () => {
    render(<ProfileCalendar allEvents={mockEvents} />);
    
    expect(screen.getByTestId("calendar-nav")).toBeInTheDocument();
    expect(screen.getByTestId("month-view")).toBeInTheDocument();
    expect(screen.getByTestId("event-popups")).toBeInTheDocument();
    expect(screen.getByText("ReadOnly: true")).toBeInTheDocument();
  });

  it("handles navigation correctly", () => {
    render(<ProfileCalendar allEvents={[]} />);
    
    // Initially shows some month (default is current month)
    const initialTitle = screen.getByTestId("calendar-nav").querySelector("span").textContent;
    
    fireEvent.click(screen.getByText("Next"));
    const nextTitle = screen.getByTestId("calendar-nav").querySelector("span").textContent;
    expect(nextTitle).not.toBe(initialTitle);
    
    fireEvent.click(screen.getByText("Prev"));
    const prevTitle = screen.getByTestId("calendar-nav").querySelector("span").textContent;
    expect(prevTitle).toBe(initialTitle);
  });

  it("handles today button correctly", () => {
    // Force selected date to something else first
    render(<ProfileCalendar allEvents={[]} />);
    fireEvent.click(screen.getByText("Next"));
    
    expect(screen.getByTestId("today-indicator")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Go to Today"));
    expect(screen.queryByTestId("today-indicator")).toBeNull();
  });

  it("opens summary modal when onMoreClick is called and can close it", () => {
    render(<ProfileCalendar allEvents={[]} />);
    
    expect(screen.getByText("Closed")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("More"));
    expect(screen.getByText(/Open at 2026-03-20/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Close Summary"));
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("syncs events when allEvents prop changes and handles null", () => {
    const { rerender } = render(<ProfileCalendar allEvents={mockEvents} />);
    
    act(() => {
      rerender(<ProfileCalendar allEvents={null} />);
    });
    
    // Verifies no crash and coverage of null check in useSyncEvents
    const newEvents = [{ id: 2, title: "New" }];
    act(() => {
      rerender(<ProfileCalendar allEvents={newEvents} />);
    });
  });
});
