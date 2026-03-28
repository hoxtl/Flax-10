import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyStateCard from '../../../../pages/homepage/components/EmptyStateCard';

vi.mock('../../../../pages/homepage/components/EmptyStateCard.module.css', () => ({
  default: {
    wrap: 'wrap',
    illustration: 'illustration',
    illustrationWrap: 'illustrationWrap',
    customIcon: 'customIcon',
    message: 'message',
    sub: 'sub',
    action: 'action',
    doneCircle: 'doneCircle',
    doneCheck: 'doneCheck',
  },
}));

describe('EmptyStateCard', () => {
  it('renders default message and sub when no props provided', () => {
    render(<EmptyStateCard />);
    expect(screen.getByText("All caught up. You've earned your rest.")).toBeTruthy();
    expect(screen.getByText('No overdue or due-soon tasks.')).toBeTruthy();
  });

  it('renders custom sub when provided', () => {
    render(<EmptyStateCard sub="No tasks today" />);
    expect(screen.getByText('No tasks today')).toBeTruthy();
  });

  it('renders custom message override', () => {
    render(<EmptyStateCard message="Great job!" />);
    expect(screen.getByText('Great job!')).toBeTruthy();
  });

  it('renders action element when provided', () => {
    render(<EmptyStateCard action={<button>Add Task</button>} />);
    expect(screen.getByRole('button', { name: 'Add Task' })).toBeTruthy();
  });

  it('renders custom icon when provided', () => {
    const CustomIcon = ({ className, size, strokeWidth }) => (
      <svg data-testid="custom-icon" className={className} width={size} height={size} strokeWidth={strokeWidth} />
    );
    render(<EmptyStateCard icon={CustomIcon} />);
    const icon = screen.getByTestId('custom-icon');
    expect(icon).toBeTruthy();
    expect(icon.classList.contains('customIcon')).toBe(true);
  });

  it('renders DoneIcon fallback when no icon is provided', () => {
    const { container } = render(<EmptyStateCard />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.querySelector('circle')).toBeTruthy();
    expect(svg.querySelector('path')).toBeTruthy();
  });

  it('does not render sub when explicitly set to null', () => {
    render(<EmptyStateCard sub={null} />);
    expect(screen.queryByText('No overdue or due-soon tasks.')).toBeNull();
  });

  it('applies illustrationWrap class only when Icon is provided', () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />;
    const { container } = render(<EmptyStateCard icon={CustomIcon} />);
    const illustrationWrap = container.querySelector('.illustrationWrap');
    expect(illustrationWrap).toBeTruthy();
  });
});
