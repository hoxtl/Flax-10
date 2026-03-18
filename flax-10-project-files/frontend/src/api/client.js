const API_BASE_URL = "/api";

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = buildRequestConfig(options);
  const response = await fetch(url, config);
  return handleResponse(response);
}

function buildRequestConfig(options) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Token ${token}`;
  return { headers, ...options };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      error.detail ||
      error.message ||
      (Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : null) ||
      Object.values(error).flat()[0] ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text.trim()) return null;
  return JSON.parse(text);
}