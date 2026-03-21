/*
 * Manages societies, members, tags, announcements, events, and calendar sync.
 */
import { fetchApi } from './client';

const BASE = '/societies';

// Societies
export const fetchSocieties = () => fetchApi(`${BASE}/`);

export const fetchSociety = (id) => fetchApi(`${BASE}/${id}/`);

export const createSociety = (data) => postJson(`${BASE}/`, data);

export const updateSociety = (id, data) => patchJson(`${BASE}/${id}/`, data);

export const deleteSociety = (id) => deleteRequest(`${BASE}/${id}/`);

// Members
export const fetchMembers = (societyId) => fetchApi(`${BASE}/${societyId}/members/`);

export const joinSociety = (societyId) => postJson(`${BASE}/${societyId}/members/`, {});

export const leaveSociety = (societyId, userId) => deleteRequest(`${BASE}/${societyId}/members/${userId}/`);

export const updateMemberRole = (societyId, userId, role) =>
    patchJson(`${BASE}/${societyId}/members/${userId}/`, { role });

export const addCollaborator = (societyId, identifier, role) =>
    postJson(`${BASE}/${societyId}/members/`, { username: identifier, role });

// Tags
export const fetchSocietyTags = (societyId) => fetchApi(`${BASE}/${societyId}/tags/`);

export const createSocietyTag = (societyId, data) => postJson(`${BASE}/${societyId}/tags/`, data);

export const updateSocietyTag = (societyId, tagId, data) =>
    patchJson(`${BASE}/${societyId}/tags/${tagId}/`, data);

export const deleteSocietyTag = (societyId, tagId) =>
    deleteRequest(`${BASE}/${societyId}/tags/${tagId}/`);

// Announcements
export const fetchAnnouncements = (societyId) => fetchApi(`${BASE}/${societyId}/announcements/`);

export const createAnnouncement = (societyId, data, silent = false) =>
    postJson(`${BASE}/${societyId}/announcements/${silentQuery(silent)}`, data);

export const updateAnnouncement = (societyId, announcementId, data, silent = false) =>
    patchJson(`${BASE}/${societyId}/announcements/${announcementId}/${silentQuery(silent)}`, data);

export const deleteAnnouncement = (societyId, announcementId, silent = false) =>
    deleteRequest(`${BASE}/${societyId}/announcements/${announcementId}/${silentQuery(silent)}`);

// Calendar Sync
export const getSyncStatus = (societyId) => fetchApi(`${BASE}/${societyId}/calendar-sync-status/`);

export const syncCalendar = (societyId) => postJson(`${BASE}/${societyId}/calendar-sync/`, {});

export const unsyncCalendar = (societyId) => deleteRequest(`${BASE}/${societyId}/calendar-unsync/`);

// Reporting
export const reportSociety = (societyId, reason) => postJson(`${BASE}/${societyId}/report/`, { reason });
export const unreportSociety = (societyId) => deleteRequest(`${BASE}/${societyId}/report/`);

// Subscription
export const toggleSubscription = (societyId, isSubscribed) =>
    patchJson(`${BASE}/${societyId}/subscribe/`, { is_subscribed: isSubscribed });

// Ratification
export const requestRatification = (societyId) =>
    postJson(`${BASE}/${societyId}/ratification/request/`, {});

// Events
export const fetchSocietyEvent = (societyId, eventId) => fetchApi(`${BASE}/${societyId}/events/${eventId}/`);

export const createSocietyEvent = (societyId, data, silent = false) =>
    postJson(`${BASE}/${societyId}/events/${silentQuery(silent)}`, data);

export const updateSocietyEvent = (societyId, eventId, data, silent = false) =>
    patchJson(`${BASE}/${societyId}/events/${eventId}/${silentQuery(silent)}`, data);

export const deleteSocietyEvent = (societyId, eventId, silent = false) =>
    deleteRequest(`${BASE}/${societyId}/events/${eventId}/${silentQuery(silent)}`);

export const addExceptionDate = (societyId, eventId, date, silent = false) =>
    postJson(`${BASE}/${societyId}/events/${eventId}/exception/${silentQuery(silent)}`, { date });

// Publish changes (sends notification to members)
export const publishChanges = (societyId, changes = {}) => postJson(`${BASE}/${societyId}/publish/`, changes);

// Helpers
function postJson(url, data) {
    return fetchApi(url, { method: 'POST', body: JSON.stringify(data) });
}

function patchJson(url, data) {
    return fetchApi(url, { method: 'PATCH', body: JSON.stringify(data) });
}

function deleteRequest(url) {
    return fetchApi(url, { method: 'DELETE' });
}

function silentQuery(silent) {
    return silent ? '?silent=true' : '';
}
