import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PillFilters from '../../../components/Tags/PillFilters';

const mockTags = [
    { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
    { id: 2, label: 'Study', color: '#00ff00', icon: '📚' },
];

// Mock CSS modules
vi.mock('../../../components/Tags/PillFilters.module.css', () => ({
    default: { row: 'row', pill: 'pill', active: 'active', inactive: 'inactive', colorDot: 'dot', count: 'count' },
}));

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ tags: mockTags })),
}));

vi.mock('../../../components/Tags/TagManagerModal', () => ({
    default: ({ onClose }) => (
        <div data-testid="tag-manager-modal">
            <button onClick={onClose}>Close Modal</button>
        </div>
    ),
}));

vi.mock('../../../components/Tags/utils/pillUtils', () => ({
    countByType: vi.fn((items = []) => ({
        all: items.length,
        work: items.filter(i => (i.tag_details?.label || i.tag || '').toLowerCase() === 'work').length,
        study: items.filter(i => (i.tag_details?.label || i.tag || '').toLowerCase() === 'study').length,
    })),
}));

// Mock pillFilterOptions helpers so labels are plain (no counts)
vi.mock('../../../components/Tags/pill_filters/pillFilterOptions', () => ({
    createPillFilterOptions: (tags, counts) => [
        { value: 'all', label: 'All' },
        ...(tags || []).map(t => ({ value: t.label.toLowerCase(), label: t.label })),
    ],
    getActiveFilterLabel: (active, options) => {
        const found = options.find(o => {
            if (Array.isArray(active)) return active.includes(o.value);
            return o.value === active;
        });
        return found?.label || 'Filter';
    },
}));

// Mock AnimatedDropdown to render options as individual pill buttons
vi.mock('../../../components/common/animated_dropdown/AnimatedDropdown', () => ({
    default: ({ value, onChange, options, className }) => (
        <div>
            {(options || []).map(o => {
                const isActive = Array.isArray(value)
                    ? value.includes(o.value)
                    : value === o.value;
                return (
                    <button
                        key={o.value}
                        className={isActive ? 'active' : 'inactive'}
                        onClick={() => onChange(o.value)}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    ),
}));

// Mock lucide-react Filter icon used in FilterTriggerButton
vi.mock('lucide-react', () => ({
    Filter: () => <span data-testid="filter-icon" />,
}));

import { useTags } from '../../../context/TagContext';
import { countByType } from '../../../components/Tags/utils/pillUtils';

describe('PillFilters', () => {
    const defaultProps = {
        active: 'all',
        onChange: vi.fn(),
        items: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useTags.mockReturnValue({ tags: mockTags });
    });

    it('renders All pill and tag pills from context', () => {
        render(<PillFilters {...defaultProps} />);
        expect(screen.getByText('All')).toBeTruthy();
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Study')).toBeTruthy();
    });

    it('renders Manage Tags button', () => {
        render(<PillFilters {...defaultProps} />);
        expect(screen.getByLabelText('Manage Tags')).toBeTruthy();
    });

    it('calls onChange when a pill is clicked', () => {
        const onChange = vi.fn();
        render(<PillFilters {...defaultProps} onChange={onChange} />);
        fireEvent.click(screen.getByText('All'));
        expect(onChange).toHaveBeenCalledWith('all');
    });

    it('calls onChange with tag key when a tag pill is clicked', () => {
        const onChange = vi.fn();
        render(<PillFilters {...defaultProps} onChange={onChange} />);
        fireEvent.click(screen.getByText('Work'));
        expect(onChange).toHaveBeenCalledWith('work');
    });

    it('does not show TagManagerModal initially', () => {
        render(<PillFilters {...defaultProps} />);
        expect(screen.queryByTestId('tag-manager-modal')).toBeNull();
    });

    it('shows TagManagerModal when Manage Tags is clicked', () => {
        render(<PillFilters {...defaultProps} />);
        fireEvent.click(screen.getByLabelText('Manage Tags'));
        expect(screen.getByTestId('tag-manager-modal')).toBeTruthy();
    });

    it('closes TagManagerModal when onClose is called', () => {
        render(<PillFilters {...defaultProps} />);
        fireEvent.click(screen.getByLabelText('Manage Tags'));
        fireEvent.click(screen.getByText('Close Modal'));
        expect(screen.queryByTestId('tag-manager-modal')).toBeNull();
    });

    it('highlights active pill when active is string', () => {
        render(<PillFilters {...defaultProps} active="work" />);
        const workPill = screen.getByText('Work').closest('button');
        expect(workPill).toBeTruthy();
    });

    it('supports array active state (multi-select)', () => {
        render(<PillFilters {...defaultProps} active={['work', 'study']} />);
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Study')).toBeTruthy();
    });

    it('uses countByType with items for pill counts', () => {
        render(<PillFilters {...defaultProps} items={[{ id: 1 }, { id: 2 }]} />);
        expect(countByType).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });

    it('marks All pill as active when active is "all"', () => {
        render(<PillFilters {...defaultProps} active="all" />);
        const allBtn = screen.getByText('All').closest('button');
        expect(allBtn.className).toContain('active');
    });

    it('marks tag pill as active when active matches tag key', () => {
        render(<PillFilters {...defaultProps} active="work" />);
        const workBtn = screen.getByText('Work').closest('button');
        expect(workBtn.className).toContain('active');
    });

    it('handles array active state - pill is active when key is in array', () => {
        render(<PillFilters {...defaultProps} active={['all', 'work']} />);
        const allBtn = screen.getByText('All').closest('button');
        expect(allBtn.className).toContain('active');
        const workBtn = screen.getByText('Work').closest('button');
        expect(workBtn.className).toContain('active');
    });

    it('handles array active state - pill is inactive when key is not in array', () => {
        render(<PillFilters {...defaultProps} active={['all']} />);
        const workBtn = screen.getByText('Work').closest('button');
        expect(workBtn.className).toContain('inactive');
    });

    it('renders with empty tags list', () => {
        useTags.mockReturnValue({ tags: [] });
        render(<PillFilters {...defaultProps} />);
        expect(screen.getByText('All')).toBeTruthy();
        expect(screen.getByLabelText('Manage Tags')).toBeTruthy();
    });

    it('renders with no items prop', () => {
        render(<PillFilters active="all" onChange={vi.fn()} items={[]} />);
        expect(screen.getByText('All')).toBeTruthy();
    });
});
