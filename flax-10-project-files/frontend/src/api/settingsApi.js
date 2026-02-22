const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` };
}

function getToken() {
  return localStorage.getItem('token');
}

export async function patchSettings(body) {
  const response = await fetch(`${API_BASE_URL}/settings/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { ok: response.ok, data };
}

export function saveUserToStorage(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export function hasToken() {
  return !!getToken();
}