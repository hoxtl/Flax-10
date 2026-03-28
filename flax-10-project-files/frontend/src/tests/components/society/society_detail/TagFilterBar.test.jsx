import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../components/common/tags_selector/TagsSelector', () => ({
    TagsSelector: ({ tags, selectedTags, onSelectionChange }) => {
        const isSelected = (tag) => selectedTags.some((selected) => selected.id === tag.id);
        const selected = tags.filter(isSelected);
        const unselected = tags.filter((tag) => !isSelected(tag));

        return (
            <div>
                {selected.map((tag) => (
                    <button
                        key={`selected-${tag.id}`}
                        data-testid={`selected-${tag.label}`}
                        data-active="true"
                        onClick={() => onSelectionChange(selected.filter((item) => item.id !== tag.id))}
                    >
                        {tag.label}
                    </button>
                ))}
                {unselected.map((tag) => (
                    <button
                        key={`option-${tag.id}`}
                        data-testid={`option-${tag.label}`}
                        data-active="false"
                        onClick={() => onSelectionChange([...selected, tag])}
                    >
                        {tag.label}
                    </button>
                ))}
            </div>
        );
    },
}));

import TagFilterBar from '../../../../components/society/society_detail/tags/TagFilterBar';

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
        expect(screen.getByTestId('selected-All')).toBeTruthy();
        expect(screen.getByTestId('option-Sports')).toBeTruthy();
        expect(screen.getByTestId('option-Music')).toBeTruthy();
    });

    it('All pill is active when no active filters', () => {
        render(<TagFilterBar tags={mockTags} activeFilters={[]} onFilterChange={vi.fn()} />);
        expect(screen.getByTestId('selected-All').getAttribute('data-active')).toBe('true');
    });

    it('All pill is inactive when filters are set', () => {
        render(<TagFilterBar tags={mockTags} activeFilters={[1]} onFilterChange={vi.fn()} />);
        expect(screen.getByTestId('option-All').getAttribute('data-active')).toBe('false');
    });

    it('clicking All calls onFilterChange with empty array', () => {
        const onFilterChange = vi.fn();
        render(<TagFilterBar tags={mockTags} activeFilters={[1]} onFilterChange={onFilterChange} />);
        fireEvent.click(screen.getByTestId('option-All'));
        expect(onFilterChange).toHaveBeenCalledWith([]);
    });

    it('clicking a tag adds it to active filters', () => {
        const onFilterChange = vi.fn();
        render(<TagFilterBar tags={mockTags} activeFilters={[]} onFilterChange={onFilterChange} />);
        fireEvent.click(screen.getByTestId('option-Sports'));
        expect(onFilterChange).toHaveBeenCalledWith([1]);
    });

    it('clicking an active tag removes it from active filters', () => {
        const onFilterChange = vi.fn();
        render(<TagFilterBar tags={mockTags} activeFilters={[1]} onFilterChange={onFilterChange} />);
        fireEvent.click(screen.getByTestId('selected-Sports'));
        expect(onFilterChange).toHaveBeenCalledWith([]);
    });
});
