const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', ...extra };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json();
}

function normalizeSettingsPayload(payload) {
  return payload?.settings || payload;
}

export function getUserSettings() {
  return apiFetch('/settings/', { headers: authHeaders(), cache: 'no-store' }).then(normalizeSettingsPayload);
}

export function updateUserSettings(settings) {
  return apiFetch('/settings/', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(settings) });
}

export function getUserProfile() {
  return apiFetch('/profile/', { headers: authHeaders() });
}

export function getAnotherUserProfile(userId) {
  return apiFetch(`/users/${userId}/profile/`, { headers: authHeaders() });
}

export function updateUserProfile(formData) {
  const token = localStorage.getItem('token');
  return apiFetch('/profile/', { method: 'PATCH', headers: { 'Authorization': `Token ${token}` }, body: formData });
}

export function getHomeAddress() {
  return apiFetch('/user/home-address/', { headers: authHeaders() });
}

export function saveHomeAddress(address, latitude, longitude) {
  return apiFetch('/user/home-address/', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      home_address: address,
      home_latitude: latitude,
      home_longitude: longitude,
    }),
  });
}

export async function geocodeAddress(address) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1&country=GB`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('User home geocoding has failed...');
  }

  const data = await response.json();

  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export function searchUsers(query, courseFilter = '', societyFilter = '', offset = 0, limit = 20, yearFilter = '', roleFilter = '', sortBy = 'name') {
    let url = `/users/search/?q=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`;
    if (courseFilter) url += `&course=${encodeURIComponent(courseFilter)}`;
    if (societyFilter) url += `&society=${encodeURIComponent(societyFilter)}`;
    if (yearFilter) url += `&year=${encodeURIComponent(yearFilter)}`;
    if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;
    const ordering = sortBy === 'name-desc' ? '-name' : 'name';
    url += `&ordering=${ordering}`;
    return apiFetch(url, { headers: authHeaders() });
}
