/*
 * Tests for the FilterButton and PageSkeleton components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterButton from '../../../../components/common/filter_button/FilterButton';
import PageSkeleton from '../../../../components/common/loading_state/PageSkeleton';

vi.mock('../../../../components/common/filter_button/FilterButton.module.css', () => ({
  default: { filterBtn: 'filterBtn', filterBtnActive: 'filterBtnActive', badge: 'badge' },
}));

vi.mock('../../../../components/common/loading_state/PageSkeleton.module.css', () => ({
  default: {
    container: 'container', srOnly: 'srOnly', header: 'header',
    title: 'title', action: 'action', search: 'search', grid: 'grid', card: 'card',
  },
}));

vi.mock('../../../../components/common/loading_state/SkeletonBlock', () => ({
  default: ({ className, style }) => <div className={className} style={style} data-testid="skeleton-block" />,
}));

describe('FilterButton', () => {
  it('renders a button with the text "Filter"', () => {
    render(<FilterButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('calls onClick when the button is clicked', () => {
    const onClick = vi.fn();
    render(<FilterButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('does not show a badge when activeCount is zero', () => {
    render(<FilterButton activeCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows a badge with the active filter count', () => {
    render(<FilterButton activeCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('sets aria-expanded to true when isOpen is true', () => {
    render(<FilterButton isOpen={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-expanded to false by default', () => {
    render(<FilterButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-haspopup="dialog"', () => {
    render(<FilterButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('merges an additional className', () => {
    render(<FilterButton className="extra" />);
    expect(screen.getByRole('button').className).toContain('extra');
  });
});

describe('PageSkeleton', () => {
  it('renders with aria-busy="true"', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the sr-only label text', () => {
    render(<PageSkeleton label="Loading content" />);
    expect(screen.getByText('Loading content')).toBeInTheDocument();
  });

  it('uses the default label when none is provided', () => {
    render(<PageSkeleton />);
    expect(screen.getByText('Loading page')).toBeInTheDocument();
  });

  it('renders a skeleton block for the action when showAction is true', () => {
    const { container } = render(<PageSkeleton showAction />);
    const blocks = container.querySelectorAll('[data-testid="skeleton-block"]');
    expect(blocks.length).toBeGreaterThan(1);
  });

  it('renders a search skeleton when showSearch is true', () => {
    const { container } = render(<PageSkeleton showSearch />);
    const blocks = container.querySelectorAll('[data-testid="skeleton-block"]');
    expect(blocks.length).toBeGreaterThan(1);
  });

  it('renders the given number of card skeletons', () => {
    const { container } = render(<PageSkeleton cardCount={4} />);
    const blocks = container.querySelectorAll('.card');
    expect(blocks.length).toBe(4);
  });

  it('sets the data-testid when testId prop is provided', () => {
    render(<PageSkeleton testId="my-skeleton" />);
    expect(screen.getByTestId('my-skeleton')).toBeInTheDocument();
  });
});
