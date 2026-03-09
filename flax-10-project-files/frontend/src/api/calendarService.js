const API_BASE = 'http://localhost:8000/api';

function authHeaders(extra = {}) {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json', ...extra };
}

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) throw new Error(`Calendar API fetch error: ${path}`);
    return response.json();
}

export function getCalendarEvents() {
    return apiFetch('/calendar/events/map/', { headers: authHeaders() });
}