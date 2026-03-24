/*
 * DraggableEvent.jsx
 * Event block with drag, resize, and context menu interactions.
 */

import { useRef, useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useDrag } from './hooks/useDragDrop';
import { useEventActions } from './hooks/useCalendarEvents';
import { useEventResize } from './hooks/useEventResize';
import { formatTime } from './utils/dateUtils';
import { getEventType, hasRecurrence } from './utils/eventUtils';
import { useConfirm } from '../../context/ConfirmContext';
import { useTags } from '../../context/TagContext';
import { useEventDelete, useEventModal, useEventPopup } from '../../context/CalendarContext';
import { getEventTheme } from './utils/eventStyleUtils';
import ctxStyles from '../../pages/Tasks/components/TaskCardContextMenu.module.css';
import './DraggableEvent.css';

/** Main entry for an event block. Renders as personal (editable) or other (read-only). */

export function DraggableEvent({ event, style, minWidthForDetails = 80, readOnly }) {
    const isPersonal = getEventType(event) === 'personal';
    if (!isPersonal || readOnly) {
        return <ReadOnlyEvent event={event} style={style} minWidth={minWidthForDetails} />;
    }
    return <EditableEvent event={event} style={style} minWidthForDetails={minWidthForDetails} />;
}

function ReadOnlyEvent({ event, style, minWidth }) {
    const { openPopup } = useEventPopup();
    const theme = getEventTheme(event, useTags());

    const onClick = (e) => {
        e.stopPropagation();
        openPopup(event, e.currentTarget.getBoundingClientRect(), true);
    };

    return (
        <div className={getReadOnlyClassName(event)} style={buildStyle(style, theme)} onClick={onClick} data-event-id={event.id}>
            <EventContent event={event} theme={theme} height={parseFloat(style?.height) || 0} width={parseWidth(style?.width)} minWidth={minWidth} />
        </div>
    );
}

function getReadOnlyClassName(event) {
    const type = getEventType(event);
    if (type === 'society') return 'draggable-event society-event';
    if (type === 'module' || type === 'timetable') return 'draggable-event timetable-event';
    return 'draggable-event';
}

function useDeleteHandler(event, setCtxMenu) {
    const { openDelete } = useEventDelete();
    const confirmFn = useConfirm();
    const handleRecurring = async () => {
        const choice = await confirmFn({
            title: "Delete Recurring Event",
            message: "How would you like to delete this recurring event?",
            confirmText: "Delete ALL", alternateText: "Delete ONLY this", isDanger: true
        });
        if (choice === true) openDelete(event, 'all');
        else if (choice === 'ALTERNATE') openDelete(event, 'occurrence');
    };
    return async () => {
        setCtxMenu(null);
        if (hasRecurrence(event)) await handleRecurring();
        else openDelete(event);
    };
}

function useEventContextMenu(event, setCtxMenu) {
    const { openModal } = useEventModal();
    return {
        handleEdit: () => { setCtxMenu(null); openModal(event); },
        handleDelete: useDeleteHandler(event, setCtxMenu)
    };
}

function useEditableEventState(event) {
    const { editEvent, removeEvent, addException } = useEventActions();
    const { openPopup } = useEventPopup();
    const theme = getEventTheme(event, useTags());
    const refs = { event: useRef(null), resizeEnded: useRef(false), ctxRef: useRef(null) };
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const resize = useEventResize(event, refs.event, editEvent, refs.resizeEnded);
    const [ctxMenu, setCtxMenu] = useState(null);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e) => { if (refs.ctxRef.current && !refs.ctxRef.current.contains(e.target)) setCtxMenu(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ctxMenu]);

    return { openPopup, theme, refs, dragProps, isDragging, resize, ctxMenu, setCtxMenu, menuHandlers: useEventContextMenu(event, setCtxMenu) };
}

function EditableEvent({ event, style, minWidthForDetails }) {
    const state = useEditableEventState(event);
    const onClick = (e) => {
        e.stopPropagation();
        if (state.refs.resizeEnded.current) { state.refs.resizeEnded.current = false; return; }
        if (state.isDragging || state.resize.isResizing) return;
        state.openPopup(event, state.refs.event.current?.getBoundingClientRect());
    };

    return (
        <>
            <EventCard event={event} style={style} theme={state.theme} refs={state.refs} resize={state.resize} 
                isDragging={state.isDragging} dragProps={state.dragProps} onClick={onClick} 
                onContextMenu={(e) => { e.preventDefault(); state.setCtxMenu({ x: e.clientX, y: e.clientY }); }} minWidth={minWidthForDetails} />
            {state.ctxMenu && <EventContextMenu menu={state.ctxMenu} handlers={state.menuHandlers} innerRef={state.refs.ctxRef} />}
        </>
    );
}

function EventContextMenu({ menu, handlers, innerRef }) {
    const menuPos = { '--ctx-top': `${menu.y}px`, '--ctx-left': `${menu.x}px` };
    return (
        <div ref={innerRef} className={ctxStyles.ctxMenu} style={menuPos}>
            <button className={ctxStyles.ctxItem} onClick={handlers.handleEdit}><Pencil size={14} strokeWidth={2} /> Edit</button>
            <div className={ctxStyles.ctxDivider} />
            <button className={`${ctxStyles.ctxItem} ${ctxStyles.ctxItemDanger}`} onClick={handlers.handleDelete}><Trash2 size={14} strokeWidth={2} /> Delete</button>
        </div>
    );
}

function EventCard({ event, style, theme, refs, resize, isDragging, dragProps, onClick, minWidth, onContextMenu }) {
    const height = resize.resizePreview || parseFloat(style?.height) || 0;
    const renderStyle = buildStyle(style, theme, resize.resizePreview);
    const className = `draggable-event ${isDragging ? 'dragging' : ''} ${resize.isResizing ? 'resizing' : ''}`;

    return (
        <div ref={refs.event} className={className} style={renderStyle} onClick={onClick} onContextMenu={onContextMenu} data-event-id={event.id} {...dragProps}>
            <EventContent event={event} theme={theme} height={height} width={parseWidth(style?.width)} minWidth={minWidth} />
            <div className="resize-handle" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); resize.handleResizeStart(e); }} />
        </div>
    );
}

function parseWidth(width) {
    const match = (width || '').match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 100;
}

function EventContent({ event, theme, height, width, minWidth }) {
    const showDetails = height >= 30 && width >= minWidth;
    const isCompact = height < 28;
    const isSociety = event.source === 'society';

    return (
        <div className={`event-content${isCompact ? ' compact' : ''}`}>
            <div className={`event-title${isCompact ? ' compact' : ''}`}>{event.title}</div>
            {isSociety && showDetails && <div className="society-name">{event.society_name}</div>}
            {showDetails && <TimeDisplay event={event} />}
            {height >= 60 && width >= minWidth && event.description && <div className="event-description">{event.description}</div>}
        </div>
    );
}

function TimeDisplay({ event }) {
    return (
        <div className="event-time">
            {formatTime(new Date(event.start_time))} - {formatTime(new Date(event.end_time))}
        </div>
    );
}

function buildStyle(baseStyle, theme, resizePreview) {
    const eventColor = theme.color || 'var(--color-primary)';
    return {
        ...baseStyle,
        height: resizePreview ? `${resizePreview}px` : baseStyle?.height,
        borderLeftColor: eventColor,
        backgroundColor: `color-mix(in srgb, ${eventColor} 12%, transparent)`,
    };
}
