/**
 * Tests for TagEditCell - Tag selection cell for table view.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagEditCell } from '../../../../../components/Calendar/TableView/cells/TagEditCell';
import { createMockEvent, mockTags } from '../../mocks/calendarMocks';

vi.mock('../../../../../components/Common/AnimatedDropdown', () => ({
    default: ({ value, onChange, options }) => (
        <select data-testid="tag-dropdown" value={value} onChange={e => onChange(e.target.value)}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    ),
}));

const defaultTheme = { color: '#7B6751' };

describe('TagEditCell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders tag badge when event has tag_name', () => {
        render(<TagEditCell event={createMockEvent({ tag_name: 'Work' })} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={false} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('renders tag badge when event has nested tag.name', () => {
        render(<TagEditCell event={createMockEvent({ tag: { name: 'Personal' } })} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={false} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('renders empty state when no tag', () => {
        const { container } = render(<TagEditCell event={createMockEvent({ tag_name: null, tag: null })} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={false} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('renders dropdown when editing', () => {
        render(<TagEditCell event={createMockEvent()} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={true} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(screen.getByTestId('tag-dropdown')).toBeInTheDocument();
    });

    it('calls onEdit when tag cell clicked', () => {
        const onEdit = vi.fn();
        render(<TagEditCell event={createMockEvent({ tag_name: 'Work' })} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={false} editValue="" onEdit={onEdit} onSave={vi.fn()} />);
        fireEvent.click(screen.getByText('Work'));
        expect(onEdit).toHaveBeenCalled();
    });

    it('does not call onEdit when read-only', () => {
        const onEdit = vi.fn();
        render(<TagEditCell event={createMockEvent({ tag_name: 'Work' })} tags={mockTags} theme={defaultTheme} isReadOnly={true} isEditing={false} editValue="" onEdit={onEdit} onSave={vi.fn()} />);
        fireEvent.click(screen.getByText('Work'));
        expect(onEdit).not.toHaveBeenCalled();
    });

    it('calls onSave when dropdown value changes', () => {
        const onSave = vi.fn();
        render(<TagEditCell event={createMockEvent()} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={true} editValue="" onEdit={vi.fn()} onSave={onSave} />);
        fireEvent.change(screen.getByTestId('tag-dropdown'), { target: { value: '1' } });
        expect(onSave).toHaveBeenCalledWith('1');
    });

    it('includes No tag option in dropdown', () => {
        render(<TagEditCell event={createMockEvent()} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={true} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(screen.getByText('No tag')).toBeInTheDocument();
    });

    it('applies tag color as background', () => {
        const { container } = render(<TagEditCell event={createMockEvent({ tag_name: 'Work' })} tags={mockTags} theme={{ color: '#ff0000' }} isReadOnly={false} isEditing={false} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        const badge = container.querySelector('span[class*="tagBadge"]');
        expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('hides edit icon when read-only', () => {
        const { container } = render(<TagEditCell event={createMockEvent({ tag_name: 'Work' })} tags={mockTags} theme={defaultTheme} isReadOnly={true} isEditing={false} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows edit icon when not read-only', () => {
        const { container } = render(<TagEditCell event={createMockEvent({ tag_name: 'Work' })} tags={mockTags} theme={defaultTheme} isReadOnly={false} isEditing={false} editValue="" onEdit={vi.fn()} onSave={vi.fn()} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
