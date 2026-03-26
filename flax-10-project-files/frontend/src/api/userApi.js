/*
 * Fetches and updates user profiles, settings, home address, and search.
 */

import { fetchApi } from './client';

function normalizeSettingsPayload(payload) {
  return payload?.settings || payload;
}

export function getUserSettings() {
  return fetchApi('/settings/', { cache: 'no-store' }).then(normalizeSettingsPayload);
}

export function updateUserSettings(settings) {
  return fetchApi('/settings/', { method: 'PATCH', body: JSON.stringify(settings) });
}

export function getUserProfile() {
  return fetchApi('/profile/');
}

export function getAnotherUserProfile(userId) {
  return fetchApi(`/users/${userId}/profile/`);
}

export function updateUserProfile(formData) {
  const token = localStorage.getItem('token');
  return fetchApi('/profile/', { method: 'PATCH', headers: { 'Authorization': `Token ${token}` }, body: formData });
}

export function getHomeAddress() {
  return fetchApi('/user/home-address/');
}

export function saveHomeAddress(address, latitude, longitude) {
  return fetchApi('/user/home-address/', {
    method: 'POST',
    body: JSON.stringify({ home_address: address, home_latitude: latitude, home_longitude: longitude }),
  });
}

function buildSearchUrl(query, courseFilter, societyFilter, offset, limit, yearFilter, roleFilter, sortBy) {
  const params = new URLSearchParams({
    q: query,
    offset,
    limit,
    ordering: sortBy === 'name-desc' ? '-name' : 'name',
  });
  if (courseFilter) params.append('course', courseFilter);
  if (societyFilter) params.append('society', societyFilter);
  if (yearFilter) params.append('year', yearFilter);
  if (roleFilter) params.append('role', roleFilter);
  return `/users/search/?${params.toString().replace(/\+/g, '%20')}`;
}

export function searchUsers(query, courseFilter = '', societyFilter = '', offset = 0, limit = 20, yearFilter = '', roleFilter = '', sortBy = 'name') {
  return fetchApi(buildSearchUrl(query, courseFilter, societyFilter, offset, limit, yearFilter, roleFilter, sortBy));
}
