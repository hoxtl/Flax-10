import { useRef, useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useDrag } from './hooks/useDragDrop';
import { useEventActions } from './hooks/useCalendarEvents';
import { useEventModal, useEventPopup } from '../../context/CalendarContext';
import { useEventResize } from './hooks/useEventResize';
import { formatTime } from './utils/dateUtils';
import { getEventType, hasRecurrence } from './utils/eventUtils';
import { executeDelete, deleteRecurrenceOccurrence } from './utils/formUtils';
import { useConfirm } from '../../context/ConfirmContext';
import { useTags } from '../../context/TagContext';
import { getEventTheme } from './utils/eventStyleUtils';
import HoldConfirmModal from '../common/HoldConfirmModal/HoldConfirmModal';
import './DraggableEvent.css';

export function DraggableEvent({ event, style, minWidthForDetails = 80, readOnly }) {
    const eventType = getEventType(event);
    if (eventType !== 'personal' || readOnly) {
        return <ReadOnlyEvent event={event} style={style} minWidth={minWidthForDetails} />;
    }
    return <EditableEvent event={event} style={style} minWidthForDetails={minWidthForDetails} />;
}

function ReadOnlyEvent({ event, style, minWidth }) {
    const { openPopup } = useEventPopup();
    const tags = useTags();
    const theme = getEventTheme(event, tags);
    const height = parseFloat(style?.height) || 0;
    const width = parseWidthPercent(style?.width);

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        openPopup(event, rect, true);
    };

    return (
        <div className={getReadOnlyClassName(event)} style={buildStyle(style, theme)} onClick={handleClick} data-event-id={event.id}>
            <EventContent event={event} theme={theme} height={height} width={width} minWidth={minWidth} />
        </div>
    );
}

function getReadOnlyClassName(event) {
    const type = getEventType(event);
    if (type === 'society') return 'draggable-event society-event';
    if (type === 'module' || type === 'timetable') return 'draggable-event timetable-event';
    return 'draggable-event';
}

function EditableEvent({ event, style, minWidthForDetails }) {
    const { editEvent, removeEvent, addException } = useEventActions();
    const { openPopup } = useEventPopup();
    const { openModal } = useEventModal();
    const confirmFn = useConfirm();
    const theme = getEventTheme(event, useTags());
    const refs = { event: useRef(null), resizeEnded: useRef(false) };
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const resize = useEventResize(event, refs.event, editEvent, refs.resizeEnded);
    const [ctxMenu, setCtxMenu] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const ctxRef = useRef(null);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e) => { if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ctxMenu]);

    const onClick = (e) => {
        if (refs.resizeEnded.current) { refs.resizeEnded.current = false; return; }
        if (isDragging || resize.isResizing) return;
        const rect = refs.event.current?.getBoundingClientRect();
        openPopup(event, rect, false);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    };

    const handleEdit = () => {
        setCtxMenu(null);
        openModal(event);
    };

    const handleDelete = async () => {
        setCtxMenu(null);
        const recurring = hasRecurrence(event);
        if (recurring) {
            const choice = await confirmFn({
                title: "Delete Recurring Event",
                message: "This is a recurring event. How would you like to delete it?",
                confirmText: "Delete ALL occurrences",
                alternateText: "Delete ONLY this one",
                cancelText: "Cancel",
                isDanger: true
            });
            if (choice === true) await executeDelete(event, { removeEvent });
            else if (choice === 'ALTERNATE') await deleteRecurrenceOccurrence(event, { addException });
        } else {
            setDeleteTarget(event);
        }
    };

    return (
        <>
            <EventCard event={event} style={style} theme={theme} refs={refs}
                resize={resize} isDragging={isDragging} dragProps={dragProps}
                onClick={onClick} minWidth={minWidthForDetails}
                onContextMenu={handleContextMenu} />
            {ctxMenu && (
                <div ref={ctxRef} className="event-ctx-menu" style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 99999 }}>
                    <button className="event-ctx-item" onClick={handleEdit}><Pencil size={14} strokeWidth={2} /> Edit</button>
                    <div className="event-ctx-divider" />
                    <button className="event-ctx-item event-ctx-delete" onClick={handleDelete}><Trash2 size={14} strokeWidth={2} /> Delete</button>
                </div>
            )}
            {deleteTarget && (
                <HoldConfirmModal
                    title="Delete Event"
                    warningText={`"${deleteTarget.title}" will be permanently deleted. This action cannot be undone.`}
                    cancelLabel="Keep Event"
                    holdLabel="Hold to Delete"
                    onConfirm={async () => {
                        await executeDelete(deleteTarget, { removeEvent });
                        setDeleteTarget(null);
                    }}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
}

function EventCard({ event, style, theme, refs, resize, isDragging, dragProps, onClick, minWidth, onContextMenu }) {
    const height = resize.resizePreview || parseFloat(style?.height) || 0;
    const width = parseWidthPercent(style?.width);
    const className = buildClassName(isDragging, resize.isResizing);
    const renderStyle = buildStyle(style, theme, resize.resizePreview);

    return (
        <div ref={refs.event} className={className} style={renderStyle} onClick={onClick} onContextMenu={onContextMenu} data-event-id={event.id} {...dragProps}>
            <EventContent event={event} theme={theme} height={height} width={width} minWidth={minWidth} />
            <ResizeHandle onStart={resize.handleResizeStart} />
        </div>
    );
}

function parseWidthPercent(width) {
    if (!width) return 100;
    const match = width.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 100;
}

function ResizeHandle({ onStart }) {
    const onMouseDown = (e) => { e.stopPropagation(); e.preventDefault(); onStart(e); };
    return <div className="resize-handle" draggable={false} onMouseDown={onMouseDown} />;
}

function EventContent({ event, theme, height, width, minWidth }) {
    const showTime = height >= 30 && width >= minWidth;
    const showDesc = height >= 60 && width >= minWidth;
    const isSociety = event.source === 'society';

    return (
        <div className="event-content">
            <div className="event-title">
                {event.title}
            </div>
            {isSociety && showTime && <div className="society-name">{event.society_name}</div>}
            {showTime && <TimeDisplay event={event} />}
            {showDesc && event.description && <div className="event-description">{event.description}</div>}
        </div>
    );
}

function TimeDisplay({ event }) {
    const startTime = formatTime(new Date(event.start_time));
    const endTime = formatTime(new Date(event.end_time));
    return <div className="event-time">{startTime} - {endTime}</div>;
}

function hexToRgb(hex) {
    const h = (hex || '#7B6751').replace('#', '');
    const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

function buildStyle(baseStyle, theme, resizePreview) {
    const style = { ...baseStyle };
    if (resizePreview) style.height = `${resizePreview}px`;
    style.borderLeftColor = theme.color;
    style.backgroundColor = `rgba(${hexToRgb(theme.color)}, 0.12)`;
    return style;
}

function buildClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}
