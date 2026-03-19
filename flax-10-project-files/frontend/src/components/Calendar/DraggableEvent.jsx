/**
 * DraggableEvent - Event block with drag, resize, and click interactions.
 * Renders personal events as draggable/resizable, others as read-only.
 */
import { useRef, useState, useEffect } from 'react';
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
import './DraggableEvent.css';

/** Event block component with drag-and-drop and resize support. */
export function DraggableEvent({ event, style, minWidthForDetails = 80, readOnly }) {
    const eventType = getEventType(event);
    if (eventType !== 'personal' || readOnly) {
        return <ReadOnlyEvent event={event} style={style} minWidth={minWidthForDetails} />;
    }
    return <EditableEvent event={event} style={style} minWidthForDetails={minWidthForDetails} />;
}

function ReadOnlyEvent({ event, style, minWidth }) {
    const { openPopup } = useEventPopup();
    const theme = getEventTheme(event, useTags());
    const height = parseFloat(style?.height) || 0;
    const width = parseWidthPercent(style?.width);

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        openPopup(event, rect);
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

function useEventContextMenu(event, setCtxMenu) {
    const { removeEvent, addException } = useEventActions();
    const { openModal } = useEventModal();
    const confirmFn = useConfirm();

    const handleDelete = async () => {
        setCtxMenu(null);
        const recurring = hasRecurrence(event);
        const choice = await confirmFn({
            title: recurring ? "Delete Recurring Event" : "Delete Event",
            message: recurring ? "This is a recurring event. How would you like to delete it?" : `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
            confirmText: recurring ? "Delete ALL occurrences" : "Delete",
            alternateText: recurring ? "Delete ONLY this one" : undefined,
            cancelText: "Cancel",
            isDanger: true
        });
        if (choice === true) await executeDelete(event, { removeEvent });
        else if (choice === 'ALTERNATE') await deleteRecurrenceOccurrence(event, { addException });
    };

    const handleEdit = () => { setCtxMenu(null); openModal(event); };

    return { handleEdit, handleDelete };
}

function useEditableEventState(event) {
    const { editEvent } = useEventActions();
    const { openPopup } = useEventPopup();
    const { openModal } = useEventModal();
    const theme = getEventTheme(event, useTags());
    const refs = { event: useRef(null), resizeEnded: useRef(false), ctxRef: useRef(null) };
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const resize = useEventResize(event, refs.event, editEvent, refs.resizeEnded);
    const [ctxMenu, setCtxMenu] = useState(null);

    const menuHandlers = useEventContextMenu(event, setCtxMenu);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e) => { if (refs.ctxRef.current && !refs.ctxRef.current.contains(e.target)) setCtxMenu(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ctxMenu]);

    return { openPopup, theme, refs, dragProps, isDragging, resize, ctxMenu, setCtxMenu, menuHandlers };
}

function EditableEvent({ event, style, minWidthForDetails }) {
    const state = useEditableEventState(event);
    const onClick = (e) => {
        if (state.refs.resizeEnded.current) { state.refs.resizeEnded.current = false; return; }
        if (state.isDragging || state.resize.isResizing) return;
        state.openPopup(event, state.refs.event.current?.getBoundingClientRect());
    };
    const onContextMenu = (e) => { e.preventDefault(); e.stopPropagation(); state.setCtxMenu({ x: e.clientX, y: e.clientY }); };

    return (
        <>
            <EventCard event={event} style={style} theme={state.theme} refs={state.refs}
                resize={state.resize} isDragging={state.isDragging} dragProps={state.dragProps}
                onClick={onClick} onContextMenu={onContextMenu} minWidth={minWidthForDetails} />
            {state.ctxMenu && <EventContextMenu menu={state.ctxMenu} handlers={state.menuHandlers} innerRef={state.refs.ctxRef} />}
        </>
    );
}

function EventContextMenu({ menu, handlers, innerRef }) {
    return (
        <div ref={innerRef} className="event-ctx-menu" style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 99999 }}>
            <button className="event-ctx-item" onClick={handlers.handleEdit}>✏️ Edit</button>
            <div className="event-ctx-divider" />
            <button className="event-ctx-item event-ctx-delete" onClick={handlers.handleDelete}>🗑 Delete</button>
        </div>
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

function buildStyle(baseStyle, theme, resizePreview) {
    const style = { ...baseStyle };
    if (resizePreview) style.height = `${resizePreview}px`;
    style.borderLeftColor = theme.color;
    return style;
}

function buildClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}
