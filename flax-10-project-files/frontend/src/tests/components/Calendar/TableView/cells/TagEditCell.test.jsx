/**
 * Tests for TagEditCell - Tag selection cell for table view.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagEditCell } from '../../../../../components/Calendar/TableView/cells/TagEditCell';
import { createMockEvent, mockTags } from '../../mocks/calendarMocks';

vi.mock('../../../../../components/common/AnimatedDropdown', () => ({
    default: ({ value, onChange, options }) => (
        <select data-testid="tag-dropdown" value={value} onChange={e => onChange(e.target.value)}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    ),
}));

const defaultTheme = { color: '#7B6751' };

function renderTagEditCell(overrideProps = {}) {
    const props = {
        event: createMockEvent(),
        tags: mockTags,
        theme: defaultTheme,
        isReadOnly: false,
        isEditing: false,
        editValue: '',
        onEdit: vi.fn(),
        onSave: vi.fn(),
        ...overrideProps,
    };
    return render(<TagEditCell {...props} />);
}

describe('TagEditCell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders tag badge when event has tag_name', () => {
        renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }) });
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('renders tag badge when event has nested tag.name', () => {
        renderTagEditCell({ event: createMockEvent({ tag: { name: 'Personal' } }) });
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('renders empty state when no tag', () => {
        const { container } = renderTagEditCell({ event: createMockEvent({ tag_name: null, tag: null }) });
        expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('renders dropdown when editing', () => {
        renderTagEditCell({ isEditing: true });
        expect(screen.getByTestId('tag-dropdown')).toBeInTheDocument();
    });

    it('calls onEdit when tag cell clicked', () => {
        const onEdit = vi.fn();
        renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }), onEdit });
        fireEvent.click(screen.getByText('Work'));
        expect(onEdit).toHaveBeenCalled();
    });

    it('does not call onEdit when read-only', () => {
        const onEdit = vi.fn();
        renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }), isReadOnly: true, onEdit });
        fireEvent.click(screen.getByText('Work'));
        expect(onEdit).not.toHaveBeenCalled();
    });

    it('calls onSave when dropdown value changes', () => {
        const onSave = vi.fn();
        renderTagEditCell({ isEditing: true, onSave });
        fireEvent.change(screen.getByTestId('tag-dropdown'), { target: { value: '1' } });
        expect(onSave).toHaveBeenCalledWith('1');
    });

    it('includes No tag option in dropdown', () => {
        renderTagEditCell({ isEditing: true });
        expect(screen.getByText('No tag')).toBeInTheDocument();
    });

    it('applies tag color as background', () => {
        const { container } = renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }), theme: { color: '#ff0000' } });
        const badge = container.querySelector('span[class*="tagBadge"]');
        expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('renders tags without inline colors when no theme color is provided', () => {
        const { container } = renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }), theme: {} });
        const badge = container.querySelector('span[class*="tagBadge"]');
        expect(badge).not.toHaveStyle({ color: 'white' });
    });

    it('hides edit icon when read-only', () => {
        const { container } = renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }), isReadOnly: true });
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('shows edit icon when not read-only', () => {
        const { container } = renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }) });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies the hovered icon class for filled and empty tag cells', () => {
        const { container, rerender } = renderTagEditCell({ event: createMockEvent({ tag_name: 'Work' }), isRowHovered: true });
        expect(container.querySelector('svg')?.getAttribute('class')).toContain('tagEditIconVisible');

        rerender(<TagEditCell
            event={createMockEvent({ tag_name: null, tag: null })}
            tags={mockTags}
            theme={defaultTheme}
            isReadOnly={false}
            isEditing={false}
            editValue=""
            onEdit={vi.fn()}
            onSave={vi.fn()}
            isRowHovered={true}
        />);
        expect(container.querySelector('svg')?.getAttribute('class')).toContain('tagEditIconVisible');
    });
});
