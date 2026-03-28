import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupWorkDetailSkeleton from '@/pages/group_work/components/GroupWorkDetailSkeleton';
import GroupWorkIndexSkeleton from '@/pages/group_work/components/GroupWorkIndexSkeleton';

describe('GroupWorkDetailSkeleton', () => {
  it('renders the skeleton container with correct testid', () => {
    render(<GroupWorkDetailSkeleton onBack={vi.fn()} />);
    expect(screen.getByTestId('groupwork-skeleton')).toBeTruthy();
  });

  it('marks container as aria-busy while loading', () => {
    render(<GroupWorkDetailSkeleton onBack={vi.fn()} />);
    expect(screen.getByTestId('groupwork-skeleton')).toHaveAttribute('aria-busy', 'true');
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(<GroupWorkDetailSkeleton onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to All Projects' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders multiple skeleton sections', () => {
    const { container } = render(<GroupWorkDetailSkeleton onBack={vi.fn()} />);
    expect(container.querySelectorAll('section').length).toBeGreaterThan(0);
  });
});

describe('GroupWorkIndexSkeleton', () => {
  it('renders the index skeleton container', () => {
    render(<GroupWorkIndexSkeleton />);
    expect(screen.getByTestId('groupwork-skeleton')).toBeTruthy();
  });
});
