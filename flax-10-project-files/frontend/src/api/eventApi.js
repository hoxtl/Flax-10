/*
 * Creates, reads, updates, and deletes calendar events.
 */

import { fetchApi } from "./client";

export async function getEvents(params = {}) {
    const query = buildQueryString(params);
    return fetchApi(`/events/${query}`);
}

export async function createEvent(event_data) {
    return fetchApi(`/events/`, {
        method: "POST",
        body: JSON.stringify(event_data),
    });
}

export async function updateEvent(id, event_data) {
    return fetchApi(`/events/${id}/`, {
        method: "PUT",
        body: JSON.stringify(event_data),
    });
}

export async function deleteEvent(id) {
    return fetchApi(`/events/${id}/`, {
        method: "DELETE",
    });
}

export async function addExceptionDate(eventId, date) {
    return fetchApi(`/events/${eventId}/exception/`, {
        method: "POST",
        body: JSON.stringify({ date }),
    });
}

function buildQueryString(params) {
    const entries = Object.entries(params)
        .filter(([, v]) => v);
    if (entries.length === 0) return '';
    return '?' + new URLSearchParams(entries).toString();
}