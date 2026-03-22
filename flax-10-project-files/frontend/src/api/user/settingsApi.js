/*
 * Patches user settings and manages auth tokens in localStorage.
 */

export async function patchSettings(body) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/settings/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
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
  return !!localStorage.getItem('token');
}
