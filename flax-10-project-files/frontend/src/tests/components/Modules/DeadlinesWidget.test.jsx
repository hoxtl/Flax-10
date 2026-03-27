/*
 * Tests for UpcomingDeadlinesWidget component.
 */

import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeadlinesWidget } from '../../../pages/homepage/components/DeadlinesWidget';
import { UpcomingDeadlinesWidget } from '../../../components/modules/Deadlines/UpcomingDeadlinesWidget';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../../pages/homepage/components/DeadlinesWidget.module.css', () => ({ default: {} }));

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
    expect(screen.getByRole('link', { name: /go to my modules/i })).toBeInTheDocument();
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

  it('does not trigger row selection when a pill is clicked', () => {
    const onSelect = vi.fn();
    renderWidget({ deadlines, onSelectDeadline: onSelect });
    fireEvent.click(screen.getByText('CS101'));
    fireEvent.click(screen.getByText('EXAM'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('filters invalid deadlines and supports keyboard selection in the shared widget', () => {
    const onSelectDeadline = vi.fn();
    render(
      <MemoryRouter>
        <UpcomingDeadlinesWidget
          interactiveRows
          onSelectDeadline={onSelectDeadline}
          deadlines={[
            { id: 1, title: 'Essay', module_code: 'CS101', start_due_date: '2026-04-01T12:00:00Z', deadline_type: 'coursework' },
            { id: 2, title: 'Skip me' },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Essay')).toBeInTheDocument();
    expect(screen.queryByText('Skip me')).not.toBeInTheDocument();

    const row = screen.getByRole('button', { name: /essay/i });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onSelectDeadline).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('returns null for non-array deadline input and hides the header when custom empty content is rendered', () => {
    const { rerender, container } = render(
      <MemoryRouter>
        <UpcomingDeadlinesWidget deadlines={null} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <MemoryRouter>
        <UpcomingDeadlinesWidget deadlines={[]} renderEmpty={() => <div>Custom empty</div>} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Custom empty')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming Deadlines')).not.toBeInTheDocument();
  });
});
