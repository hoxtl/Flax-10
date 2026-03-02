const API_BASE = 'http://localhost:8000/api';

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', ...extra };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json();
}

export function getUserSettings() {
  return apiFetch('/settings/', { headers: authHeaders() });
}

export function updateUserSettings(settings) {
  return apiFetch('/settings/', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(settings) });
}

export function getUserProfile() {
  return apiFetch('/profile/', { headers: authHeaders() });
}

export function updateUserProfile(formData) {
  const token = localStorage.getItem('token');
  return apiFetch('/profile/', { method: 'PATCH', headers: { 'Authorization': `Token ${token}` }, body: formData });
}

export function getHomeAddress() {
  return apiFetch('/user/home-address/', { headers: authHeaders() });
}