import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PlanReadDetailModal } from '@/pages/homepage/components/PlanReadDetailModal';

// Mocks
vi.mock('@/components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick, variant, className }) => (
    <button data-testid={`btn-${variant}`} className={className} onClick={onClick}>{children}</button>
  )
}));
vi.mock('@/components/common/standard_modal/StandardModal', () => ({
  default: ({ children, title, subtitle, onClose }) => (
    <div data-testid="standard-modal">
        <h1 data-testid="modal-title">{title}</h1>
        <h2 data-testid="modal-subtitle">{subtitle}</h2>
        <button onClick={onClose}>Close</button>
        {children}
    </div>
  )
}));
vi.mock('@/pages/homepage/utils/dateFormatUtils', () => ({
  formatTime: (date) => '12:00'
}));

const mockProps = {
  item: null,
  styles: { 
    actionHubReadContent: 'content', actionHubReadDescription: 'desc',
    actionHubReadFooter: 'footer', actionHubReadBtn: 'btn', actionHubReadBtnDanger: 'btn-danger'
  },
  onClose: vi.fn(), onEditTask: vi.fn(), onDeleteTask: vi.fn(),
  onEditEvent: vi.fn(), onDeleteEvent: vi.fn(),
};

describe('PlanReadDetailModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders null when no item', () => {
    const { container } = render(<PlanReadDetailModal {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders task details and handles actions', async () => {
    const item = { task: { id: 1, title: 'Task Title', description: 'Task Desc', estimated_blocks: 2 } };
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-title').textContent).toBe('Task Title');
    expect(screen.getByText('Task Desc')).toBeTruthy();

    await act(async () => { fireEvent.click(screen.getByText('Edit')); });
    expect(mockProps.onEditTask).toHaveBeenCalledWith(item.task);
    expect(mockProps.onClose).toHaveBeenCalled();

    await act(async () => { fireEvent.click(screen.getByText('Delete')); });
    expect(mockProps.onDeleteTask).toHaveBeenCalledWith(item.task);
  });

  it('renders event details and handles actions', async () => {
    const item = { event: { id: 'evt-1', title: 'Event Title', start_time: '2026-03-27T12:00:00Z', end_time: '2026-03-27T13:00:00Z' } };
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-title').textContent).toBe('Event Title');

    await act(async () => { fireEvent.click(screen.getByText('Edit')); });
    expect(mockProps.onEditEvent).toHaveBeenCalledWith(item.event);

    await act(async () => { fireEvent.click(screen.getByText('Delete')); });
    expect(mockProps.onDeleteEvent).toHaveBeenCalledWith(item.event);
  });

  it('handles errors gracefully in delete', async () => {
    const item = { task: { id: 1, title: 'T' } };
    const onDeleteTask = vi.fn().mockRejectedValue(new Error('Fail'));
    render(<PlanReadDetailModal {...mockProps} item={item} onDeleteTask={onDeleteTask} />);
    await act(async () => { fireEvent.click(screen.getByText('Delete')); });
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('handles task without due date or estimated blocks', () => {
    const item = { task: { id: 2, title: 'No Time' } };
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-subtitle').textContent).toBe("");
  });

  it('handles event with same start and end time', () => {
    const item = { event: { id: 'evt-2', title: 'Moment', start_time: '2026-03-27T12:00:00Z', end_time: '2026-03-27T12:00:00Z' } };
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-subtitle').textContent).toContain('12:00');
    expect(screen.getByTestId('modal-subtitle').textContent).not.toContain('–');
  });
  it('handles missing callbacks in actions', async () => {
    const item = { task: { id: 3, title: 'T' } };
    render(<PlanReadDetailModal {...mockProps} item={item} onEditTask={undefined} onDeleteTask={undefined} />);
    await act(async () => { fireEvent.click(screen.getByText('Edit')); });
    await act(async () => { fireEvent.click(screen.getByText('Delete')); });
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles null data in getModalData', () => {
    const { container } = render(<PlanReadDetailModal {...mockProps} item={{ task: null, event: null }} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles event without start time for coverage', () => {
    const item = { event: { id: 'evt-3', title: 'T' } };
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-subtitle').textContent).toBe("");
  });

  it('renders with no title on item (line 20 branch)', () => {
    const item = { task: { id: 5, estimated_blocks: 2 } }; // no title
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-title').textContent).toBe('');
  });

  it('renders task with due_date but no estimated_blocks (line 28 true+false)', () => {
    const item = { task: { id: 6, title: 'T2', due_date: '2026-04-01T09:00:00Z' } };
    render(<PlanReadDetailModal {...mockProps} item={item} />);
    expect(screen.getByTestId('modal-subtitle').textContent).toContain('12:00');
    expect(screen.getByTestId('modal-subtitle').textContent).not.toContain('m');
  });
});
