/**
 * Tests for TableRow - Editable table row for calendar table view.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableRow } from '../../../../components/Calendar/TableView/TableRow';
import { createMockEvent } from '../mocks/calendarMocks';

const mockRemoveEvent = vi.fn();
const mockQuickAction = { label: 'Join', onClick: vi.fn() };

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({ tags: [{ id: 1, label: 'Work', color: '#7B6751' }] }),
}));

vi.mock('../../../../components/Calendar/hooks/useCalendarEvents', () => ({
    useEventActions: () => ({ removeEvent: mockRemoveEvent }),
}));

vi.mock('../../../../components/Calendar/hooks/useQuickActions', () => ({
    useQuickActions: (event) => event.society_name ? mockQuickAction : null,
}));

vi.mock('../../../../components/Calendar/utils/eventUtils', () => ({
    getEventType: (e) => e.module ? 'module' : e.society_name ? 'society' : 'personal',
    isReadOnlyEvent: (e) => !!e.module || !!e.society_name,
}));

vi.mock('../../../../components/Calendar/utils/eventStyleUtils', () => ({
    getEventTheme: () => ({ color: '#7B6751' }),
}));

vi.mock('../../../../components/Calendar/utils/dateUtils', () => ({
    isSameDay: (a, b) => a.toDateString() === b.toDateString(),
}));

vi.mock('../../../../components/Calendar/TableView/cells/EditableCell', () => ({
    EditableCell: ({ value, isEditing, onChange }) => isEditing
        ? <input data-testid="editable-input" value={value} onChange={e => onChange(e.target.value)} />
        : <span data-testid="cell-text">{value || '—'}</span>,
}));

vi.mock('../../../../components/Calendar/TableView/cells/TagEditCell', () => ({
    TagEditCell: ({ event }) => <span data-testid="tag-cell">{event.tag_name || 'No tag'}</span>,
}));

vi.mock('../../../../components/Calendar/TableView/cells/DateTimeCell', () => ({
    DateTimeCell: ({ event }) => <span data-testid="date-cell">{event.start_time}</span>,
}));

vi.mock('../../../../components/Common/ConfirmModal/ConfirmModal', () => ({
    default: ({ onConfirm, onCancel }) => (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm}>Confirm Delete</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

const defaultEditState = { editingCell: null, cellValue: '', startEdit: vi.fn(), updateValue: vi.fn(), saveEdit: vi.fn(), cancelEdit: vi.fn(), saveDateTimes: vi.fn(), saveWithValue: vi.fn() };
const defaultNavState = { focusedCell: null, handleKeyDown: vi.fn(), EDITABLE_COLUMNS: ['title', 'tag', 'date', 'location', 'description'] };

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
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('hides delete button for read-only events', () => {
        render(<table><tbody><TableRow event={createMockEvent({ module: { id: 1, name: 'CS' } })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        // Delete button cell is empty for read-only - check for trash icon specifically
        const trashButtons = screen.queryAllByRole('button').filter(btn => btn.querySelector('svg'));
        expect(trashButtons.filter(btn => !btn.textContent.includes('Join'))).toHaveLength(0);
    });

    it('shows confirm modal when delete clicked', () => {
        render(<table><tbody><TableRow event={createMockEvent()} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });

    it('calls removeEvent on confirm delete', () => {
        render(<table><tbody><TableRow event={createMockEvent({ id: 42 })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Confirm Delete'));
        expect(mockRemoveEvent).toHaveBeenCalledWith(42);
    });

    it('hides modal on cancel', () => {
        render(<table><tbody><TableRow event={createMockEvent()} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        fireEvent.click(screen.getByRole('button'));
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

    it('toggles expansion on row click for read-only events', () => {
        const { container } = render(<table><tbody><TableRow event={createMockEvent({ module: { id: 1, name: 'CS' } })} rowIndex={0} editState={defaultEditState} navState={defaultNavState} onCellClick={vi.fn()} viewMode="month" /></tbody></table>);
        const row = container.querySelector('tr');
        fireEvent.click(row);
        // CSS modules hash class names, so check class contains 'expanded' pattern
        expect(row.className).toMatch(/expanded/i);
    });
});
