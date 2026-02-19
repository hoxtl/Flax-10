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

export const searchUsers = (query) => fetchApi(`/users/search/?q=${encodeURIComponent(query)}`);

// Tags
export const fetchSocietyTags = (societyId) => fetchApi(`${BASE}/${societyId}/tags/`);

export const createSocietyTag = (societyId, data) => postJson(`${BASE}/${societyId}/tags/`, data);

export const updateSocietyTag = (societyId, tagId, data) =>
    patchJson(`${BASE}/${societyId}/tags/${tagId}/`, data);

export const deleteSocietyTag = (societyId, tagId) =>
    deleteRequest(`${BASE}/${societyId}/tags/${tagId}/`);

// Announcements
export const fetchAnnouncements = (societyId) => fetchApi(`${BASE}/${societyId}/announcements/`);

export const createAnnouncement = (societyId, data) =>
    postJson(`${BASE}/${societyId}/announcements/`, data);

export const updateAnnouncement = (societyId, announcementId, data) =>
    patchJson(`${BASE}/${societyId}/announcements/${announcementId}/`, data);

export const deleteAnnouncement = (societyId, announcementId) =>
    deleteRequest(`${BASE}/${societyId}/announcements/${announcementId}/`);

// Calendar Sync
export const getSyncStatus = (societyId) => fetchApi(`${BASE}/${societyId}/calendar-sync-status/`);

export const syncCalendar = (societyId) => postJson(`${BASE}/${societyId}/calendar-sync/`, {});

export const unsyncCalendar = (societyId) => deleteRequest(`${BASE}/${societyId}/calendar-unsync/`);

// Ratification
export const requestRatification = (societyId) =>
    postJson(`${BASE}/${societyId}/ratification/request/`, {});

// Events
export const fetchSocietyEvent = (societyId, eventId) => fetchApi(`${BASE}/${societyId}/events/${eventId}/`);
export const createSocietyEvent = (societyId, data) =>
    postJson(`${BASE}/${societyId}/events/`, data);

export const updateSocietyEvent = (societyId, eventId, data) =>
    patchJson(`${BASE}/${societyId}/events/${eventId}/`, data);

export const deleteSocietyEvent = (societyId, eventId) =>
    deleteRequest(`${BASE}/${societyId}/events/${eventId}/`);

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
