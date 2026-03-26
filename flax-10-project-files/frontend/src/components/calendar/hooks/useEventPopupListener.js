import { useEffect, useRef, useCallback } from 'react';
import { useCalendar, useEventPopup } from '../../../context/CalendarContext';

export function useEventPopupListener() {
    const { allEvents } = useCalendar();
    const { openPopup } = useEventPopup();
    const eventsRef = useRef(allEvents);
    eventsRef.current = allEvents;

    const handleEvent = useCallback((e) => {
        waitAndOpenPopup(e.detail.eventId, eventsRef, openPopup);
    }, [openPopup]);

    useEffect(() => {
        window.addEventListener('open-event-popup', handleEvent);
        return () => window.removeEventListener('open-event-popup', handleEvent);
    }, [handleEvent]);
}

function waitAndOpenPopup(eventId, eventsRef, openPopup) {
    waitForReady(eventId, eventsRef, (element, event) => {
        scrollToEventElement(element);
        setTimeout(() => openPopup(event, element.getBoundingClientRect()), 300);
    });
}

function waitForReady(eventId, eventsRef, callback, maxAttempts = 20) {
    let attempts = 0;
    const check = () => {
        const element = document.querySelector(`[data-event-id="${eventId}"]`);
        const event = findEventById(eventId, eventsRef.current);
        if (element && event) return callback(element, event);
        if (++attempts < maxAttempts) setTimeout(check, 150);
    };
    check();
}

function findEventById(eventId, events) {
    return events.find(e => String(e.id) === String(eventId));
}

function scrollToEventElement(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

