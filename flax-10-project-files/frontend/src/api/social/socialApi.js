/*
 * Shares and unshares calendars between users.
 */

import { fetchApi } from '../client';

export const shareCalendar = async (userId) => {
    return await fetchApi(`/social/${userId}/share/`, { method: 'POST' });
};

export const unshareCalendar = async (userId) => {
    return await fetchApi(`/social/${userId}/unshare/`, { method: 'POST' });
};

export const getSharedWithMe = async (userId) => {
    return await fetchApi(`/social/${userId}/shared-with-me/`);
};

export const getSharingWith = async (userId) => {
    return await fetchApi(`/social/${userId}/sharing-with/`);
};
