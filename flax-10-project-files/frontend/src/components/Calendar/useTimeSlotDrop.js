import { useState, useCallback } from "react";
import { useDrop } from '../../hooks/useDragDrop';
import { useCalendar } from "../../context/CalendarContext";
import { useEventActions } from "../../hooks/useCalendarEvents";
import { getMinuteOffset, SLOT_HEIGHT } from "./calendarConstants";
import { checkOverlapWithConfirm } from "../../utils/overlapUtils";

export function useTimeSlotDrop(hour, date) {
    const { events } = useCalendar();
    const { addEvent, editEvent } = useEventActions();
    const [highlightQuarter, setHighlightQuarter] = useState(null);

    const handleDrop = useCallback((payload, e) => {
        const minutes = getDropMinutes(hour, e);
        setHighlightQuarter(null);
        dispatchDrop(payload, date, minutes, addEvent, editEvent, events);
    }, [hour, date, addEvent, editEvent, events]);
    const { dropProps, isOver } = useDrop({ accept: ['TAG', 'EVENT'], onDrop: handleDrop });
    const mergedProps = buildMergedProps(dropProps, isOver, setHighlightQuarter);
    return { mergedProps, isOver, highlightQuarter };
}

function getDropMinutes(hour, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const minuteOffset = getMinuteOffset(e.clientY, rect.top);
    return hour * 60 + minuteOffset;
}

function dispatchDrop(payload, date, minutes, addEvent, editEvent, allEvents) {
    if (payload.type === 'TAG') {
        createEventFromTag(payload.data, date, minutes, addEvent, allEvents);
    } else if (payload.type === 'EVENT') {
        moveEventToTime(payload.data, date, minutes, editEvent, allEvents);
    }
}

function buildMergedProps(dropProps, isOver, setHighlightQuarter) {
    return {
        ...dropProps,
        onDragOver: (e) => {
            if (dropProps.onDragOver) dropProps.onDragOver(e);
            const rect = e.currentTarget.getBoundingClientRect();
            const quarter = Math.floor((e.clientY - rect.top) / (SLOT_HEIGHT / 4));
            setHighlightQuarter(Math.min(3, Math.max(0, quarter)));
        },
        onDragLeave: (e) => {
            if (dropProps.onDragLeave) dropProps.onDragLeave(e);
            setHighlightQuarter(null);
        }
    };
}

function createEventFromTag(tag, date, startMinutes, addEvent, allEvents) {
    const start = createDateAtMinutes(date, startMinutes);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (tag.default_duration || 60));
    const newEvent = {
        title: tag.name,
        description: "",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
    };
    if (!checkOverlapWithConfirm(newEvent, allEvents)) return;
    addEvent(newEvent);
}

function moveEventToTime(event, date, startMinutes, editEvent, allEvents) {
    const duration = new Date(event.end_time) - new Date(event.start_time);
    const newStart = createDateAtMinutes(date, startMinutes);
    const newEnd = new Date(newStart.getTime() + duration);
    const baseEventId = extractBaseEventId(event.id);
    const updateData = {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
    };
    const updatedEvent = { ...event, ...updateData };
    const others = allEvents.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!checkOverlapWithConfirm(updatedEvent, others)) return;
    editEvent(baseEventId, updateData);
}

function extractBaseEventId(id) {
    return id > 1000000 ? Math.floor(id / 1000000) : id;
}

function createDateAtMinutes(date, totalMinutes) {
    const result = new Date(date);
    result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return result;
}
