import { useRef, useEffect } from 'react';
import { useCalendarData } from '../../../context/CalendarContext';
import { useTableEdit } from '../hooks/useTableEdit';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { TableRow } from './TableRow';
import styles from './TableView.module.css';

const COLUMNS = [
    { key: 'title', label: 'Name' },
    { key: 'tag', label: 'Tag' },
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'description', label: 'Description' },
];

function TableHeader() {
    return (
        <thead className={styles.header}>
            <tr>
                {COLUMNS.map(col => (
                    <th key={col.key} className={styles.headerCell}>{col.label}</th>
                ))}
            </tr>
        </thead>
    );
}

function EmptyState() {
    return (
        <tr>
            <td colSpan={COLUMNS.length} className={styles.emptyState}>
                No events to display
            </td>
        </tr>
    );
}

function sortByStartTime(events) {
    return [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

function useClickOutside(ref, callback, isActive) {
    useEffect(() => {
        if (!isActive) return;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) callback();
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ref, callback, isActive]);
}

export function TableView({ selectedDate: propDate, events: propEvents }) {
    const tableRef = useRef(null);
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const sortedEvents = sortByStartTime(data.events || []);

    const editState = useTableEdit(sortedEvents);
    const { handleKeyDown } = useKeyboardNav(
        sortedEvents.length,
        editState.startEdit,
        editState.saveEdit,
        editState.cancelEdit
    );

    useClickOutside(tableRef, editState.saveEdit, !!editState.editingCell);

    const onCellClick = (eventId, field, value) => {
        editState.startEdit(eventId, field, value);
    };

    return (
        <div className={styles.container}>
            <table ref={tableRef} className={styles.table}>
                <TableHeader />
                <tbody>
                    {!sortedEvents.length && <EmptyState />}
                    {sortedEvents.map((event, index) => (
                        <TableRow
                            key={event.id}
                            event={event}
                            rowIndex={index}
                            editState={editState}
                            onCellClick={onCellClick}
                            onKeyDown={handleKeyDown}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
