/*
 * Creates, renames, and deletes timetable schedules.
 */

import { fetchApi } from './client';

export function getSchedules() {
  return fetchApi('/schedules/');
}

export function createSchedule(payload) {
  return fetchApi('/schedules/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function renameSchedule(id, title) {
  return fetchApi(`/schedules/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export function deleteSchedule(id) {
  return fetchApi(`/schedules/${id}/`, { method: 'DELETE' });
}
