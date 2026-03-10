import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PillFilters from '../../../components/Tags/PillFilters';

// Mock CSS modules
vi.mock('../../../components/Tags/PillFilters.module.css', () => ({
    default: { row: 'row', pill: 'pill', active: 'active', inactive: 'inactive', colorDot: 'dot', count: 'count' },
}));

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({
        tags: [
            { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
            { id: 2, label: 'Study', color: '#00ff00', icon: '📚' },
        ],
    })),
}));

vi.mock('../../../components/Tags/TagManagerModal', () => ({
    default: ({ onClose }) => (
        <div data-testid="tag-manager-modal">
            <button onClick={onClose}>Close Modal</button>
        </div>
    ),
}));

vi.mock('../../../components/Tags/utils/pillUtils', () => ({
    countByType: vi.fn(() => ({ all: 3, work: 2, study: 1 })),
}));

import { useTags } from '../../../context/TagContext';

describe('PillFilters', () => {
    const defaultProps = {
        active: 'all',
        onChange: vi.fn(),
        items: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useTags.mockReturnValue({
            tags: [
                { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
                { id: 2, label: 'Study', color: '#00ff00', icon: '📚' },
            ],
        });
    });

    it('renders the All pill', () => {
        render(<PillFilters {...defaultProps} />);
        expect(screen.getByText('All')).toBeTruthy();
    });

    it('renders tag pills from context', () => {
        render(<PillFilters {...defaultProps} />);
        expect(screen.getByText('Work')).toBeTruthy();
        expect(screen.getByText('Study')).toBeTruthy();
    });

    it('renders the manage tags button', () => {
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

    it('shows TagManagerModal when manage button is clicked', () => {
        render(<PillFilters {...defaultProps} />);
        fireEvent.click(screen.getByLabelText('Manage Tags'));
        expect(screen.getByTestId('tag-manager-modal')).toBeTruthy();
    });

    it('hides TagManagerModal when onClose is called', () => {
        render(<PillFilters {...defaultProps} />);
        fireEvent.click(screen.getByLabelText('Manage Tags'));
        expect(screen.getByTestId('tag-manager-modal')).toBeTruthy();
        fireEvent.click(screen.getByText('Close Modal'));
        expect(screen.queryByTestId('tag-manager-modal')).toBeNull();
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
