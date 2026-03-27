/**
 * Tests for TableRow - Editable table row for calendar table view.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableRow } from '../../../../components/calendar/table_view/TableRow';
import { createMockEvent } from '../mocks/calendarMocks';

const mockRemoveEvent = vi.fn();
const mockQuickAction = { label: 'Join', onClick: vi.fn() };

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({ tags: [{ id: 1, label: 'Work', color: '#7B6751' }] }),
}));

vi.mock('../../../../components/calendar/hooks/useCalendarEvents', () => ({
    useEventActions: () => ({ removeEvent: mockRemoveEvent }),
}));

vi.mock('../../../../components/calendar/hooks/useQuickActions', () => ({
    useQuickActions: (event) => event.noQuickAction ? null : event.society_name ? mockQuickAction : null,
}));

vi.mock('../../../../components/calendar/utils/eventUtils', () => ({
    getEventType: (e) => e.module ? 'module' : e.society_name ? 'society' : 'personal',
    isReadOnlyEvent: (e) => !!e.module || !!e.society_name,
}));

vi.mock('../../../../components/calendar/utils/eventStyleUtils', () => ({
    getEventTheme: (event) => ({ color: event.noAccent ? undefined : '#7B6751' }),
}));

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
    isSameDay: (a, b) => a.toDateString() === b.toDateString(),
}));

vi.mock('../../../../components/calendar/table_view/cells/EditableCell', () => ({
    EditableCell: ({ value, isEditing, onChange, onKeyDown }) => isEditing
        ? <input data-testid="editable-input" value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} />
        : <span data-testid="cell-text">{value || '—'}</span>,
}));

vi.mock('../../../../components/calendar/table_view/cells/TagEditCell', () => ({
    TagEditCell: ({ event, onEdit }) => (
        <button type="button" data-testid="tag-cell" onClick={onEdit}>
            {event.tag?.name || event.tag_name || 'No tag'}
        </button>
    ),
}));

vi.mock('../../../../components/calendar/table_view/cells/LocationEditCell', () => ({
    LocationEditCell: ({ value, isEditing, onChange, onSave }) => isEditing
        ? <input data-testid="location-editor" value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onSave} />
        : <span data-testid="location-cell">{value || ''}</span>,
}));

vi.mock('../../../../components/calendar/table_view/cells/DateTimeCell', () => ({
    DateTimeCell: ({ event, onSave }) => (
        <button type="button" data-testid="date-cell" onClick={() => onSave('2026-03-16T09:00:00Z')}>
            {event.start_time}
        </button>
    ),
}));

vi.mock('../../../../components/common/confirm_modal/ConfirmModal', () => ({
    default: ({ onConfirm, onCancel }) => (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm Delete</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

const defaultEditState = { editingCell: null, cellValue: '', startEdit: vi.fn(), updateValue: vi.fn(), saveEdit: vi.fn(), cancelEdit: vi.fn(), saveDateTimes: vi.fn(), saveWithValue: vi.fn() };
const defaultNavState = { focusedCell: null, handleKeyDown: vi.fn(), EDITABLE_COLUMNS: ['title', 'tag', 'date', 'location', 'description'] };

function getTrashButton() {
    return screen.getAllByRole('button').find((button) => String(button.className).includes('trashBtn'));
}

describe('TableRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders event title', () => {
        render(<table><tbody><TableRow event={createMockEvent({ title: 'Meeting' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.getByText('Meeting')).toBeInTheDocument();
    });

    it('renders tag cell', () => {
        render(<table><tbody><TableRow event={createMockEvent({ tag_name: 'Work' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.getByTestId('tag-cell')).toBeInTheDocument();
    });

    it('renders date cell', () => {
        render(<table><tbody><TableRow event={createMockEvent()} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.getByTestId('date-cell')).toBeInTheDocument();
    });

    it('shows delete button for personal events', () => {
        render(<table><tbody><TableRow event={createMockEvent()} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(getTrashButton()).toBeInTheDocument();
    });

    it('hides delete button for read-only events', () => {
        render(<table><tbody><TableRow event={createMockEvent({ module: { id: 1, name: 'CS' } })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        // Delete button cell is empty for read-only - check for trash icon specifically
        const trashButtons = screen.queryAllByRole('button').filter(btn => btn.querySelector('svg'));
        expect(trashButtons.filter(btn => !btn.textContent.includes('Join'))).toHaveLength(0);
    });

    it('shows confirm modal when delete clicked', () => {
        render(<table><tbody><TableRow event={createMockEvent()} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(getTrashButton());
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });

    it('calls removeEvent on confirm delete', () => {
        render(<table><tbody><TableRow event={createMockEvent({ id: 42 })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(getTrashButton());
        fireEvent.click(screen.getByText('Confirm Delete'));
        expect(mockRemoveEvent).toHaveBeenCalledWith(42);
    });

    it('hides modal on cancel', () => {
        render(<table><tbody><TableRow event={createMockEvent()} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(getTrashButton());
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });

    it('calls onCellClick when cell clicked', () => {
        const onCellClick = vi.fn();
        render(<table><tbody><TableRow event={createMockEvent({ title: 'Test' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={onCellClick} viewMode="month" /></tbody></table>);
        fireEvent.click(screen.getByText('Test'));
        expect(onCellClick).toHaveBeenCalledWith(1, 'title', 'Test');
    });


    it('renders source badge for module events', () => {
        render(<table><tbody><TableRow event={createMockEvent({ module: { id: 1, name: 'CS101' } })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    it('renders source badge for society events', () => {
        render(<table><tbody><TableRow event={createMockEvent({ society_name: 'Chess Club' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });

    it('applies society badge colours when provided', () => {
        render(<table><tbody><TableRow event={createMockEvent({ society_name: 'Chess Club', society_color: '#123456' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.getByText('Chess Club').getAttribute('style')).toContain('background-color: rgb(18, 52, 86)');
    });

    it('toggles expansion on row click for read-only events', () => {
        const { container } = render(<table><tbody><TableRow event={createMockEvent({ module: { id: 1, name: 'CS' } })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        const row = container.querySelector('tr');
        fireEvent.click(row);
        // CSS modules hash class names, so check class contains 'expanded' pattern
        expect(row.className).toMatch(/expanded/i);
    });

    it('shows society quick action for read-only events and triggers it', () => {
        render(<table><tbody><TableRow event={createMockEvent({ society_name: 'Chess Club' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(screen.getByText('Join'));
        expect(mockQuickAction.onClick).toHaveBeenCalled();
    });

    it('renders a read-only row without a quick action when none is returned', () => {
        render(<table><tbody><TableRow event={createMockEvent({ society_name: 'Chess Club', noQuickAction: true })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        expect(screen.queryByText('Join')).not.toBeInTheDocument();
    });

    it('opens inline editing from keyboard navigation and passes tag identifiers', () => {
        const onCellClick = vi.fn();
        const editState = { ...defaultEditState, editingCell: { eventId: 1, field: 'location' }, cellValue: 'Library' };
        const navState = { ...defaultNavState, focusedCell: { row: 0, col: 1 } };

        render(<table><tbody><TableRow event={createMockEvent({ id: 1, tag_id: 9, location: 'Old location' })} rowIndex={0} editState={editState} navState={navState} onCellClick={onCellClick} viewMode="month" /></tbody></table>);

        expect(onCellClick).toHaveBeenCalledWith(1, 'tag', 9);
        expect(screen.getByTestId('location-editor')).toHaveValue('Library');
    });

    it('uses nested tag object, supports description editing, and keeps today rows highlighted outside day view', () => {
        const onCellClick = vi.fn();
        const event = createMockEvent({
            id: 1,
            tag: { id: 4, name: 'Nested Tag' },
            description: 'Long description',
            start_time: new Date().toISOString(),
        });
        const editState = { ...defaultEditState, editingCell: { eventId: 1, field: 'description' }, cellValue: 'Edited description' };

        const { container } = render(<table><tbody><TableRow event={event} rowIndex={0} editState={editState} navState={defaultNavState} onCellClick={onCellClick} viewMode="month" /></tbody></table>);

        fireEvent.click(screen.getByText('Nested Tag'));
        expect(onCellClick).toHaveBeenCalledWith(1, 'tag', { id: 4, name: 'Nested Tag' });
        expect(screen.getByDisplayValue('Edited description')).toBeInTheDocument();
        expect(container.querySelector('tr').className).toMatch(/todayRow/i);
    });

    it('does not mark rows as today in day view and supports hovered accent styling', () => {
        const { container } = render(<table><tbody><TableRow event={createMockEvent({ society_name: 'Chess Club', society_color: '#123456' })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="day" /></tbody></table>);
        const row = container.querySelector('tr');
        fireEvent.mouseEnter(row);
        expect(row.className).not.toMatch(/todayRow/i);
        expect(row.style.getPropertyValue('--accent')).toBe('#7B6751');
        expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });

    it('covers tag, date, location, description, and style fallbacks', () => {
        const stopPropagation = vi.fn();
        const onCellClick = vi.fn();
        const event = createMockEvent({
            id: 7,
            module: { id: 1, name: 'CS101' },
            location: 'Library',
            noAccent: true,
        });
        const editState = { ...defaultEditState, editingCell: { eventId: 7, field: 'location' }, cellValue: 'Edited library' };

        const { container } = render(<table><tbody><TableRow event={event} rowIndex={0} editState={editState} navState={defaultNavState} onCellClick={onCellClick} viewMode="month" /></tbody></table>);

        fireEvent.click(screen.getByTestId('tag-cell').closest('td'), { stopPropagation });
        fireEvent.click(screen.getByTestId('date-cell'));
        fireEvent.click(screen.getByTestId('location-editor').closest('td'));
        fireEvent.click(screen.getByText('—').closest('td'));

        expect(defaultEditState.saveDateTimes).toHaveBeenCalledWith(7, '2026-03-16T09:00:00Z');
        expect(onCellClick).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
        expect(screen.getByText('CS101').getAttribute('style')).toBeNull();
        expect(container.querySelector('tr').getAttribute('style')).toBeNull();
    });

    it('handles td propagation and forwards keydown handlers', () => {
        const stopSpy = vi.spyOn(Event.prototype, 'stopPropagation');
        const navState = { ...defaultNavState, handleKeyDown: vi.fn() };
        const editState = { ...defaultEditState, editingCell: { eventId: 12, field: 'title' } };
        const evt = createMockEvent({ id: 12, title: 'A', description: 'B' });
        const { rerender } = render(<table><tbody><TableRow event={evt} rowIndex={0} editState={editState} navState={navState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);

        fireEvent.click(screen.getByTestId('tag-cell').closest('td'));
        fireEvent.click(screen.getByTestId('date-cell').closest('td'));
        fireEvent.keyDown(screen.getByTestId('editable-input'), { key: 'Enter' });

        const nextEditState = { ...defaultEditState, editingCell: { eventId: 12, field: 'description' } };
        rerender(<table><tbody><TableRow event={evt} rowIndex={0} editState={nextEditState} navState={navState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.keyDown(screen.getByTestId('editable-input'), { key: 'Tab' });

        expect(stopSpy).toHaveBeenCalled();
        expect(navState.handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }), 0, 0);
        expect(navState.handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Tab' }), 0, 3);
        stopSpy.mockRestore();
    });

    it('shows editable hover icons on enter and hides on leave', () => {
        const evt = createMockEvent({ id: 12, title: 'A', description: 'B' });
        const { container } = render(<table><tbody><TableRow event={evt} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        const row = container.querySelector('tr');
        
        fireEvent.mouseEnter(row);
        fireEvent.mouseLeave(row);
        
        const svgClass = row.querySelector('svg')?.className.baseVal || row.querySelector('svg')?.getAttribute('class');
        expect(svgClass).not.toMatch(/editIconVisible/i);
    });
});
