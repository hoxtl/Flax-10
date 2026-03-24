import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomepageSkeleton } from '../../../pages/Homepage/components/HomepageSkeleton';

vi.mock('../../../components/common/LoadingState/SkeletonBlock', () => ({
  default: ({ className }) => <div data-testid="skeleton-block" className={className} />,
}));

describe('HomepageSkeleton', () => {
  it('renders skeleton blocks while loading', () => {
    render(<HomepageSkeleton />);
    const blocks = screen.getAllByTestId('skeleton-block');
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('has aria-busy attribute for accessibility', () => {
    const { container } = render(<HomepageSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
