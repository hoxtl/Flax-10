import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Homepage from '../../pages/Homepage/Homepage';

const mockDispatch = vi.fn();
const mockOpenModal = vi.fn();
const mockRemoveEvent = vi.fn();
const mockUseCalendarEvents = vi.fn();

const TODAY = new Date();
const OTHER_DATE = new Date('2020-01-01');

let mockSelectedDate = TODAY;
let mockEvents = [];

vi.mock('../../context/CalendarContext', () => ({
  useCalendar: () => ({ selectedDate: mockSelectedDate, events: mockEvents }),
  useCalendarDispatch: () => mockDispatch,
  useEventModal: () => ({ openModal: mockOpenModal }),
}));

vi.mock('../../hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent }),
}));

vi.mock('../../components/PillFilters', () => ({
  default: ({ active, onChange, items }) => (
    <div>
      <span data-testid="active-filter">{active}</span>
      <button onClick={() => onChange('lecture')}>set-lecture</button>
      <span data-testid="items-count">{items.length}</span>
    </div>
  ),
}));

vi.mock('../../components/Homepage/DateNavigator', () => ({
  default: ({ date, onChange, scheduleTitle }) => (
    <div>
      <span data-testid="schedule-title">{scheduleTitle}</span>
      <button onClick={() => onChange(OTHER_DATE)}>change-date</button>
    </div>
  ),
}));

vi.mock('../../components/Homepage/CardGrid', () => ({
  default: ({ items, onDelete, onEdit }) => (
    <div>
      <span data-testid="card-count">{items.length}</span>
      <button onClick={() => onDelete('e1')}>delete</button>
      <button onClick={() => onEdit({ id: 'e1', tag: 'lecture' })}>edit</button>
    </div>
  ),
}));

beforeEach(() => {
  mockSelectedDate = TODAY;
  mockEvents = [];
  vi.clearAllMocks();
});

describe('Homepage', () => {
  it('renders with today label', () => {
    render(<Homepage />);
    expect(screen.getByTestId('schedule-title').textContent).toBe("Today's schedule");
  });

  it('renders "Schedule" for non-today date', () => {
    mockSelectedDate = OTHER_DATE;
    render(<Homepage />);
    expect(screen.getByTestId('schedule-title').textContent).toBe('Schedule');
  });

  it('shows all events by default', () => {
    mockEvents = [
      { id: '1', start_time: TODAY.toISOString(), end_time: TODAY.toISOString(), tag_name: 'lecture' },
    ];
    render(<Homepage />);
    expect(screen.getByTestId('card-count').textContent).toBe('1');
  });

  it('filters events by tag', () => {
    mockEvents = [
      { id: '1', start_time: TODAY.toISOString(), end_time: TODAY.toISOString(), tag_name: 'lecture' },
      { id: '2', start_time: TODAY.toISOString(), end_time: TODAY.toISOString(), tag_name: 'seminar' },
    ];
    render(<Homepage />);
    fireEvent.click(screen.getByText('set-lecture'));
    expect(screen.getByTestId('card-count').textContent).toBe('1');
  });

  it('calls dispatch when date changes', () => {
    render(<Homepage />);
    fireEvent.click(screen.getByText('change-date'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SELECTED_DATE', payload: OTHER_DATE });
  });

  it('calls removeEvent on delete', () => {
    render(<Homepage />);
    fireEvent.click(screen.getByText('delete'));
    expect(mockRemoveEvent).toHaveBeenCalledWith('e1');
  });

  it('calls openModal on edit', () => {
    render(<Homepage />);
    fireEvent.click(screen.getByText('edit'));
    expect(mockOpenModal).toHaveBeenCalledWith({ id: 'e1', tag: 'lecture' }, 'lecture');
  });

  it('filters "all" returns all items', () => {
    mockEvents = [
      { id: '1', start_time: TODAY.toISOString(), end_time: TODAY.toISOString(), tag_name: 'lecture' },
      { id: '2', start_time: TODAY.toISOString(), end_time: TODAY.toISOString(), tag_name: 'seminar' },
    ];
    render(<Homepage />);
    expect(screen.getByTestId('card-count').textContent).toBe('2');
  });
});