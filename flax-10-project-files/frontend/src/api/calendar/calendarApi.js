/*
 * Fetches calendar events for the campus map view.
 */

import { fetchApi } from '../client';

export function getCalendarEvents() {
    return fetchApi('/calendar/events/map/');
}
