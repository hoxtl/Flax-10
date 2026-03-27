/**
 * TableView - Spreadsheet-style calendar view with inline editing.
 * Displays events in rows with editable columns and keyboard navigation.
 */

import { useRef, useEffect } from 'react';
import { useCalendar, useCalendarData } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';
import { useTableEdit } from '../hooks/useTableEdit';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { usePagination } from '../../../hooks/usePagination';
import { TableRow } from './TableRow';
import { Pagination, BackToTop } from '../../pagination/Pagination';
import styles from './TableView.module.css';
import { sortByStartTime } from '../utils/eventUtils';

const COLUMNS = [
    { key: 'title', label: 'Name' },
    { key: 'tag', label: 'Tag' },
    { key: 'date', label: 'Date' },
    { key: 'location', label: 'Location' },
    { key: 'description', label: 'Description' },
    { key: 'actions', label: '' },
];

const PAGE_SIZE = 10;
const SCROLL_SELECTOR = '[data-table-view]';

function TableHeader() {
    return (
        <thead className={styles.header}>
            <tr>
                {COLUMNS.map(col => <th key={col.key} className={styles.headerCell}>{col.label}</th>)}
            </tr>
        </thead>
    );
}

function EmptyState() {
    return (
        <tr>
            <td colSpan={COLUMNS.length} className={styles.emptyState}>No events to display</td>
        </tr>
    );
}

function TableBody({ currentItems, editState, navState, viewMode, readOnly }) {
    if (!currentItems.length) return <tbody><EmptyState /></tbody>;
    return (
        <tbody>
            {currentItems.map((event, index) => (
                <TableRow
                    key={event.id}
                    event={event}
                    rowIndex={index}
                    editState={editState}
                    navState={navState}
                    onCellClick={(eventId, field, value) => editState.startEdit(eventId, field, value)}
                    viewMode={viewMode}
                    readOnly={readOnly}
                />
            ))}
        </tbody>
    );
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

function useTableViewData(propDate, propEvents) {
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const { tags } = useTags();
    const sortedEvents = sortByStartTime(data.events || []);
    const pagination = usePagination(sortedEvents, PAGE_SIZE);
    const editState = useTableEdit(pagination.currentItems, tags);
    const navState = useKeyboardNav(pagination.currentItems.length, editState.startEdit, editState.saveEdit, editState.cancelEdit);
    return { data, pagination, editState, navState };
}

/** Spreadsheet-style table view with inline cell editing and pagination. */

export function TableView({ selectedDate, events, readOnly = false }) {
    const tableRef = useRef(null);
    const { data, pagination, editState, navState } = useTableViewData(selectedDate, events);
    const { readOnly: contextReadOnly } = useCalendar();
    const isReadOnly = readOnly || contextReadOnly;
    useClickOutside(tableRef, editState.saveEdit, !!editState.editingCell);

    return (
        <div data-table-view className={styles.container}>
            <table ref={tableRef} className={styles.table}>
                <TableHeader />
                <TableBody currentItems={pagination.currentItems} editState={editState} navState={navState} viewMode={data.viewMode} readOnly={isReadOnly} />
            </table>
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setPage} />
            <BackToTop containerSelector={SCROLL_SELECTOR} />
        </div>
    );
}
