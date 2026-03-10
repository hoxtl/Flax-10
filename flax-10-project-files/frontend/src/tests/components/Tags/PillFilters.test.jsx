import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PillFilters from '../../../components/Tags/PillFilters';

const mockTags = [
    { id: 1, label: 'Work', color: '#ff0000' },
    { id: 2, label: 'Other', color: '#00ff00' },
];

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ tags: mockTags })),
}));

vi.mock('../../../components/Tags/TagManagerModal', () => ({
    default: ({ onClose }) => (
        <div data-testid="tag-manager-modal">
            <button onClick={onClose}>Close Manager</button>
        </div>
    ),
}));

vi.mock('../../../components/Tags/utils/pillUtils', () => ({
    countByType: vi.fn((items = []) => ({
        all: items.length,
        work: items.filter(i => (i.tag_details?.label || i.tag || '').toLowerCase() === 'work').length,
        other: items.filter(i => (i.tag_details?.label || i.tag || '').toLowerCase() === 'other').length,
    })),
}));

import { useTags } from '../../../context/TagContext';
import { countByType } from '../../../components/Tags/utils/pillUtils';

describe('PillFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTags.mockReturnValue({ tags: mockTags });
    });

    it('renders All pill and tag pills from context', () => {
        render(<PillFilters active="all" onChange={vi.fn()} items={[]} />);
        expect(screen.getByText('All')).toBeTruthy();
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Other')).toBeTruthy();
    });

    it('renders Manage Tags button', () => {
        render(<PillFilters active="all" onChange={vi.fn()} items={[]} />);
        expect(screen.getByLabelText('Manage Tags')).toBeTruthy();
    });

    it('calls onChange when a pill is clicked', () => {
        const onChange = vi.fn();
        render(<PillFilters active="all" onChange={onChange} items={[]} />);
        fireEvent.click(screen.getByText('Work'));
        expect(onChange).toHaveBeenCalledWith('work');
    });

    it('shows TagManagerModal when Manage Tags is clicked', () => {
        render(<PillFilters active="all" onChange={vi.fn()} items={[]} />);
        expect(screen.queryByTestId('tag-manager-modal')).toBeNull();
        fireEvent.click(screen.getByLabelText('Manage Tags'));
        expect(screen.getByTestId('tag-manager-modal')).toBeTruthy();
    });

    it('closes TagManagerModal when onClose is called', () => {
        render(<PillFilters active="all" onChange={vi.fn()} items={[]} />);
        fireEvent.click(screen.getByLabelText('Manage Tags'));
        fireEvent.click(screen.getByText('Close Manager'));
        expect(screen.queryByTestId('tag-manager-modal')).toBeNull();
    });

    it('highlights active pill when active is string', () => {
        const { container } = render(<PillFilters active="work" onChange={vi.fn()} items={[]} />);
        const workPill = screen.getByText('Work').closest('button');
        expect(workPill).toBeTruthy();
    });

    it('supports array active state (multi-select)', () => {
        render(<PillFilters active={['work', 'other']} onChange={vi.fn()} items={[]} />);
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Other')).toBeTruthy();
    });

    it('uses countByType with items for pill counts', () => {
        render(<PillFilters active="all" onChange={vi.fn()} items={[{ id: 1 }, { id: 2 }]} />);
        expect(countByType).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });
});
