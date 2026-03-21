/*
 * Tests for UpcomingDeadlinesWidget component.
 */
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeadlinesWidget } from '../../../pages/Homepage/components/DeadlinesWidget';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../pages/Homepage/components/DeadlinesWidget.module.css', () => ({ default: {} }));

const deadlines = [
  { id: 1, title: 'Essay', module_code: 'CS101', module_id: 5, start_due_date: '2026-04-01T12:00:00Z', deadline_type: 'exam' },
];

function renderWidget(props = {}) {
  return render(
    <MemoryRouter>
      <DeadlinesWidget deadlines={[]} {...props} />
    </MemoryRouter>,
  );
}

describe('DeadlinesWidget (Homepage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no deadlines', () => {
    renderWidget();
    expect(screen.getByText(/No deadlines need attention/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view my modules/i })).not.toBeInTheDocument();
  });

  it('renders deadlines when provided', () => {
    renderWidget({ deadlines });
    expect(screen.getByText('Essay')).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();
  });

  it('calls onSelectDeadline when row clicked', () => {
    const onSelect = vi.fn();
    renderWidget({ deadlines, onSelectDeadline: onSelect });
    fireEvent.click(screen.getByText('Essay'));
    expect(onSelect).toHaveBeenCalledWith(deadlines[0]);
  });

  it('calls onSelectModule when module pill clicked', () => {
    const onSelectModule = vi.fn();
    renderWidget({ deadlines, onSelectModule });
    fireEvent.click(screen.getByText('CS101'));
    expect(onSelectModule).toHaveBeenCalledWith({ code: 'CS101', id: 5 });
  });
});
