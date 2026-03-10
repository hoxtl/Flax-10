import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../components/Tags/BasePill', () => ({
    default: ({ label, isActive, onClick }) => (
        <button
            data-testid={`pill-${label}`}
            data-active={isActive ? 'true' : 'false'}
            onClick={onClick}
        >
            {label}
        </button>
    ),
}));

import TagFilterBar from '../../../components/Society/SocietyDetail/tags/TagFilterBar';

const mockTags = [
    { id: 1, label: 'Sports', color: '#ff0000' },
    { id: 2, label: 'Music', color: '#00ff00' },
];

describe('TagFilterBar', () => {
    it('returns null when tags is empty', () => {
        const { container } = render(<TagFilterBar tags={[]} onFilterChange={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when tags is undefined', () => {
        const { container } = render(<TagFilterBar onFilterChange={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders All pill and tag pills', () => {
        render(<TagFilterBar tags={mockTags} onFilterChange={vi.fn()} />);
        expect(screen.getByTestId('pill-All')).toBeTruthy();
        expect(screen.getByTestId('pill-Sports')).toBeTruthy();
        expect(screen.getByTestId('pill-Music')).toBeTruthy();
    });

    it('All pill is active when no active filters', () => {
        render(<TagFilterBar tags={mockTags} activeFilters={[]} onFilterChange={vi.fn()} />);
        expect(screen.getByTestId('pill-All').getAttribute('data-active')).toBe('true');
    });

    it('All pill is inactive when filters are set', () => {
        render(<TagFilterBar tags={mockTags} activeFilters={[1]} onFilterChange={vi.fn()} />);
        expect(screen.getByTestId('pill-All').getAttribute('data-active')).toBe('false');
    });

    it('clicking All calls onFilterChange with empty array', () => {
        const onFilterChange = vi.fn();
        render(<TagFilterBar tags={mockTags} activeFilters={[1]} onFilterChange={onFilterChange} />);
        fireEvent.click(screen.getByTestId('pill-All'));
        expect(onFilterChange).toHaveBeenCalledWith([]);
    });

    it('clicking a tag adds it to active filters', () => {
        const onFilterChange = vi.fn();
        render(<TagFilterBar tags={mockTags} activeFilters={[]} onFilterChange={onFilterChange} />);
        fireEvent.click(screen.getByTestId('pill-Sports'));
        expect(onFilterChange).toHaveBeenCalledWith([1]);
    });

    it('clicking an active tag removes it from active filters', () => {
        const onFilterChange = vi.fn();
        render(<TagFilterBar tags={mockTags} activeFilters={[1]} onFilterChange={onFilterChange} />);
        fireEvent.click(screen.getByTestId('pill-Sports'));
        expect(onFilterChange).toHaveBeenCalledWith([]);
    });
});
