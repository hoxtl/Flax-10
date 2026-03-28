import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeadlinesWidget } from '../../../../pages/homepage/components/DeadlinesWidget';

vi.mock('../../../../components/modules/deadlines/UpcomingDeadlinesWidget', () => ({
  UpcomingDeadlinesWidget: ({ title, onModuleCodeClick, renderEmpty, deadlines }) => (
    <div data-testid="upcoming-deadlines-mock">
      <h2>{title}</h2>
      {deadlines.length === 0 && renderEmpty && renderEmpty()}
      {onModuleCodeClick && (
        <button onClick={() => onModuleCodeClick('CS101')}>Mock Module Click</button>
      )}
    </div>
  ),
}));

vi.mock('../../../../pages/homepage/components/EmptyStateCard', () => ({
  default: ({ message, action }) => (
    <div data-testid="empty-state-mock">
      <p>{message}</p>
      {action}
    </div>
  ),
}));

vi.mock('../../../../pages/homepage/styles/TaskWidget.module.css', () => ({
  default: { taskWidgetLink: 'taskWidgetLink' },
}));

describe('DeadlinesWidget', () => {
  it('renders student title and empty message by default (covering default props)', () => {
    render(
      <MemoryRouter>
        <DeadlinesWidget />
      </MemoryRouter>
    );
    expect(screen.getByText('Upcoming Deadlines')).toBeTruthy();
    expect(screen.getByText('No deadlines need attention.')).toBeTruthy();
  });

  it('renders teacher title and empty message when isTeacher is true', () => {
    render(
      <MemoryRouter>
        <DeadlinesWidget deadlines={[]} isTeacher={true} />
      </MemoryRouter>
    );
    expect(screen.getByText('Teaching Deadlines')).toBeTruthy();
    expect(screen.getByText('No teaching deadlines upcoming.')).toBeTruthy();
  });

  it('handles module code click when onSelectModule is provided', () => {
    const onSelectModule = vi.fn();
    render(
      <MemoryRouter>
        <DeadlinesWidget deadlines={[{ id: 1 }]} onSelectModule={onSelectModule} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Mock Module Click'));
    expect(onSelectModule).toHaveBeenCalledWith({ code: 'CS101' });
  });

  it('does not render module click button when onSelectModule is null', () => {
    render(
      <MemoryRouter>
        <DeadlinesWidget deadlines={[{ id: 1 }]} onSelectModule={null} />
      </MemoryRouter>
    );
    expect(screen.queryByText('Mock Module Click')).toBeNull();
  });

  it('renders DeadlineEmptyState with link to modules', () => {
    render(
      <MemoryRouter>
        <DeadlinesWidget deadlines={[]} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/modules');
    expect(link.className).toBe('taskWidgetLink');
  });
});
