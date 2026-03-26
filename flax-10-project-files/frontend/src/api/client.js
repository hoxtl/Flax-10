/*
 * Shared fetch wrapper that injects auth tokens and normalises errors.
 */

const API_BASE_URL = "/api";

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = buildRequestConfig(options);
  const response = await fetch(url, config);
  return handleResponse(response);
}

function buildRequestConfig(options) {
  const token = localStorage.getItem('token');
  // Do not set Content-Type for FormData — the browser sets it automatically
  // with the correct multipart boundary.
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
  const headers = { ...defaultHeaders, ...options.headers };
  if (token) headers['Authorization'] = `Token ${token}`;
  return { ...options, headers };
}

async function handleResponse(response) {
  if (!response.ok) return handleError(response);
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text.trim()) return null;
  return JSON.parse(text);
}

async function handleError(response) {
  const error = await response.json().catch(() => ({}));
  const message =
    error.detail ||
    error.message ||
    (Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : null) ||
    Object.values(error).flat()[0] ||
    `Request failed (${response.status})`;
  throw new Error(message);
}

