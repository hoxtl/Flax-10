/*
 * Fetches and updates user profiles, settings, home address, and search.
 */

import { fetchApi } from '../client';

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

export async function geocodeAddress(address) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1&country=GB`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('User home geocoding has failed');
  const data = await response.json();
  if (!data.features?.length) return null;
  const [lng, lat] = data.features[0].center;
  return { latitude: lat, longitude: lng };
}

function buildSearchUrl(query, courseFilter, societyFilter, offset, limit, yearFilter, roleFilter, sortBy) {
  let url = `/users/search/?q=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`;
  if (courseFilter) url += `&course=${encodeURIComponent(courseFilter)}`;
  if (societyFilter) url += `&society=${encodeURIComponent(societyFilter)}`;
  if (yearFilter) url += `&year=${encodeURIComponent(yearFilter)}`;
  if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;
  url += `&ordering=${sortBy === 'name-desc' ? '-name' : 'name'}`;
  return url;
}

export function searchUsers(query, courseFilter = '', societyFilter = '', offset = 0, limit = 20, yearFilter = '', roleFilter = '', sortBy = 'name') {
  return fetchApi(buildSearchUrl(query, courseFilter, societyFilter, offset, limit, yearFilter, roleFilter, sortBy));
}

export async function reverseGeocode(latitude, longitude) {
  try {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address,poi,place`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error: ', error);
    return null;
  }
}
