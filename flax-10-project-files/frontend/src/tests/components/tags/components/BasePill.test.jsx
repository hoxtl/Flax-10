import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BasePill from '../../../../components/tags/components/BasePill';

vi.mock('../../../../components/tags/styles/PillFilters.module.css', () => ({ default: { pill: 'pill', active: 'active', inactive: 'inactive', colorDot: 'dot', count: 'count' } }));

describe('BasePill', () => {
  it('renders label and calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<BasePill label="Lecture" onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /Lecture/ });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it('shows count when provided', () => {
    render(<BasePill label="Lab" count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies active class when isActive', () => {
    render(<BasePill label="All" isActive={true} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('active');
  });

  it('applies color style when isActive and color set', () => {
    render(<BasePill label="Tag" isActive={true} color="#abc" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ backgroundColor: '#abc' });
  });

  it('renders color dot when color set and not active', () => {
    const { container } = render(<BasePill label="Tag" color="#def" isActive={false} />);
    expect(container.querySelector('.dot')).toBeInTheDocument();
  });
});
